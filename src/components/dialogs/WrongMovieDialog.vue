<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Search } from 'lucide-vue-next'
import { invoke } from '@tauri-apps/api/core'
import { useDialogStore } from '../../stores/dialog'
import { useMovieStore } from '../../stores/movies'
import { useToastStore } from '../../stores/toast'
import { OmdbSearchResult, Movie } from '../../types/movie'

const dialogStore = useDialogStore()
const movieStore = useMovieStore()
const toastStore = useToastStore()

const movie = computed(() => dialogStore.wrongMovieData)
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<OmdbSearchResult[]>([])
const hasSearched = ref(false)

async function search() {
  if (!searchQuery.value.trim() || !movie.value) return
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

async function selectMovie(imdbId: string) {
  if (!movie.value) return
  
  try {
    await invoke<Movie>('replace_movie', {
      oldId: movie.value.imdbId,
      newId: imdbId,
      fileName: movie.value.fileName
    })
    
    movieStore.load()
    toastStore.show('success', 'Movie updated successfully')
    dialogStore.closeWrongMovie()
  } catch (e: any) {
    toastStore.show('warning', 'Update failed: ' + e)
  }
}

dialogStore.$subscribe((_mutation, state) => {
  if (state.wrongMovieData && !hasSearched.value) {
    const fullPath = state.wrongMovieData.fileName
    const filename = fullPath.split(/[\\/]/).pop() || fullPath
    const withoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename
    searchQuery.value = withoutExt
  }
})

function close() {
  dialogStore.closeWrongMovie()
  hasSearched.value = false
  searchResults.value = []
  searchQuery.value = ''
}
</script>

<template>
  <div v-if="movie" class="dialog-overlay" @click="close">
    <div class="dialog-content" @click.stop>
      <button class="close-btn" @click="close"><X :size="20" /></button>
      
      <h2>Fix Incorrect Movie Match</h2>
      <p class="desc">
        The file <span class="mono">{{ movie.fileName }}</span> was incorrectly identified as <strong>{{ movie.title }}</strong>.
        Search for the correct movie below.
      </p>

      <div class="search-row">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by title..." 
          @keyup.enter="search"
        />
        <button class="primary-btn" @click="search" :disabled="isSearching || !searchQuery.trim()">
          <Search :size="16" /> {{ isSearching ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <div class="results-container">
        <div v-if="isSearching" class="message">Searching OMDB...</div>
        <div v-else-if="hasSearched && searchResults.length === 0" class="message">No results found. Try a different query.</div>
        
        <div class="results-grid" v-if="searchResults.length > 0">
          <button 
            class="result-card" 
            v-for="res in searchResults" 
            :key="res.imdbId"
            @click="selectMovie(res.imdbId)"
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
  position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200;
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
}
.dialog-content {
  background: var(--bg-light); width: 100%; max-width: 600px; max-height: 85vh;
  border-radius: 12px; padding: 32px; position: relative; border: 1px solid var(--muted-dark);
  display: flex; flex-direction: column;
}
.close-btn {
  position: absolute; top: 16px; right: 16px; background: transparent; color: var(--muted-mid); border: none;
}
.close-btn:hover { color: white; }

h2 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
.desc { color: var(--muted-mid); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
.mono { 
  font-family: monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; 
  border-radius: 4px; color: var(--muted-light); word-break: break-all;
}

.search-row { display: flex; gap: 12px; margin-bottom: 24px; }
input {
  flex: 1; height: 40px; background: var(--bg-dark); border: 1px solid var(--muted-dark);
  border-radius: 4px; padding: 0 12px; color: white; font-size: 14px;
}
input:focus { border-color: var(--accent-four); }
.primary-btn {
  background-color: var(--accent-four); color: #101010; font-weight: 600;
  padding: 0 24px; height: 40px; border-radius: 4px; border: none; display: flex; align-items: center; gap: 8px; cursor: pointer;
}
.primary-btn:hover:not(:disabled) { opacity: 0.9; }

.results-container {
  flex: 1; overflow-y: auto; background: var(--bg-dark); border-radius: 8px;
  border: 1px solid var(--muted-dark); padding: 16px; min-height: 300px;
}
.message { color: var(--muted-mid); font-size: 14px; text-align: center; margin-top: 40px; }

.results-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px;
}

.result-card {
  background: var(--bg-light); border: 1px solid var(--muted-dark); border-radius: 6px;
  overflow: hidden; display: flex; flex-direction: column; text-align: left; padding: 0;
  transition: all 200ms; cursor: pointer;
}
.result-card:hover { border-color: var(--accent-four); transform: translateY(-4px); }

.res-poster { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
.res-poster.placeholder {
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-dark); color: var(--muted-mid); font-size: 12px; border: none;
}

.res-info { padding: 12px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
.res-title { font-size: 13px; font-weight: 600; color: white; line-height: 1.3; }
.res-year { font-size: 12px; color: var(--muted-mid); }
</style>
