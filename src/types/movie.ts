export interface Movie {
  id: number
  imdbId: string
  fileName: string
  title: string
  year?: string
  rated?: string
  released?: string
  runtime?: string
  genre?: string
  director?: string
  writer?: string
  actors?: string
  plot?: string
  language?: string
  country?: string
  awards?: string
  posterUrl?: string
  posterPath?: string
  metascore?: string
  imdbRating?: string
  imdbVotes?: string
  boxOffice?: string
  ratingsJson?: string
  addedAt: string
  importSource: string
}

export interface OmdbSearchResult {
  imdbId: string
  title: string
  year: string
  poster: string
}

export type SortOption =
  | 'alpha_asc' | 'alpha_desc'
  | 'rating_desc' | 'rating_asc'
  | 'release_desc' | 'release_asc'
  | 'runtime_desc' | 'runtime_asc'
  | 'added_desc' | 'added_asc'
  | 'shuffle'
