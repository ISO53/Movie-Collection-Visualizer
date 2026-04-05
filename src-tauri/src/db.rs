use rusqlite::{params, Connection, Result, OptionalExtension};
use std::path::Path;
use crate::models::Movie;

pub fn init(app_data_dir: &Path) -> Result<Connection> {
    let db_path = app_data_dir.join("mcv.db");
    let conn = Connection::open(db_path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS movies (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            imdb_id         TEXT UNIQUE NOT NULL,
            file_name       TEXT NOT NULL,
            title           TEXT NOT NULL,
            year            TEXT,
            rated           TEXT,
            released        TEXT,
            runtime         TEXT,
            genre           TEXT,
            director        TEXT,
            writer          TEXT,
            actors          TEXT,
            plot            TEXT,
            language        TEXT,
            country         TEXT,
            awards          TEXT,
            poster_url      TEXT,
            poster_path     TEXT,
            metascore       TEXT,
            imdb_rating     TEXT,
            imdb_votes      TEXT,
            box_office      TEXT,
            ratings_json    TEXT,
            added_at        TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS failed_imports (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name       TEXT UNIQUE NOT NULL,
            parsed_title    TEXT NOT NULL,
            error           TEXT NOT NULL,
            last_attempt    TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;

    Ok(conn)
}

pub fn get_all_movies(conn: &Connection) -> Result<Vec<Movie>> {
    let mut stmt = conn.prepare("SELECT id, imdb_id, file_name, title, year, rated, released, runtime, genre, director, writer, actors, plot, language, country, awards, poster_url, poster_path, metascore, imdb_rating, imdb_votes, box_office, ratings_json, added_at FROM movies")?;
    let movie_iter = stmt.query_map([], |row| {
        Ok(Movie {
            id: row.get(0)?,
            imdb_id: row.get(1)?,
            file_name: row.get(2)?,
            title: row.get(3)?,
            year: row.get(4)?,
            rated: row.get(5)?,
            released: row.get(6)?,
            runtime: row.get(7)?,
            genre: row.get(8)?,
            director: row.get(9)?,
            writer: row.get(10)?,
            actors: row.get(11)?,
            plot: row.get(12)?,
            language: row.get(13)?,
            country: row.get(14)?,
            awards: row.get(15)?,
            poster_url: row.get(16)?,
            poster_path: row.get(17)?,
            metascore: row.get(18)?,
            imdb_rating: row.get(19)?,
            imdb_votes: row.get(20)?,
            box_office: row.get(21)?,
            ratings_json: row.get(22)?,
            added_at: row.get(23)?,
        })
    })?;

    let mut movies = Vec::new();
    for movie in movie_iter {
        movies.push(movie?);
    }
    Ok(movies)
}

pub fn insert_movie(conn: &Connection, movie: &Movie) -> Result<()> {
    conn.execute(
        "INSERT INTO movies (imdb_id, file_name, title, year, rated, released, runtime, genre, director, writer, actors, plot, language, country, awards, poster_url, poster_path, metascore, imdb_rating, imdb_votes, box_office, ratings_json)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)
        ON CONFLICT(imdb_id) DO UPDATE SET file_name=excluded.file_name",
        params![
            movie.imdb_id,
            movie.file_name,
            movie.title,
            movie.year,
            movie.rated,
            movie.released,
            movie.runtime,
            movie.genre,
            movie.director,
            movie.writer,
            movie.actors,
            movie.plot,
            movie.language,
            movie.country,
            movie.awards,
            movie.poster_url,
            movie.poster_path,
            movie.metascore,
            movie.imdb_rating,
            movie.imdb_votes,
            movie.box_office,
            movie.ratings_json,
        ],
    )?;
    Ok(())
}

pub fn delete_movie_by_imdb_id(conn: &Connection, imdb_id: &str) -> Result<()> {
    conn.execute("DELETE FROM movies WHERE imdb_id = ?1", params![imdb_id])?;
    Ok(())
}

pub fn delete_movie_by_file_name(conn: &Connection, file_name: &str) -> Result<()> {
    conn.execute("DELETE FROM movies WHERE file_name = ?1", params![file_name])?;
    Ok(())
}

pub fn get_movie_file_names(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT file_name FROM movies")?;
    let rows = stmt.query_map([], |row| row.get(0))?;
    let mut names = Vec::new();
    for name in rows {
        names.push(name?);
    }
    Ok(names)
}

pub fn movie_exists_by_file_name(conn: &Connection, file_name: &str) -> Result<bool> {
    let mut stmt = conn.prepare("SELECT 1 FROM movies WHERE file_name = ?1 LIMIT 1")?;
    let exists = stmt.query_row(params![file_name], |_| Ok(true)).optional()?.unwrap_or(false);
    Ok(exists)
}

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>> {
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    stmt.query_row(params![key], |row| row.get(0)).optional()
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        params![key, value],
    )?;
    Ok(())
}

pub fn insert_failed_import(conn: &Connection, file_name: &str, parsed_title: &str, error: &str) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO failed_imports (file_name, parsed_title, error, last_attempt) VALUES (?1, ?2, ?3, datetime('now'))",
        params![file_name, parsed_title, error],
    )?;
    Ok(())
}

pub fn delete_failed_import_by_file_name(conn: &Connection, file_name: &str) -> Result<()> {
    conn.execute("DELETE FROM failed_imports WHERE file_name = ?1", params![file_name])?;
    Ok(())
}

pub fn get_failed_import_file_names(conn: &Connection) -> Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT file_name FROM failed_imports")?;
    let rows = stmt.query_map([], |row| row.get(0))?;
    let mut names = Vec::new();
    for name in rows {
        names.push(name?);
    }
    Ok(names)
}

pub fn get_all_failed_imports(conn: &Connection) -> Result<Vec<(String, String)>> {
    let mut stmt = conn.prepare("SELECT file_name, parsed_title FROM failed_imports")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    let mut items = Vec::new();
    for item in rows {
        items.push(item?);
    }
    Ok(items)
}
