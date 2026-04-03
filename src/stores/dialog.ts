import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Movie } from '../types/movie'

export const useDialogStore = defineStore('dialog', () => {
  const isApiKeyOpen = ref(false)
  const isFirstTimeOpen = ref(false)
  const isAboutOpen = ref(false)
  
  const movieDetailData = ref<Movie | null>(null)
  const wrongMovieData = ref<Movie | null>(null)

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

  return { 
    isApiKeyOpen, isFirstTimeOpen, isAboutOpen, movieDetailData, wrongMovieData,
    openApiKeyDialog, closeApiKeyDialog, 
    openFirstTimeDialog, closeFirstTimeDialog, openAboutDialog, closeAboutDialog,
    openMovieDetail, closeMovieDetail, openWrongMovie, closeWrongMovie
  }
})
