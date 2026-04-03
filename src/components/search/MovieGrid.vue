<script setup lang="ts">
import { computed } from 'vue'
import { useMovieStore } from '../../stores/movies'
import { SortOption } from '../../types/movie'
import MovieGridCard from './MovieGridCard.vue'

const props = defineProps<{
  query: string
  genres: string[]
  sort: SortOption
}>()

const movieStore = useMovieStore()

const filteredMovies = computed(() => {
  return movieStore.searchAndFilter(props.query, props.genres, props.sort)
})
</script>

<template>
  <div class="grid-wrapper">
    <div class="count-text">
      Showing {{ filteredMovies.length }} of {{ movieStore.movies.length }} movies
    </div>
    <div class="grid-container">
      <MovieGridCard 
        v-for="movie in filteredMovies" 
        :key="movie.imdbId" 
        :movie="movie" 
      />
    </div>
  </div>
</template>

<style scoped>
.grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.count-text {
  font-size: 14px;
  color: var(--muted-mid);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
</style>
