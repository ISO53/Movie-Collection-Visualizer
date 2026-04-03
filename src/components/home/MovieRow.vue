<script setup lang="ts">
import { Movie } from '../../types/movie'
import MovieRowCard from './MovieRowCard.vue'

defineProps<{
  title: string
  movies: Movie[]
}>()
</script>

<template>
  <div class="movie-row">
    <h2 class="row-title">{{ title }}</h2>
    <div class="cards-container">
      <div class="cards-scroll">
        <MovieRowCard 
          v-for="movie in movies" 
          :key="movie.imdbId" 
          :movie="movie" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.movie-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row-title {
  font-size: 20px;
  font-weight: 600;
  padding-left: 40px;
}

.cards-container {
  width: 100%;
  overflow-x: auto;
  padding: 0 40px 20px 40px;
  scrollbar-width: thin;
  scrollbar-color: var(--muted-dark) transparent;
}

.cards-container::-webkit-scrollbar {
  height: 6px;
}
.cards-container::-webkit-scrollbar-track {
  background: transparent;
}
.cards-container::-webkit-scrollbar-thumb {
  background: var(--muted-dark);
  border-radius: 3px;
}
.cards-container::-webkit-scrollbar-thumb:hover {
  background: var(--muted-mid);
}

.cards-scroll {
  display: flex;
  gap: 16px;
  width: max-content;
}
</style>
