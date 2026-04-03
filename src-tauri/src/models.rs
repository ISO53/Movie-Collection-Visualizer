use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Movie {
    pub id: i64,
    pub imdb_id: String,
    pub file_name: String,
    pub title: String,
    pub year: Option<String>,
    pub rated: Option<String>,
    pub released: Option<String>,
    pub runtime: Option<String>,
    pub genre: Option<String>,
    pub director: Option<String>,
    pub writer: Option<String>,
    pub actors: Option<String>,
    pub plot: Option<String>,
    pub language: Option<String>,
    pub country: Option<String>,
    pub awards: Option<String>,
    pub poster_url: Option<String>,
    pub poster_path: Option<String>,
    pub metascore: Option<String>,
    pub imdb_rating: Option<String>,
    pub imdb_votes: Option<String>,
    pub box_office: Option<String>,
    pub ratings_json: Option<String>,
    pub added_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OmdbResponse {
    #[serde(rename = "imdbID", default)]
    pub imdb_id: String,
    #[serde(rename = "Title", default)]
    pub title: String,
    #[serde(rename = "Year", default)]
    pub year: String,
    #[serde(rename = "Rated", default)]
    pub rated: String,
    #[serde(rename = "Released", default)]
    pub released: String,
    #[serde(rename = "Runtime", default)]
    pub runtime: String,
    #[serde(rename = "Genre", default)]
    pub genre: String,
    #[serde(rename = "Director", default)]
    pub director: String,
    #[serde(rename = "Writer", default)]
    pub writer: String,
    #[serde(rename = "Actors", default)]
    pub actors: String,
    #[serde(rename = "Plot", default)]
    pub plot: String,
    #[serde(rename = "Language", default)]
    pub language: String,
    #[serde(rename = "Country", default)]
    pub country: String,
    #[serde(rename = "Awards", default)]
    pub awards: String,
    #[serde(rename = "Poster", default)]
    pub poster: String,
    #[serde(rename = "Ratings", default)]
    pub ratings: Vec<OmdbRating>,
    #[serde(rename = "Metascore", default)]
    pub metascore: String,
    #[serde(rename = "imdbRating", default)]
    pub imdb_rating: String,
    #[serde(rename = "imdbVotes", default)]
    pub imdb_votes: String,
    #[serde(rename = "BoxOffice", default)]
    pub box_office: String,
    #[serde(rename = "Response", default)]
    pub response: String,
    #[serde(rename = "Error", default)]
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OmdbRating {
    #[serde(rename = "Source")]
    pub source: String,
    #[serde(rename = "Value")]
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OmdbSearchResult {
    #[serde(alias = "imdbID")]
    pub imdb_id: String,
    #[serde(alias = "Title")]
    pub title: String,
    #[serde(alias = "Year")]
    pub year: String,
    #[serde(alias = "Poster")]
    pub poster: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImportProgress {
    pub current: u32,
    pub total: u32,
    pub current_title: String,
    pub elapsed_secs: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImportComplete {
    pub total_imported: u32,
    pub failed: u32,
    pub rate_limited: bool,
    pub cancelled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WatchedDirSyncResult {
    pub new_count: u32,
    pub removed_count: u32,
    pub rate_limited: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub has_update: bool,
    pub version: Option<String>,
    pub body: Option<String>,
    pub url: Option<String>,
}
