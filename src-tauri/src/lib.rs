pub mod models;
pub mod db;
pub mod parser;
pub mod omdb;
pub mod importer;
pub mod commands;

use rusqlite::Connection;
use std::sync::Mutex;
use std::sync::atomic::AtomicBool;

pub struct DbState(pub Mutex<Connection>);
pub struct ImportCancelState(pub AtomicBool);

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            let app_data_dir = app.path().app_data_dir().unwrap();
            std::fs::create_dir_all(&app_data_dir).ok();
            
            let conn = db::init(&app_data_dir).expect("Failed to init SQLite DB");
            
            let dir = db::get_setting(&conn, "watched_directory").unwrap_or_default().unwrap_or_default();
            
            app.manage(DbState(Mutex::new(conn)));
            app.manage(ImportCancelState(AtomicBool::new(false)));

            if !dir.is_empty() {
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    importer::sync_watched_directory(&dir, app_handle).await;
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::set_setting,
            commands::get_movies,
            commands::delete_movie,
            commands::search_omdb_by_title,
            commands::search_omdb_multiple,
            commands::replace_movie,
            commands::add_movie_by_id,
            commands::set_watched_directory,
            commands::clear_watched_directory,
            commands::clear_database,
            commands::sync_watched_directory_now,
            commands::cancel_import,
            commands::parse_filename,
            commands::get_app_version,
            commands::check_for_updates,
            commands::show_in_explorer,
            commands::open_external,
            commands::get_failed_imports,
            commands::resolve_failed_import,
            commands::import_imdb_csv
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
