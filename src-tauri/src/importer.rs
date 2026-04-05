use crate::models::{ImportComplete, ImportProgress, WatchedDirSyncResult, Movie};
use crate::parser::parse_movie_title;
use tauri::{AppHandle, Manager, Emitter};
use std::path::{Path};
use std::collections::{HashSet};
use tauri::State;
use std::fs;
use crate::omdb::OmdbError;
use std::sync::atomic::Ordering;

pub struct ScanResult {
    pub entries: Vec<(String, String)>, // (parsed_title, absolute_path)
}

pub fn scan_directory(path: &Path) -> ScanResult {
    let mut entries = Vec::new();
    let exts = ["mp4", "mkv", "avi", "mov", "wmv", "flv"];

    let mut q = vec![path.to_path_buf()];
    while let Some(current) = q.pop() {
        if let Ok(dir_entries) = fs::read_dir(&current) {
            for entry in dir_entries.filter_map(|e| e.ok()) {
                let p = entry.path();
                if p.is_dir() {
                    q.push(p);
                } else if p.is_file() {
                    if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
                        if exts.contains(&ext.to_lowercase().as_str()) {
                            if let Some(file_name) = p.file_name().and_then(|n| n.to_str()) {
                                let parsed = parse_movie_title(file_name);
                                if !parsed.is_empty() {
                                    entries.push((parsed, p.to_string_lossy().to_string()));
                                } else {
                                    #[cfg(debug_assertions)]
                                    println!("[Scan Warning] Could not parse movie title from filename: '{}'", file_name);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    ScanResult { entries }
}

pub fn detect_titles(scan: &ScanResult) -> Vec<(String, String)> {
    scan.entries.clone()
}

pub async fn run_import(
    to_process: Vec<(String, String)>,
    existing_file_names: Vec<String>,
    clean_start: bool,
    api_key: &str,
    app_handle: AppHandle
) -> ImportComplete {
    use crate::omdb::{fetch_by_title, download_poster};
    use crate::db;
    
    let mut jobs = to_process;
    if !clean_start {
        let existing_lower: HashSet<String> = existing_file_names.into_iter().map(|s| s.to_lowercase()).collect();
        jobs.retain(|(_title, path)| !existing_lower.contains(&path.to_lowercase()));
    }

    let total = jobs.len() as u32;
    let mut imported = 0;
    let mut failed = 0;
    let mut failed_items = Vec::new(); // NEW
    let mut rate_limited = false;
    let mut cancelled = false;
    let start_time = std::time::Instant::now();

    let app_data_dir = app_handle.path().app_data_dir().unwrap();
    let posters_dir = app_data_dir.join("posters");
    std::fs::create_dir_all(&posters_dir).ok();

    let state = app_handle.state::<crate::DbState>();
    let cancel_state = app_handle.state::<crate::ImportCancelState>();

    for (i, (title, path)) in jobs.iter().enumerate() {
        // Check for cancellation
        if cancel_state.0.load(Ordering::SeqCst) {
            cancelled = true;
            break;
        }

        match fetch_by_title(title, api_key).await {
            Ok(res) => {
                let poster_path = if res.poster != "N/A" && !res.poster.is_empty() {
                    let p = posters_dir.join(format!("{}.jpg", res.imdb_id));
                    if let Err(err) = download_poster(&res.poster, &p).await {
                        #[cfg(debug_assertions)]
                        println!("[Import] Failed to download poster for '{}': {:?}", res.title, err);
                        None
                    } else {
                        Some(p.to_string_lossy().to_string())
                    }
                } else {
                    None
                };

                let ratings_json = serde_json::to_string(&res.ratings).unwrap_or_default();

                let movie = Movie {
                    id: 0,
                    imdb_id: res.imdb_id,
                    file_name: path.clone(),
                    title: res.title,
                    year: Some(res.year),
                    rated: Some(res.rated),
                    released: Some(res.released),
                    runtime: Some(res.runtime),
                    genre: Some(res.genre),
                    director: Some(res.director),
                    writer: Some(res.writer),
                    actors: Some(res.actors),
                    plot: Some(res.plot),
                    language: Some(res.language),
                    country: Some(res.country),
                    awards: Some(res.awards),
                    poster_url: Some(res.poster),
                    poster_path,
                    metascore: Some(res.metascore),
                    imdb_rating: Some(res.imdb_rating),
                    imdb_votes: Some(res.imdb_votes),
                    box_office: Some(res.box_office),
                    ratings_json: Some(ratings_json),
                    added_at: "".to_string(),
                };

                {
                    if let Ok(conn) = state.0.lock() {
                        if let Err(err) = db::insert_movie(&conn, &movie) {
                            #[cfg(debug_assertions)]
                            println!("[Import Db Error] Failed to insert '{}' (file: {}): {:?}", movie.title, movie.file_name, err);
                            failed += 1;
                        } else {
                            // If it was in failed_imports, remove it now that it succeeded
                            let _ = db::delete_failed_import_by_file_name(&conn, &movie.file_name);
                            
                            #[cfg(debug_assertions)]
                            println!("[Import Success] Inserted '{}'", movie.title);
                            imported += 1;
                        }
                    } else {
                        #[cfg(debug_assertions)]
                        println!("[Import Lock Error] Failed to acquire DB lock for '{}'", movie.title);
                        // Depending on design, you might still want to increment fail count, 
                        // but it seems the original didn't explicitly fail it. Let's fail it.
                        failed += 1;
                    }
                }

            }
            Err(e) => {
                match e {
                    OmdbError::RateLimited => {
                        #[cfg(debug_assertions)]
                        println!("[Import OMDb Error] Rate limit reached while fetching '{}'", title);
                        rate_limited = true;
                        {
                            if let Ok(conn) = state.0.lock() {
                                let today = chrono::Local::now().format("%Y-%m-%d").to_string();
                                let _ = db::set_setting(&conn, "api_limit_reached_on", &today);
                            }
                        }
                        break;
                    }
                    _ => {
                        #[cfg(debug_assertions)]
                        println!("[Import OMDb Error] Failed to fetch data for '{}': {:?}", title, e);
                        
                        if let OmdbError::NotFound = e {
                             if let Ok(conn) = state.0.lock() {
                                 let _ = db::insert_failed_import(&conn, path, title, &format!("{:?}", e));
                                 failed_items.push(crate::models::FailedImport {
                                     file_name: path.clone(),
                                     parsed_title: title.clone(),
                                 });
                             }
                        }
                        
                        failed += 1;
                    }
                }
            }
        }

        let elapsed_secs = start_time.elapsed().as_secs_f64();
        let _ = app_handle.emit("import-progress", ImportProgress {
            current: (i + 1) as u32,
            total,
            current_title: title.clone(),
            elapsed_secs,
        });
    }

    let result = ImportComplete {
        total_imported: imported,
        failed,
        rate_limited,
        cancelled,
        failed_items,
    };
    
    let _ = app_handle.emit("import-complete", result.clone());
    result
}

pub async fn sync_watched_directory(
    dir: &str,
    app_handle: AppHandle
) {
    use crate::db;
    
    let state: State<crate::DbState> = app_handle.state();
    
    let (api_key, existing_paths, failed_paths, all_movies, limit_reached_on) = {
        let conn_guard = state.0.lock().unwrap();
        let key = db::get_setting(&conn_guard, "omdb_api_key").unwrap_or_default().unwrap_or_default();
        let existing = db::get_movie_file_names(&conn_guard).unwrap_or_default();
        let failed = db::get_failed_import_file_names(&conn_guard).unwrap_or_default();
        let all = db::get_all_movies(&conn_guard).unwrap_or_default();
        let limit = db::get_setting(&conn_guard, "api_limit_reached_on").unwrap_or_default().unwrap_or_default();
        (key, existing, failed, all, limit)
    };
    
    if api_key.is_empty() { return; }

    // Check rate limit before even scanning
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    if limit_reached_on == today {
        let _ = app_handle.emit("watched-dir-sync-result", WatchedDirSyncResult {
            new_count: 0,
            removed_count: 0,
            rate_limited: true,
        });
        return;
    }

    let scan = scan_directory(Path::new(dir));
    let detected_entries = detect_titles(&scan);
    
    let current_lower: HashSet<String> = detected_entries.iter().map(|(_, p)| p.to_lowercase()).collect();
    let mut removed_count = 0;
    
    {
        let conn_guard = state.0.lock().unwrap();
        for movie in all_movies {
            if !current_lower.contains(&movie.file_name.to_lowercase()) && db::delete_movie_by_file_name(&conn_guard, &movie.file_name).is_ok() {
                removed_count += 1;
                if let Some(path) = movie.poster_path {
                    let _ = std::fs::remove_file(path);
                }
            }
        }
    }
    
    let new_entries: Vec<(String, String)> = detected_entries.into_iter().filter(|(_, p)| {
        let existing_lower: HashSet<String> = existing_paths.iter().map(|s| s.to_lowercase()).collect();
        let failed_lower: HashSet<String> = failed_paths.iter().map(|s| s.to_lowercase()).collect();
        !existing_lower.contains(&p.to_lowercase()) && !failed_lower.contains(&p.to_lowercase())
    }).collect();
    
    if !new_entries.is_empty() {
        run_import(new_entries, vec![], false, &api_key, app_handle.clone()).await;
    } else {
        let _ = app_handle.emit("watched-dir-sync-result", WatchedDirSyncResult {
            new_count: 0,
            removed_count,
            rate_limited: false,
        });
    }
}
