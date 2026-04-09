<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Search, ChevronRight, ChevronLeft, Info } from 'lucide-vue-next'
import { invoke } from '@tauri-apps/api/core'
import { useDialogStore } from '../../stores/dialog'
import { useMovieStore } from '../../stores/movies'
import { useToastStore } from '../../stores/toast'
import { OmdbSearchResult } from '../../types/movie'

const dialogStore = useDialogStore()
const movieStore = useMovieStore()
const toastStore = useToastStore()

const items = computed(() => dialogStore.failedImportsData)
const currentIndex = ref(0)
const currentItem = computed(() => items.value[currentIndex.value])

const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<OmdbSearchResult[]>([])
const hasSearched = ref(false)

// Set initial search query when dialog opens or item changes
watch(currentItem, (newItem) => {
  if (newItem) {
    updateSearchQuery()
  } else {
    // Reset state if no current item (dialog closing)
    searchQuery.value = ''
    searchResults.value = []
    hasSearched.value = false
    currentIndex.value = 0
  }
})

async function updateSearchQuery() {
  if (!currentItem.value) return
  const filename = currentItem.value.fileName.split(/[\\/]/).pop() || currentItem.value.fileName
  
  try {
    const parsed = await invoke<string>('parse_filename', { filename })
    searchQuery.value = parsed
  } catch {
    searchQuery.value = currentItem.value.parsedTitle
  }
  
  searchResults.value = []
  hasSearched.value = false
}

async function search() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  hasSearched.value = true
  searchResults.value = []
  
  try {
    const results = await invoke<OmdbSearchResult[]>('search_omdb_multiple', { 
      query: searchQuery.value, 
    })
    searchResults.value = results
  } catch (e: any) {
    if (e !== 'Movie not found!') {
      toastStore.show('warning', 'Search failed: ' + e)
    }
  } finally {
    isSearching.value = false
  }
}

async function resolveImport(imdbId: string) {
  if (!currentItem.value) return
  
  try {
    await invoke('resolve_failed_import', {
      fileName: currentItem.value.fileName,
      imdbId: imdbId
    })
    
    toastStore.show('success', 'Movie linked successfully')
    
    // Remove current item from list
    const newItems = items.value.filter((_, i) => i !== currentIndex.value)
    if (newItems.length === 0) {
      close()
    } else {
      if (currentIndex.value >= newItems.length) {
        currentIndex.value = newItems.length - 1
      }
      dialogStore.failedImportsData = newItems
      updateSearchQuery()
    }
    movieStore.load()
  } catch (e: any) {
    toastStore.show('warning', 'Resolution failed: ' + e)
  }
}

function next() {
  if (currentIndex.value < items.value.length - 1) {
    currentIndex.value++
    updateSearchQuery()
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    updateSearchQuery()
  }
}

function close() {
  dialogStore.closeFixFailedImports()
  currentIndex.value = 0
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
}
</script>

<template>
  <div v-if="items.length > 0" class="dialog-overlay" @click="close">
    <div class="dialog-content" @click.stop>
      <button class="close-btn" @click="close"><X :size="20" /></button>
      
      <div class="header">
        <h2>Unmatched Movies Found</h2>
        <div class="pagination" v-if="items.length > 1">
           <button class="icon-btn" @click="prev" :disabled="currentIndex === 0"><ChevronLeft :size="18" /></button>
           <span class="page-info">{{ currentIndex + 1 }} / {{ items.length }}</span>
           <button class="icon-btn" @click="next" :disabled="currentIndex === items.length - 1"><ChevronRight :size="18" /></button>
        </div>
      </div>

      <div class="info-banner">
        <Info :size="16" style="margin-top: 2px; flex-shrink: 0;" />
        <div>
          <span style="display: block; margin-bottom: 4px; font-weight: 500;">We couldn't automatically find a match for this file. Please verify the title below.</span>
          <div class="tips" style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
            <strong>Tip:</strong> If the search fails, our parser might have missed punctuation. Try removing numbers or adding characters 
            (e.g., apostrophes for "Ocean's", colons for sequels) that are missing from the filename.
          </div>
        </div>
      </div>

      <div class="file-box">
        <div class="label">FILE ON DISK</div>
        <div class="filename">{{ currentItem?.fileName.split(/[\\/]/).pop() || currentItem?.fileName }}</div>
      </div>

      <div class="search-row">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Adjust title and search..." 
          @keyup.enter="search"
        />
        <button class="primary-btn" @click="search" :disabled="isSearching || !searchQuery.trim()">
          <Search :size="16" /> {{ isSearching ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <div class="results-container">
        <div v-if="isSearching" class="message">Searching OMDB...</div>
        <div v-else-if="hasSearched && searchResults.length === 0" class="message">No results found. Try adjusting the query.</div>
        <div v-else-if="!hasSearched" class="message init">Search for the correct movie title above to link this file.</div>
        
        <div class="results-grid" v-if="searchResults.length > 0">
          <button 
            class="result-card" 
            v-for="res in searchResults" 
            :key="res.imdbId"
            @click="resolveImport(res.imdbId)"
          >
            <img v-if="res.poster && res.poster !== 'N/A'" :src="res.poster" :alt="res.title" class="res-poster" />
            <div v-else class="res-poster placeholder">No Poster</div>
            
            <div class="res-info">
              <span class="res-title">{{ res.title }}</span>
              <span class="res-year">{{ res.year }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 300;
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px);
}
.dialog-content {
  background: var(--bg-light); width: 100%; max-width: 650px; max-height: 90vh;
  border-radius: 16px; padding: 32px; position: relative; border: 1px solid rgba(255,255,255,0.1);
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}
.close-btn {
  position: absolute; top: 16px; right: 16px; background: transparent; color: var(--muted-mid); border: none; cursor: pointer;
}
.close-btn:hover { color: white; }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { font-size: 22px; font-weight: 700; color: white; margin: 0; }

.pagination { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; }
.icon-btn { background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; opacity: 0.7; }
.icon-btn:hover:not(:disabled) { opacity: 1; }
.icon-btn:disabled { opacity: 0.2; cursor: not-allowed; }
.page-info { font-size: 13px; font-weight: 600; min-width: 40px; text-align: center; color: var(--muted-light); }

.info-banner {
  display: flex; gap: 10px; align-items: center; background: rgba(0, 163, 255, 0.08);
  border: 1px solid rgba(0, 163, 255, 0.2); padding: 12px 16px; border-radius: 8px;
  margin-bottom: 20px; color: #75d0ff; font-size: 13px;
}

.file-box { background: var(--bg-dark); border: 1px solid var(--muted-dark); padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; }
.label { font-size: 10px; font-weight: 800; color: var(--muted-mid); letter-spacing: 1px; margin-bottom: 6px; }
.filename { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--accent-four); word-break: break-all; }

.search-row { display: flex; gap: 12px; margin-bottom: 24px; }
input {
  flex: 1; height: 44px; background: var(--bg-dark); border: 1px solid var(--muted-dark);
  border-radius: 8px; padding: 0 16px; color: white; font-size: 14px; transition: border-color 0.2s;
}
input:focus { border-color: var(--accent-four); outline: none; }
.primary-btn {
  background-color: var(--accent-four); color: #101010; font-weight: 700;
  padding: 0 24px; height: 44px; border-radius: 8px; border: none; display: flex; align-items: center; gap: 8px; cursor: pointer;
}
.primary-btn:hover:not(:disabled) { transform: scale(1.02); opacity: 0.95; }

.results-container {
  flex: 1; overflow-y: auto; background: var(--bg-dark); border-radius: 12px;
  border: 1px solid var(--muted-dark); padding: 20px; min-height: 350px;
}
.message { color: var(--muted-mid); font-size: 14px; text-align: center; margin-top: 60px; }
.message.init { opacity: 0.6; }

.results-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px;
}

.result-card {
  background: var(--bg-light); border: 1px solid var(--muted-dark); border-radius: 10px;
  overflow: hidden; display: flex; flex-direction: column; text-align: left; padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
}
.result-card:hover { border-color: var(--accent-four); transform: translateY(-6px); box-shadow: 0 12px 24px rgba(0,0,0,0.4); }

.res-poster { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
.res-poster.placeholder {
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-dark); color: var(--muted-mid); font-size: 12px; border: none;
}

.res-info { padding: 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.res-title { font-size: 13px; font-weight: 700; color: white; line-height: 1.3; }
.res-year { font-size: 12px; color: var(--muted-mid); }
</style>
