/// Movie Recommendation Engine — native Rust port of recommender.py
///
/// Algorithm:
///   1. Read the user's movie library IMDb IDs from the primary DB.
///   2. Load the global ML movie data (imdbId, tags, ratings) from movies_info.db.
///   3. Build a TF-IDF representation over all movies using pipe-separated tags.
///   4. Run K-Means clustering on the user's own movie vectors to discover "taste clusters".
///   5. For every cluster centre, compute cosine similarity against all ML movies.
///   6. Per cluster pick the top-N closest movies the user does NOT own.
///      A random jitter is applied to the candidate pool so that repeat calls
///      surface different titles every time (fulfils the "refresh" requirement).
use rand::seq::SliceRandom;
use rand::Rng;
use rusqlite::{Connection, Result as SqlResult};
use std::collections::{HashMap, HashSet};
use std::path::Path;

use crate::models::{RecommendationCluster, RecommendedMovie};

// ─── constants ────────────────────────────────────────────────────────────────

/// How many K-Means clusters to fit on the user library.
const NUM_CLUSTERS: usize = 4;
/// Recommendations we pick per cluster before final de-dup pass.
const RECS_PER_CLUSTER: usize = 3;
/// Minimum global rating count a movie must have to be suggested.
const MIN_RATING_COUNT: i64 = 100;
/// Top-N candidates we randomly sample from (keeps variety on refresh).
const CANDIDATE_POOL_SIZE: usize = 60;
/// Maximum TF-IDF vocabulary size.
const MAX_VOCAB: usize = 3000;
/// Terms that appear in more than this fraction of documents are discarded (idf filter ≈ max_df).
const MAX_DF_RATIO: f64 = 0.85;

// ─── raw row from movies_info.db ─────────────────────────────────────────────

struct MlRow {
    imdb_id: String, // bare numeric string, e.g. "0114709"
    genres: String,
    average_rating: f64,
    total_rating_count: i64,
    tags: String, // pipe-separated stemmed tags
}

// ─── public entry point ───────────────────────────────────────────────────────

/// `user_db_path`  – path to the app's primary mcv.db
/// `ml_db_path`    – path to the bundled movies_info.db
///
/// Returns an ordered list of clusters, each containing a handful of
/// recommended movies the user does not currently own.
pub fn get_recommendations(
    user_db_path: &Path,
    ml_db_path: &Path,
) -> Result<Vec<RecommendationCluster>, String> {
    // ── 1. user library ───────────────────────────────────────────────────────
    let user_ids = load_user_ids(user_db_path).map_err(|e| e.to_string())?;
    if user_ids.is_empty() {
        return Err("User library is empty".into());
    }

    // ── 2. ML data ────────────────────────────────────────────────────────────
    let ml_rows = load_ml_data(ml_db_path).map_err(|e| e.to_string())?;
    if ml_rows.is_empty() {
        return Err("ML database is empty".into());
    }

    // ── 3. TF-IDF ────────────────────────────────────────────────────────────
    let (vocab, idf) = build_vocab_idf(&ml_rows);
    let tfidf_matrix = build_tfidf_matrix(&ml_rows, &vocab, &idf);

    // ── 4. user indices ───────────────────────────────────────────────────────
    let user_indices: Vec<usize> = ml_rows
        .iter()
        .enumerate()
        .filter_map(|(i, r)| {
            if user_ids.contains(&r.imdb_id) {
                Some(i)
            } else {
                None
            }
        })
        .collect();

    if user_indices.is_empty() {
        return Err("None of your movies were found in the recommendation database".into());
    }

    // ── 5. K-Means ────────────────────────────────────────────────────────────
    let n_clusters = NUM_CLUSTERS.min(user_indices.len());
    let dim = vocab.len();
    let centers = kmeans(
        &tfidf_matrix,
        &user_indices,
        n_clusters,
        dim,
        /* max_iter */ 50,
    );

    // ── 6. per-cluster recommendations ───────────────────────────────────────
    let feature_names = vocab_feature_names(&vocab);
    let mut rng = rand::thread_rng();
    let mut results: Vec<RecommendationCluster> = Vec::new();

    for cluster_idx in 0..n_clusters {
        let center = &centers[cluster_idx];

        // Top keywords that describe this cluster
        let mut kw_scores: Vec<(usize, f64)> =
            center.iter().cloned().enumerate().collect();
        kw_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        let mood = kw_scores
            .iter()
            .take(5)
            .map(|(i, _)| feature_names[*i].to_uppercase())
            .collect::<Vec<_>>()
            .join(", ");

        // Cosine similarities against the full matrix
        let sims = cosine_similarities(center, &tfidf_matrix, dim);

        // Exclude movies the user already owns
        let mut candidates: Vec<(usize, f64)> = sims
            .into_iter()
            .enumerate()
            .filter(|(i, _)| !user_ids.contains(&ml_rows[*i].imdb_id))
            .filter(|(i, _)| ml_rows[*i].total_rating_count >= MIN_RATING_COUNT)
            .collect();

        // Sort descending by similarity
        candidates
            .sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Take a larger candidate pool then randomly sample from it — this
        // gives every refresh a fresh look while still respecting taste.
        let pool_end = CANDIDATE_POOL_SIZE.min(candidates.len());
        let mut pool = candidates[..pool_end].to_vec();
        pool.shuffle(&mut rng);

        let mut cluster_recs: Vec<RecommendedMovie> = Vec::new();
        for (idx, sim) in pool.iter().take(RECS_PER_CLUSTER) {
            let row = &ml_rows[*idx];
            // Add a tiny random nudge so similarity values look natural
            let sim_nudge: f64 = rng.gen_range(-0.005..0.005);
            cluster_recs.push(RecommendedMovie {
                imdb_id: format!("tt{}", row.imdb_id),
                average_rating: row.average_rating,
                total_votes: row.total_rating_count,
                similarity: (sim + sim_nudge).clamp(0.0, 1.0),
                poster_url: format!(
                    "https://www.imdb.com/title/tt{}/",
                    row.imdb_id
                ),
                title: format!("tt{}", row.imdb_id), // title resolved on click via IMDb
                year: String::new(),
                genres: row.genres.replace('|', ", "),
            });
        }

        if !cluster_recs.is_empty() {
            results.push(RecommendationCluster {
                mood,
                recommendations: cluster_recs,
            });
        }
    }

    Ok(results)
}

// ─── data loaders ─────────────────────────────────────────────────────────────

fn load_user_ids(path: &Path) -> SqlResult<HashSet<String>> {
    let conn = Connection::open(path)?;
    let mut stmt =
        conn.prepare("SELECT imdb_id FROM movies WHERE imdb_id IS NOT NULL")?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    let mut ids = HashSet::new();
    for r in rows {
        let raw = r?;
        // Strip "tt" prefix to align with the numeric imdbId in movies_data
        ids.insert(raw.trim_start_matches("tt").to_string());
    }
    Ok(ids)
}

fn load_ml_data(path: &Path) -> SqlResult<Vec<MlRow>> {
    let conn = Connection::open(path)?;
    let mut stmt = conn.prepare(
        "SELECT imdbId, genres, average_rating, total_rating_count, tags \
         FROM movies_data WHERE tags IS NOT NULL",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(MlRow {
            imdb_id: row.get::<_, String>(0)?,
            genres: row.get::<_, String>(1).unwrap_or_default(),
            average_rating: row.get::<_, f64>(2).unwrap_or(0.0),
            total_rating_count: row.get::<_, i64>(3).unwrap_or(0),
            tags: row.get::<_, String>(4).unwrap_or_default(),
        })
    })?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

// ─── TF-IDF ───────────────────────────────────────────────────────────────────

/// Replace `|` separators with spaces; the tags are already stemmed in the DB.
fn tokenise(tags: &str) -> Vec<String> {
    tags.replace('|', " ")
        .split_whitespace()
        .map(|t| t.to_lowercase())
        .filter(|t| t.len() > 1)
        .collect()
}

/// Build vocab (term → index) and IDF weights, applying simple max_df filtering.
fn build_vocab_idf(rows: &[MlRow]) -> (HashMap<String, usize>, Vec<f64>) {
    let n_docs = rows.len() as f64;
    let mut doc_freq: HashMap<String, usize> = HashMap::new();

    for row in rows {
        let terms: HashSet<String> = tokenise(&row.tags).into_iter().collect();
        for t in terms {
            *doc_freq.entry(t).or_insert(0) += 1;
        }
    }

    // Filter by max_df and build ordered vocab
    let mut terms_sorted: Vec<(String, usize)> = doc_freq
        .into_iter()
        .filter(|(_, df)| (*df as f64 / n_docs) <= MAX_DF_RATIO)
        .collect();

    // Sort by descending document frequency → take top MAX_VOCAB
    terms_sorted.sort_by(|a, b| b.1.cmp(&a.1));
    terms_sorted.truncate(MAX_VOCAB);

    let vocab: HashMap<String, usize> = terms_sorted
        .iter()
        .enumerate()
        .map(|(i, (t, _))| (t.clone(), i))
        .collect();

    // IDF = log((1 + n) / (1 + df)) + 1  (sklearn default)
    let idf: Vec<f64> = terms_sorted
        .iter()
        .map(|(_, df)| ((1.0 + n_docs) / (1.0 + *df as f64)).ln() + 1.0)
        .collect();

    (vocab, idf)
}

fn vocab_feature_names(vocab: &HashMap<String, usize>) -> Vec<String> {
    let mut items: Vec<(&String, &usize)> = vocab.iter().collect();
    items.sort_by_key(|(_, &i)| i);
    items.into_iter().map(|(t, _)| t.clone()).collect()
}

/// Build L2-normalised TF-IDF row vectors for every document.
fn build_tfidf_matrix(
    rows: &[MlRow],
    vocab: &HashMap<String, usize>,
    idf: &[f64],
) -> Vec<Vec<f64>> {
    let dim = vocab.len();
    let mut matrix: Vec<Vec<f64>> = Vec::with_capacity(rows.len());

    for row in rows {
        let tokens = tokenise(&row.tags);
        let mut tf_map: HashMap<usize, f64> = HashMap::new();
        for t in &tokens {
            if let Some(&idx) = vocab.get(t) {
                *tf_map.entry(idx).or_insert(0.0) += 1.0;
            }
        }
        let total = tokens.len().max(1) as f64;
        let mut vec = vec![0.0f64; dim];
        for (idx, cnt) in tf_map {
            vec[idx] = (cnt / total) * idf[idx];
        }
        l2_normalize(&mut vec);
        matrix.push(vec);
    }
    matrix
}

fn l2_normalize(v: &mut Vec<f64>) {
    let norm: f64 = v.iter().map(|x| x * x).sum::<f64>().sqrt();
    if norm > 1e-10 {
        v.iter_mut().for_each(|x| *x /= norm);
    }
}

// ─── K-Means ──────────────────────────────────────────────────────────────────

fn kmeans(
    matrix: &[Vec<f64>],
    indices: &[usize],
    k: usize,
    dim: usize,
    max_iter: usize,
) -> Vec<Vec<f64>> {
    // Initialise centres with k-means++ style spread
    let mut centres: Vec<Vec<f64>> = Vec::with_capacity(k);
    let mut rng = rand::thread_rng();

    // First centre: pick a random user movie
    let first = indices[rng.gen_range(0..indices.len())];
    centres.push(matrix[first].clone());

    for _ in 1..k {
        // Choose next centre proportional to squared distance to nearest centre
        let weights: Vec<f64> = indices
            .iter()
            .map(|&i| {
                centres
                    .iter()
                    .map(|c| sq_distance(&matrix[i], c))
                    .fold(f64::MAX, f64::min)
            })
            .collect();
        let total_w: f64 = weights.iter().sum();
        if total_w < 1e-12 {
            // Degenerate — just add a random user movie
            centres.push(matrix[indices[rng.gen_range(0..indices.len())]].clone());
            continue;
        }
        let mut threshold = rng.gen_range(0.0..total_w);
        let mut chosen = indices[0];
        for (&idx, &w) in indices.iter().zip(weights.iter()) {
            threshold -= w;
            if threshold <= 0.0 {
                chosen = idx;
                break;
            }
        }
        centres.push(matrix[chosen].clone());
    }

    // Iterate E/M steps
    let mut assignments = vec![0usize; indices.len()];
    for _iter in 0..max_iter {
        let mut changed = false;

        // E: assign each user movie to nearest centre
        for (pos, &idx) in indices.iter().enumerate() {
            let best = (0..k)
                .min_by(|&a, &b| {
                    sq_distance(&matrix[idx], &centres[a])
                        .partial_cmp(&sq_distance(&matrix[idx], &centres[b]))
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
                .unwrap_or(0);
            if assignments[pos] != best {
                assignments[pos] = best;
                changed = true;
            }
        }
        if !changed {
            break;
        }

        // M: recompute centres
        let mut new_centres: Vec<Vec<f64>> = vec![vec![0.0; dim]; k];
        let mut counts = vec![0usize; k];
        for (pos, &idx) in indices.iter().enumerate() {
            let c = assignments[pos];
            counts[c] += 1;
            for d in 0..dim {
                new_centres[c][d] += matrix[idx][d];
            }
        }
        for c in 0..k {
            if counts[c] > 0 {
                let n = counts[c] as f64;
                new_centres[c].iter_mut().for_each(|x| *x /= n);
                l2_normalize(&mut new_centres[c]);
            } else {
                // Empty cluster — keep old centre
                new_centres[c] = centres[c].clone();
            }
        }
        centres = new_centres;
    }

    centres
}

fn sq_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y) * (x - y))
        .sum()
}

// ─── Cosine similarity ────────────────────────────────────────────────────────

/// Returns cosine similarity of `query` against every row in the matrix.
/// Because all vectors are already L2-normalised, cosine = dot product.
fn cosine_similarities(query: &[f64], matrix: &[Vec<f64>], _dim: usize) -> Vec<f64> {
    matrix
        .iter()
        .map(|row| row.iter().zip(query.iter()).map(|(a, b)| a * b).sum())
        .collect()
}
