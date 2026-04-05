use std::collections::{HashMap};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;
use crate::models::{Movie, OmdbResponse, OmdbSearchResult, WatchedDirSyncResult, UpdateInfo};
use crate::{db, omdb, importer};
use std::sync::atomic::Ordering;

#[tauri::command]
pub async fn get_settings(state: State<'_, crate::DbState>) -> Result<HashMap<String, String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut settings = HashMap::new();
    let keys = ["omdb_api_key", "watched_directory", "first_time_completed", "api_limit_reached_on"];
    for k in keys {
        if let Some(v) = db::get_setting(&conn, k).unwrap_or_default() {
            settings.insert(k.to_string(), v);
        }
    }
    Ok(settings)
}

#[tauri::command]
pub async fn set_setting(key: String, value: String, state: State<'_, crate::DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::set_setting(&conn, &key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_movies(state: State<'_, crate::DbState>) -> Result<Vec<Movie>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_all_movies(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_movie(imdb_id: String, state: State<'_, crate::DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_movie_by_imdb_id(&conn, &imdb_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_omdb_by_title(title: String, state: State<'_, crate::DbState>) -> Result<OmdbResponse, String> {
    let api_key = {
        let conn = state.0.lock().unwrap();
        db::get_setting(&conn, "omdb_api_key").unwrap_or_default().unwrap_or_default()
    };
    if api_key.is_empty() { return Err("no_api_key".into()); }
    omdb::fetch_by_title(&title, &api_key).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_omdb_multiple(query: String, state: State<'_, crate::DbState>) -> Result<Vec<OmdbSearchResult>, String> {
    let api_key = {
        let conn = state.0.lock().unwrap();
        db::get_setting(&conn, "omdb_api_key").unwrap_or_default().unwrap_or_default()
    };
    if api_key.is_empty() { return Err("no_api_key".into()); }
    omdb::search(&query, &api_key).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn replace_movie(old_id: String, new_id: String, file_name: String, state: State<'_, crate::DbState>, app_handle: AppHandle) -> Result<(), String> {
    {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        db::delete_movie_by_imdb_id(&conn, &old_id).map_err(|e| e.to_string())?;
    }
    let mut movie = add_movie_by_id(new_id, state, app_handle.clone()).await?;
    {
        movie.file_name = file_name;
        let fresh_state: State<crate::DbState> = app_handle.state();
        let conn = fresh_state.0.lock().map_err(|e| e.to_string())?;
        db::insert_movie(&conn, &movie).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn add_movie_by_id(imdb_id: String, state: State<'_, crate::DbState>, app_handle: AppHandle) -> Result<Movie, String> {
    let api_key = {
        let conn = state.0.lock().unwrap();
        db::get_setting(&conn, "omdb_api_key").unwrap_or_default().unwrap_or_default()
    };
    if api_key.is_empty() { return Err("no_api_key".into()); }
    let res = omdb::fetch_by_id(&imdb_id, &api_key).await.map_err(|e| e.to_string())?;
    let app_data_dir = app_handle.path().app_data_dir().unwrap();
    let posters_dir = app_data_dir.join("posters");
    std::fs::create_dir_all(&posters_dir).ok();

    let poster_path = if res.poster != "N/A" && !res.poster.is_empty() {
        let p = posters_dir.join(format!("{}.jpg", res.imdb_id));
        if omdb::download_poster(&res.poster, &p).await.is_err() {
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
        file_name: res.title.clone(),
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

    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert_movie(&conn, &movie).map_err(|e| e.to_string())?;
    Ok(movie)
}

#[tauri::command]
pub async fn set_watched_directory(state: State<'_, crate::DbState>, app_handle: AppHandle) -> Result<String, String> {
    if let Some(path) = app_handle.dialog().file().blocking_pick_folder() {
        let path_str = path.to_string();
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        db::set_setting(&conn, "watched_directory", &path_str).map_err(|e| e.to_string())?;
        Ok(path_str)
    } else {
        Err("User cancelled".into())
    }
}

#[tauri::command]
pub async fn clear_watched_directory(state: State<'_, crate::DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::set_setting(&conn, "watched_directory", "").map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_database(state: State<'_, crate::DbState>, app_handle: AppHandle) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM movies", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM settings WHERE key NOT IN ('omdb_api_key')", []).map_err(|e| e.to_string())?;
    let app_data_dir = app_handle.path().app_data_dir().unwrap();
    let posters_dir = app_data_dir.join("posters");
    if posters_dir.exists() {
        let _ = std::fs::remove_dir_all(&posters_dir);
        let _ = std::fs::create_dir_all(&posters_dir);
    }
    Ok(())
}

#[tauri::command]
pub async fn sync_watched_directory_now(state: State<'_, crate::DbState>, cancel_state: State<'_, crate::ImportCancelState>, app_handle: AppHandle) -> Result<WatchedDirSyncResult, String> {
    let dir = {
        let conn = state.0.lock().unwrap();
        db::get_setting(&conn, "watched_directory").unwrap_or_default().unwrap_or_default()
    };
    if dir.is_empty() { return Err("No watched dir".into()); }
    
    cancel_state.0.store(false, Ordering::SeqCst);
    importer::sync_watched_directory(&dir, app_handle).await;
    Ok(WatchedDirSyncResult { new_count: 0, removed_count: 0, rate_limited: false }) 
}

#[tauri::command]
pub async fn cancel_import(cancel_state: State<'_, crate::ImportCancelState>) -> Result<(), String> {
    cancel_state.0.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn parse_filename(filename: String) -> String {
    crate::parser::parse_movie_title(&filename)
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub async fn check_for_updates() -> Result<UpdateInfo, String> {
    Ok(UpdateInfo { has_update: false, version: None, body: None, url: None })
}

#[tauri::command]
pub async fn show_in_explorer(path: String, app_handle: AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app_handle.opener().reveal_item_in_dir(path).map_err(|e| format!("{:?}", e))
}

#[tauri::command]
pub async fn open_external(url: String, app_handle: AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app_handle.opener().open_url(url, None::<String>).map_err(|e| format!("{:?}", e))
}

#[tauri::command]
pub async fn get_failed_imports(state: State<'_, crate::DbState>) -> Result<Vec<(String, String)>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_all_failed_imports(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resolve_failed_import(file_name: String, imdb_id: String, state: State<'_, crate::DbState>, app_handle: AppHandle) -> Result<(), String> {
    let api_key = {
        let conn = state.0.lock().unwrap();
        db::get_setting(&conn, "omdb_api_key").unwrap_or_default().unwrap_or_default()
    };
    if api_key.is_empty() { return Err("no_api_key".into()); }
    
    let res = omdb::fetch_by_id(&imdb_id, &api_key).await.map_err(|e| e.to_string())?;
    
    let app_data_dir = app_handle.path().app_data_dir().unwrap();
    let posters_dir = app_data_dir.join("posters");
    std::fs::create_dir_all(&posters_dir).ok();

    let poster_path = if res.poster != "N/A" && !res.poster.is_empty() {
        let p = posters_dir.join(format!("{}.jpg", res.imdb_id));
        if omdb::download_poster(&res.poster, &p).await.is_err() {
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
        file_name,
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

    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::insert_movie(&conn, &movie).map_err(|e| e.to_string())?;
    db::delete_failed_import_by_file_name(&conn, &movie.file_name).map_err(|e| e.to_string())?;
    
    Ok(())
}
