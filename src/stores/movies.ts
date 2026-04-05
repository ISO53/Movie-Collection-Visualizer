import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Movie, SortOption } from '../types/movie'
import { parseImdbRating, parseYear, parseRuntime } from '../lib/utils'

export const useMovieStore = defineStore('movies', () => {
  const movies = ref<Movie[]>([])
  const isLoading = ref(false)

  const allGenres = computed((): string[] => {
    const genres = new Set<string>()
    movies.value.forEach(m => m.genre?.split(',').forEach(g => genres.add(g.trim())))
    return Array.from(genres).sort()
  })

  const topRated = computed(() =>
    [...movies.value]
      .filter(m => m.imdbRating && m.imdbRating !== 'N/A')
      .sort((a, b) => parseFloat(b.imdbRating!) - parseFloat(a.imdbRating!))
      .slice(0, 20)
  )

  const recentlyAdded = computed(() =>
    [...movies.value]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 20)
  )

  function byGenre(genre: string): Movie[] {
    return movies.value.filter(m => m.genre?.toLowerCase().includes(genre.toLowerCase()))
  }

  function searchAndFilter(query: string, genres: string[], sort: SortOption): Movie[] {
    let result = [...movies.value]

    if (query.trim()) {
      const terms = query.toLowerCase().split(' ').filter(Boolean)
      result = result.filter(m =>
        terms.every(term =>
          [m.title, m.year, m.genre, m.director, m.actors, m.plot, m.imdbId]
            .some(field => field?.toLowerCase().includes(term))
        )
      )
    }

    if (genres.length > 0) {
      result = result.filter(m =>
        genres.every(g => m.genre?.toLowerCase().includes(g.toLowerCase()))
      )
    }

    return sortMovies(result, sort)
  }

  function sortMovies(list: Movie[], sort: SortOption): Movie[] {
    switch (sort) {
      case 'alpha_asc': return list.sort((a, b) => a.title.localeCompare(b.title))
      case 'alpha_desc': return list.sort((a, b) => b.title.localeCompare(a.title))
      case 'rating_desc': return list.sort((a, b) => parseImdbRating(b.imdbRating) - parseImdbRating(a.imdbRating))
      case 'rating_asc': return list.sort((a, b) => parseImdbRating(a.imdbRating) - parseImdbRating(b.imdbRating))
      case 'release_desc': return list.sort((a, b) => parseYear(b.year) - parseYear(a.year))
      case 'release_asc': return list.sort((a, b) => parseYear(a.year) - parseYear(b.year))
      case 'runtime_desc': return list.sort((a, b) => parseRuntime(b.runtime) - parseRuntime(a.runtime))
      case 'runtime_asc': return list.sort((a, b) => parseRuntime(a.runtime) - parseRuntime(b.runtime))
      case 'added_desc': return list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      case 'added_asc': return list.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())
      case 'shuffle': return list.sort(() => Math.random() - 0.5)
      default: return list
    }
  }

  async function load() {
    isLoading.value = true
    movies.value = await invoke<Movie[]>('get_movies')
    isLoading.value = false
  }

  async function deleteMovie(imdbId: string) {
    await invoke('delete_movie', { imdbId })
    movies.value = movies.value.filter(m => m.imdbId !== imdbId)
  }

  return { movies, isLoading, allGenres, topRated, recentlyAdded, byGenre, searchAndFilter, load, deleteMovie }
})
