pub fn parse_movie_title(filename: &str) -> String {
    let ext_lower = filename.to_lowercase();
    let exts = [".mkv", ".mp4", ".avi", ".mov", ".wmv", ".flv"];
    
    let mut name = filename;
    for ext in exts {
        if ext_lower.ends_with(ext) {
            name = &filename[..filename.len() - ext.len()];
            break;
        }
    }

    // Replace special separators with space to improve tokenization
    let mut cleaned = String::with_capacity(name.len());
    for c in name.chars() {
        if c == '.' || c == '_' || c == '(' || c == ')' || c == '[' || c == ']' || c == '{' || c == '}' {
            cleaned.push(' ');
        } else {
            cleaned.push(c);
        }
    }

    let stop_idx = find_stop_index(&cleaned);
    let mut result = cleaned[..stop_idx].trim().to_string();
    
    // Clean up double spaces
    while result.contains("  ") {
        result = result.replace("  ", " ");
    }

    // Strip trailing dashes or artifacts
    loop {
        let prev_len = result.len();
        result = result.trim_end_matches('-').trim().to_string();
        if result.len() == prev_len { break; }
    }

    // Strip leading indices like "01 ", "05 "
    // Only strip 2-digit numbers starting with 0 (extremely likely to be indices)
    if let Some(first_space) = result.find(' ') {
        let first_word = &result[..first_space];
        if first_word.len() == 2 && first_word.starts_with('0') && first_word.chars().all(|c| c.is_ascii_digit()) {
            result = result[first_space..].trim().to_string();
        }
    }

    result
}

fn find_stop_index(cleaned: &str) -> usize {
    let mut current_idx = 0;
    
    // resolutions, sources, codecs, and extra metadata
    let res = ["480p", "720p", "1080p", "2160p", "4k", "uhd", "fhd"];
    let src = ["bluray", "blu-ray", "bdrip", "brrip", "web-dl", "webdl", "webrip", "hdtv", "dvdrip", "dvdscr", "hdrip", "amzn", "nf", "hmax", "atvp", "itunes", "ds4k", "dovi", "hdr", "hdr10", "repack", "klrk", "sampa", "tigole", "yify", "rav1ne", "mircrew", "yts", "criterion"];
    let cod = ["x264", "x265", "h264", "h265", "hevc", "avc", "xvid", "divx", "av1", "aac5", "aac", "dts", "ddp5", "ddp2", "ddp7", "atmos", "ac3", "10bit"];
    let xtr = ["theatrical", "remastered", "dc", "directors", "proper", "hybrid", "remux", "extended", "uncut", "unrated", "ultimate", "cut", "imax", "horror", "sci-fi", "action", "comedy", "thriller", "drama", "animation", "adventure", "fantasy", "sci", "fi", "scifi"];

    let tokens: Vec<&str> = cleaned.split_whitespace().collect();
    let mut title_tokens_count = 0;

    for token in tokens {
        let token_lower = token.to_lowercase();
        let mut stop = false;
        
        // Resolutions are almost always noise
        if res.contains(&token_lower.as_str()) {
            stop = true;
        }

        // Year check: 4 digits, usually after some words
        if !stop && title_tokens_count > 0 && token.len() == 4 && token.chars().all(|c| c.is_ascii_digit()) {
            if let Ok(y) = token.parse::<u32>() {
                if (1920..=2039).contains(&y) {
                    stop = true;
                }
            }
        }
        
        // Stopword check: only stop if NOT the first word
        if !stop && title_tokens_count > 0 {
            let sub_tokens: Vec<&str> = token_lower.split('-').collect();
            for t in &sub_tokens {
                if src.contains(t) || cod.contains(t) || xtr.contains(t) {
                    stop = true; 
                    break;
                }
            }
        }
        
        // Release group match
        if !stop && title_tokens_count > 2 && token.contains('-') {
            if let Some(idx) = token.find('-') {
                let rest = &token[idx+1..];
                if !rest.is_empty() && rest.len() >= 2 && rest.chars().all(|c| c.is_ascii_digit() || (c.is_ascii_uppercase() && c.is_alphabetic())) {
                     if !token_lower.starts_with("vol") && !token_lower.starts_with("part") {
                        stop = true;
                     }
                }
            }
        }

        if stop {
            let offset = cleaned[current_idx..].find(token).unwrap_or(0);
            return current_idx + offset;
        }
        
        let offset = cleaned[current_idx..].find(token).unwrap_or(0);
        current_idx += offset + token.len();
        title_tokens_count += 1;
    }
    cleaned.len()
}
