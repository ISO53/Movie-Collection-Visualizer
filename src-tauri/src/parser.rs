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

    let mut cleaned = String::with_capacity(name.len());
    for c in name.chars() {
        if c == '.' || c == '_' {
            cleaned.push(' ');
        } else {
            cleaned.push(c);
        }
    }

    let stop_idx = find_stop_index(&cleaned);
    let mut result = cleaned[..stop_idx].trim().to_string();
    
    // In some edge cases, stop_idx truncates just before a -, e.g. "HEVC-GROUP",
    // making sure we clean up hanging dashes or spaces
    result = result.trim_end_matches('-').trim().to_string();
    result
}

fn find_stop_index(cleaned: &str) -> usize {
    let mut current_idx = 0;
    
    // resolutions, sources, codecs
    let res = ["480p", "720p", "1080p", "2160p", "4k", "uhd"];
    let src = ["bluray", "blu-ray", "bdrip", "brrip", "web-dl", "webdl", "webrip", "hdtv", "dvdrip", "dvdscr", "hdrip", "amzn", "nf", "hmax"];
    let cod = ["x264", "x265", "h264", "h265", "hevc", "avc", "xvid", "divx", "av1"];

    let tokens: Vec<&str> = cleaned.split_whitespace().collect();
    let mut first = true;

    for token in tokens {
        let token_lower = token.to_lowercase();
        let mut stop = false;
        
        if !first && token.len() == 4 && token.chars().all(|c| c.is_ascii_digit()) {
            if let Ok(y) = token.parse::<u32>() {
                if (1920..=2039).contains(&y) {
                    stop = true;
                }
            }
        }
        
        // Stop word match
        let sub_tokens: Vec<&str> = token_lower.split('-').collect();
        for t in &sub_tokens {
            if res.contains(t) || src.contains(t) || cod.contains(t) {
                stop = true; 
                break;
            }
        }
        
        // Release group match
        if token.starts_with('-') && token.len() > 1 {
            let rest = &token[1..];
            if rest.chars().all(|c| c.is_ascii_digit() || (c.is_ascii_uppercase() && c.is_alphabetic())) {
                stop = true;
            }
        } else if token_lower.contains('-') {
            if let Some(idx) = token.find('-') {
                let rest = &token[idx+1..];
                if !rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit() || (c.is_ascii_uppercase() && c.is_alphabetic())) {
                    stop = true;
                }
            }
        }
        
        if stop {
            let offset = cleaned[current_idx..].find(token).unwrap_or(0);
            return current_idx + offset;
        }
        
        let offset = cleaned[current_idx..].find(token).unwrap_or(0);
        current_idx += offset + token.len();
        first = false;
    }
    cleaned.len()
}
