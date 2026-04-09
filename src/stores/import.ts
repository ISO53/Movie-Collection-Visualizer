import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { useMovieStore } from './movies'
import { useToastStore } from './toast'
import { useDialogStore } from './dialog'
import { ImportProgress, ImportComplete, WatchedDirSyncResult } from '../types/import'

export const useImportStore = defineStore('import', () => {
  const isImporting = ref(false)
  const current = ref(0)
  const total = ref(0)
  const currentTitle = ref('')
  const elapsedSecs = ref(0)
  const lastResult = ref<ImportComplete | null>(null)
  
  const newCount = ref(0)
  const showSummary = ref(false)
  const rateLimited = ref(false)
  
  let unlistenProgress: UnlistenFn | null = null
  let unlistenComplete: UnlistenFn | null = null

  async function setupListeners() {
    const movieStore = useMovieStore()
    const toastStore = useToastStore()

    if (unlistenProgress) unlistenProgress()
    if (unlistenComplete) unlistenComplete()

    unlistenProgress = await listen<ImportProgress>('import-progress', e => {
      isImporting.value = true
      showSummary.value = false
      current.value = e.payload.current
      total.value = e.payload.total
      currentTitle.value = e.payload.currentTitle
      elapsedSecs.value = e.payload.elapsedSecs
    })

    unlistenComplete = await listen<ImportComplete>('import-complete', async e => {
      lastResult.value = e.payload
      isImporting.value = false
      showSummary.value = true
      movieStore.load()
      
      const dialogStore = useDialogStore()
      
      if (e.payload.cancelled) {
        toastStore.show('info', 'Import cancelled by user')
      } else if (e.payload.rateLimited) {
        toastStore.show('warning', 'OMDB API daily limit exceeded (1,000 requests). You can continue syncing tomorrow!')
        
        // Also check if there were any failures before rate limit hit
        const failures = await dialogStore.fetchFailedImports()
        if (failures.length > 0) {
          dialogStore.openFixFailedImports(failures)
        }
      } else if (e.payload.totalImported > 0 || e.payload.failed > 0) {
        toastStore.show('success', `Sync complete — ${e.payload.totalImported} added, ${e.payload.failed} failed`)
        
        // Check for all failed items (not found on OMDb) to show the fix dialog
        const failures = await dialogStore.fetchFailedImports()
        if (failures.length > 0) {
          dialogStore.openFixFailedImports(failures)
        }
      }
    })

    await listen<WatchedDirSyncResult>('watched-dir-sync-result', e => {
      newCount.value = e.payload.newCount
      rateLimited.value = e.payload.rateLimited
      
      if (e.payload.rateLimited) {
        toastStore.show('warning', 'Daily API limit reached. Syncing newly found movies will resume tomorrow.')
        showSummary.value = true
      } else if (e.payload.newCount === 0) {
        // Handled by SettingsPanel toast usually
      }
    })
  }

  async function cancelImport() {
    try {
      await invoke('cancel_import')
    } catch (e: any) {
      console.error('Failed to cancel import:', e)
    }
  }

  function dismissSummary() {
    showSummary.value = false
  }

  return { 
    isImporting, current, total, currentTitle, elapsedSecs, lastResult, 
    newCount, showSummary, rateLimited,
    setupListeners, cancelImport, dismissSummary 
  }
})
