use crate::models::{OmdbResponse, OmdbSearchResult};
use std::path::Path;
use reqwest::Client;
use std::fs::File;
use std::io::Write;
use futures_util::StreamExt;
use std::fmt;

#[derive(Debug)]
pub enum OmdbError {
    NotFound,
    InvalidKey,
    RateLimited,
    NetworkError(String),
    ParseError(String),
}

impl fmt::Display for OmdbError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OmdbError::NotFound => write!(f, "Movie not found"),
            OmdbError::InvalidKey => write!(f, "Invalid API key"),
            OmdbError::RateLimited => write!(f, "Daily API limit reached (1,000/day). Try again tomorrow!"),
            OmdbError::NetworkError(e) => write!(f, "Network error: {}", e),
            OmdbError::ParseError(e) => write!(f, "Failed to parse API response: {}", e),
        }
    }
}

const OMDB_URL: &str = "https://www.omdbapi.com/";

pub async fn fetch_by_title(title: &str, api_key: &str) -> Result<OmdbResponse, OmdbError> {
    let client = Client::new();
    let res = client.get(OMDB_URL)
        .query(&[("apikey", api_key), ("t", title)])
        .send()
        .await
        .map_err(|e| OmdbError::NetworkError(e.to_string()))?;

    let status = res.status();
    let body_text = res.text().await.map_err(|e| OmdbError::ParseError(e.to_string()))?;

    // Check status code directly too
    if (status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::TOO_MANY_REQUESTS) && body_text.contains("Request limit reached") {
        return Err(OmdbError::RateLimited);
    }

    let parsed: OmdbResponse = serde_json::from_str(&body_text).map_err(|e| OmdbError::ParseError(e.to_string()))?;
    
    if parsed.response == "False" {
        if let Some(err) = &parsed.error {
            if err.contains("Movie not found") { return Err(OmdbError::NotFound); }
            if err.contains("Invalid API key") { return Err(OmdbError::InvalidKey); }
            if err.contains("Request limit reached") { return Err(OmdbError::RateLimited); }
        }
        return Err(OmdbError::NotFound);
    }
    
    Ok(parsed)
}

pub async fn fetch_by_id(imdb_id: &str, api_key: &str) -> Result<OmdbResponse, OmdbError> {
    let client = Client::new();
    let res = client.get(OMDB_URL)
        .query(&[("apikey", api_key), ("i", imdb_id)])
        .send()
        .await
        .map_err(|e| OmdbError::NetworkError(e.to_string()))?;
    let status = res.status();
    let body_text = res.text().await.map_err(|e| OmdbError::ParseError(e.to_string()))?;

    if (status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::TOO_MANY_REQUESTS) && body_text.contains("Request limit reached") {
        return Err(OmdbError::RateLimited);
    }

    let parsed: OmdbResponse = serde_json::from_str(&body_text).map_err(|e| OmdbError::ParseError(e.to_string()))?;
    
    if parsed.response == "False" {
        if let Some(err) = &parsed.error {
            if err.contains("Request limit reached") { return Err(OmdbError::RateLimited); }
            if err.contains("Invalid API key") { return Err(OmdbError::InvalidKey); }
        }
        return Err(OmdbError::NotFound);
    }
    
    Ok(parsed)
}

#[derive(serde::Deserialize)]
struct OmdbSearchApiResult {
    #[serde(rename = "Search", default)]
    pub search: Option<Vec<OmdbSearchResult>>,
    #[serde(rename = "Response", default)]
    pub response: String,
    #[serde(rename = "Error", default)]
    pub error: Option<String>,
}

pub async fn search(query: &str, api_key: &str) -> Result<Vec<OmdbSearchResult>, OmdbError> {
    let client = Client::new();
    let res = client.get(OMDB_URL)
        .query(&[("apikey", api_key), ("s", query)])
        .send()
        .await
        .map_err(|e| OmdbError::NetworkError(e.to_string()))?;

    let status = res.status();
    let body_text = res.text().await.map_err(|e| OmdbError::ParseError(e.to_string()))?;

    if (status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::TOO_MANY_REQUESTS) && body_text.contains("Request limit reached") {
        return Err(OmdbError::RateLimited);
    }

    let parsed: OmdbSearchApiResult = serde_json::from_str(&body_text).map_err(|e| OmdbError::ParseError(e.to_string()))?;
    
    if parsed.response == "False" {
        if let Some(err) = &parsed.error {
            if err.contains("Request limit reached") { return Err(OmdbError::RateLimited); }
            if err.contains("Invalid API key") { return Err(OmdbError::InvalidKey); }
        }
        return Err(OmdbError::NotFound);
    }
    
    Ok(parsed.search.unwrap_or_default())
}

pub async fn download_poster(url: &str, dest_path: &Path) -> Result<(), OmdbError> {
    if url.is_empty() || url == "N/A" {
        return Ok(());
    }

    let client = Client::new();
    let res = client.get(url).send().await.map_err(|e| OmdbError::NetworkError(e.to_string()))?;

    let mut file = File::create(dest_path).map_err(|e| OmdbError::NetworkError(e.to_string()))?;
    let mut stream = res.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| OmdbError::NetworkError(e.to_string()))?;
        file.write_all(&chunk).map_err(|e| OmdbError::NetworkError(e.to_string()))?;
    }

    Ok(())
}
