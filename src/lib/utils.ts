import { Movie } from '../types/movie'

export function formatRuntime(runtimeStr?: string): string {
  if (!runtimeStr || runtimeStr === 'N/A') return 'N/A'
  const min = parseInt(runtimeStr, 10)
  if (isNaN(min)) return runtimeStr
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${m}m`
}

export function formatTotalRuntime(minutes: number): string {
  if (minutes === 0) return '0 minutes'
  const days = Math.floor(minutes / (24 * 60))
  const remainingHours = Math.floor((minutes % (24 * 60)) / 60)
  if (days > 0) {
    return remainingHours > 0 ? `${days} days ${remainingHours}h` : `${days} days`
  }
  return remainingHours > 0 ? `${remainingHours}h` : `${minutes}m`
}

export function parseImdbRating(rating?: string): number {
  if (!rating || rating === 'N/A') return 0
  const parsed = parseFloat(rating)
  return isNaN(parsed) ? 0 : parsed
}

export function parseYear(yearStr?: string): number {
  if (!yearStr || yearStr === 'N/A') return 0
  const match = yearStr.match(/\d{4}/)
  return match ? parseInt(match[0], 10) : 0
}

export function getDecadeLabel(year: number): string {
  if (!year) return 'Unknown'
  return `${Math.floor(year / 10) * 10}s`
}

export function splitAndTrim(str?: string): string[] {
  if (!str || str === 'N/A') return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function generateCsvContent(movies: Movie[]): string {
  const headers = [
    'Title', 'Year', 'Rated', 'Released', 'Runtime', 'Genre', 'Director', 
    'Writer', 'Actors', 'Plot', 'Language', 'Country', 'Awards', 
    'Metascore', 'imdbRating', 'imdbVotes', 'BoxOffice', 'imdbID', 'FileName', 'AddedAt'
  ]
  
  const escapeCsv = (field?: string) => {
    if (!field) return '""'
    const str = String(field).replace(/"/g, '""')
    return `"${str}"`
  }

  const rows = movies.map(m => [
    m.title, m.year, m.rated, m.released, m.runtime, m.genre, m.director,
    m.writer, m.actors, m.plot, m.language, m.country, m.awards,
    m.metascore, m.imdbRating, m.imdbVotes, m.boxOffice, m.imdbId, m.fileName, m.addedAt
  ].map(escapeCsv).join(','))

  return [headers.join(','), ...rows].join('\n')
}
