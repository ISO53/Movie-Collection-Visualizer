import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Movie } from '../types/movie'

export const useDialogStore = defineStore('dialog', () => {
  const isApiKeyOpen = ref(false)
  const isFirstTimeOpen = ref(false)
  const isAboutOpen = ref(false)
  
  const movieDetailData = ref<Movie | null>(null)
  const wrongMovieData = ref<Movie | null>(null)
  const failedImportsData = ref<{ fileName: string, parsedTitle: string }[]>([])

  function openApiKeyDialog() { isApiKeyOpen.value = true }
  function closeApiKeyDialog() { isApiKeyOpen.value = false }
  
  function openFirstTimeDialog() { isFirstTimeOpen.value = true }
  function closeFirstTimeDialog() { isFirstTimeOpen.value = false }

  function openAboutDialog() { isAboutOpen.value = true }
  function closeAboutDialog() { isAboutOpen.value = false }

  function openMovieDetail(movie: Movie) { movieDetailData.value = movie }
  function closeMovieDetail() { movieDetailData.value = null }

  function openWrongMovie(movie: Movie) { 
    if (movieDetailData.value) closeMovieDetail()
    wrongMovieData.value = movie 
  }
  function closeWrongMovie() { wrongMovieData.value = null }

  function openFixFailedImports(items: { fileName: string, parsedTitle: string }[]) {
     failedImportsData.value = items
  }
  function closeFixFailedImports() { failedImportsData.value = [] }

  async function fetchFailedImports() {
    try {
      const results = await invoke<[string, string][]>('get_failed_imports')
      return results.map(r => ({ fileName: r[0], parsedTitle: r[1] }))
    } catch (e) {
      console.error('Failed to fetch failures:', e)
      return []
    }
  }

  return { 
    isApiKeyOpen, isFirstTimeOpen, isAboutOpen, movieDetailData, wrongMovieData,
    openApiKeyDialog, closeApiKeyDialog, 
    openFirstTimeDialog, closeFirstTimeDialog, openAboutDialog, closeAboutDialog,
    openMovieDetail, closeMovieDetail, openWrongMovie, closeWrongMovie,
    failedImportsData, openFixFailedImports, closeFixFailedImports,
    fetchFailedImports
  }
})
