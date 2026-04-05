<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from './stores/settings'
import { useMovieStore } from './stores/movies'
import { useImportStore } from './stores/import'
import { useDialogStore } from './stores/dialog'

import AppSidebar from './components/layout/AppSidebar.vue'
import StatusBar from './components/layout/StatusBar.vue'
import GlobalToast from './components/layout/GlobalToast.vue'

import ApiKeyDialog from './components/dialogs/ApiKeyDialog.vue'
import MovieDetailDialog from './components/dialogs/MovieDetailDialog.vue'
import WrongMovieDialog from './components/dialogs/WrongMovieDialog.vue'
import FirstTimeDialog from './components/dialogs/FirstTimeDialog.vue'
import AboutDialog from './components/dialogs/AboutDialog.vue'
import FixFailedImportsDialog from './components/dialogs/FixFailedImportsDialog.vue'

const settingsStore = useSettingsStore()
const movieStore = useMovieStore()
const importStore = useImportStore()
const dialogStore = useDialogStore()

onMounted(async () => {
  await settingsStore.load()
  await movieStore.load()
  await importStore.setupListeners()

  const today = new Date().toISOString().split('T')[0]
  if (settingsStore.apiLimitReachedOn === today) {
    const { useToastStore } = await import('./stores/toast')
    useToastStore().show('info', 'Import skipped: Daily API limit already reached today.')
  }

  if (!settingsStore.omdbApiKey) {
    dialogStore.openFirstTimeDialog()
  } else if (!settingsStore.firstTimeCompleted) {
    dialogStore.openFirstTimeDialog()
  } else {
    // Check for failed imports to show fix dialog
    const failures = await dialogStore.fetchFailedImports()
    if (failures.length > 0) {
      dialogStore.openFixFailedImports(failures)
    }
  }
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar class="app-sidebar" />
    <main class="app-main">
      <router-view />
    </main>
    <StatusBar />
    <GlobalToast />
    
    <ApiKeyDialog />
    <MovieDetailDialog />
    <WrongMovieDialog />
    <FirstTimeDialog />
    <AboutDialog />
    <FixFailedImportsDialog />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  background-color: var(--bg-dark);
}

.app-sidebar {
  flex-shrink: 0;
  z-index: 10;
}

.app-main {
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
}
</style>
