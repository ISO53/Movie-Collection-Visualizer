<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useMovieStore } from '../stores/movies'
import { SortOption } from '../types/movie'
import SearchBar from '../components/search/SearchBar.vue'
import FilterBar from '../components/search/FilterBar.vue'
import SortDropdown from '../components/search/SortDropdown.vue'
import MovieGrid from '../components/search/MovieGrid.vue'

import { useRoute } from 'vue-router'

const props = defineProps<{
  prefilterGenre?: string
}>()

const movieStore = useMovieStore()
const route = useRoute()

const query = ref('')
const selectedGenres = ref<string[]>([])
const sortOption = ref<SortOption>('added_desc')

onMounted(() => {
  if (props.prefilterGenre) {
    selectedGenres.value = [props.prefilterGenre]
  }
  if (route.query.q) {
    query.value = route.query.q as string
  }
  if (route.query.director) {
    query.value = route.query.director as string
  }
  if (route.query.genre) {
    selectedGenres.value = [route.query.genre as string]
  }
})

watch(() => props.prefilterGenre, (newVal) => {
  if (newVal) {
    selectedGenres.value = [newVal]
    query.value = ''
  }
})

watch(() => route.query, (newQuery) => {
  if (newQuery.q) {
    query.value = newQuery.q as string
  } else if (newQuery.director) {
    query.value = newQuery.director as string
  } else {
    query.value = ''
  }

  if (newQuery.genre) {
    selectedGenres.value = [newQuery.genre as string]
  } else if (!props.prefilterGenre) {
    selectedGenres.value = []
  }
}, { deep: true })

function onSearch(q: string) {
  query.value = q
  if (q.trim() !== '') {
    selectedGenres.value = [] // clear genres on manual text search as per requirement
  }
}

function onToggleGenre(genre: string) {
  if (selectedGenres.value.includes(genre)) {
    selectedGenres.value = selectedGenres.value.filter(g => g !== genre)
  } else {
    selectedGenres.value.push(genre)
    query.value = '' // clear search on clicking genre chip
  }
}
</script>

<template>
  <div class="search-container">
    <div class="top-section">
      <div class="search-sort-row">
        <SearchBar :value="query" @update="onSearch" class="search-bar-flex" />
        <SortDropdown v-model="sortOption" />
      </div>
      <FilterBar 
        :genres="movieStore.allGenres" 
        :selected="selectedGenres" 
        @toggle="onToggleGenre" 
      />
    </div>
    
    <div class="grid-section">
      <MovieGrid 
        :query="query" 
        :genres="selectedGenres" 
        :sort="sortOption" 
      />
    </div>
  </div>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.top-section {
  padding: 32px 40px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: var(--bg-dark);
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-sort-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-bar-flex {
  flex: 1;
}

.grid-section {
  flex: 1;
  padding: 0 40px 40px 40px;
}
</style>
