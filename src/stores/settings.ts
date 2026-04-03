import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'


export const useSettingsStore = defineStore('settings', () => {
  const omdbApiKey = ref<string | null>(null)
  const watchedDirectory = ref<string | null>(null)
  const apiLimitReachedOn = ref<string | null>(null)
  const firstTimeCompleted = ref(false)
  const isLoaded = ref(false)

  async function load() {
    try {
      const settings: Record<string, string> = await invoke('get_settings')
      omdbApiKey.value = settings.omdb_api_key || null
      watchedDirectory.value = settings.watched_directory || null
      apiLimitReachedOn.value = settings.api_limit_reached_on || null
      firstTimeCompleted.value = settings.first_time_completed === 'true'
    } catch (e) {
      console.error('Failed to load settings', e)
    } finally {
      isLoaded.value = true
    }
  }

  async function saveApiKey(key: string) {
    await invoke('set_setting', { key: 'omdb_api_key', value: key })
    await invoke('set_setting', { key: 'api_limit_reached_on', value: '' })
    omdbApiKey.value = key
    apiLimitReachedOn.value = ''
  }

  async function saveWatchedDirectory(path: string) {
    await invoke('set_setting', { key: 'watched_directory', value: path })
    watchedDirectory.value = path
  }

  async function clearWatchedDirectory() {
    await invoke('clear_watched_directory')
    watchedDirectory.value = null
  }

  async function markFirstTimeCompleted() {
    await invoke('set_setting', { key: 'first_time_completed', value: 'true' })
    firstTimeCompleted.value = true
  }

  return { 
    omdbApiKey, 
    watchedDirectory, 
    apiLimitReachedOn,
    firstTimeCompleted, 
    isLoaded, 
    load, 
    saveApiKey, 
    saveWatchedDirectory, 
    clearWatchedDirectory, 
    markFirstTimeCompleted 
  }
})
