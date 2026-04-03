<script setup lang="ts">
import { ref } from 'vue'
import { Movie } from '../../types/movie'
import { MoreVertical, Info, RefreshCw, Trash2 } from 'lucide-vue-next'
import { useDialogStore } from '../../stores/dialog'
import { useMovieStore } from '../../stores/movies'
import MoviePoster from '../shared/MoviePoster.vue'
import RatingBadge from '../shared/RatingBadge.vue'

const props = defineProps<{
  movie: Movie
}>()

const dialogStore = useDialogStore()
const movieStore = useMovieStore()

const isMenuOpen = ref(false)

function openDetails() {
  dialogStore.openMovieDetail(props.movie)
}

function openWrongMovie() {
  isMenuOpen.value = false
  dialogStore.openWrongMovie(props.movie)
}

function triggerDelete() {
  if (confirm("Are you sure you want to delete this movie?")) {
    movieStore.deleteMovie(props.movie.imdbId)
  }
}
</script>

<template>
  <div class="grid-card" @click="openDetails">
    <MoviePoster 
      :poster-path="movie.posterPath" 
      :poster-url="movie.posterUrl" 
      :alt="movie.title"
      class="poster"
    />
    
    <div class="hover-overlay">
      <div class="hover-content">
        <h3 class="hover-title">{{ movie.title }}</h3>
        <p class="hover-genre">{{ movie.genre }}</p>
      </div>
      
      <div class="menu-container" @click.stop>
        <button class="menu-btn" @click.stop="isMenuOpen = !isMenuOpen">
          <MoreVertical :size="20" />
        </button>
        
        <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false"></div>
        <div v-if="isMenuOpen" class="dropdown-menu">
          <button class="dropdown-item" @click="openDetails">
            <Info :size="16" /> View Details
          </button>
          <button class="dropdown-item" @click="openWrongMovie">
            <RefreshCw :size="16" /> Wrong Movie?
          </button>
          <button class="dropdown-item destructive" @click="triggerDelete">
            <Trash2 :size="16" /> Delete
          </button>
        </div>
      </div>
    </div>
    
    <RatingBadge 
      :rating="movie.imdbRating" 
      class="rating-badge"
    />
  </div>
</template>

<style scoped>
.grid-card {
  aspect-ratio: 2 / 3;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--bg-light);
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hover-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  opacity: 0;
  transition: opacity 200ms ease;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.grid-card:hover .hover-overlay {
  opacity: 1;
}

.hover-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 24px;
}

.hover-title {
  color: white;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.hover-genre {
  color: var(--muted-mid);
  font-size: 12px;
}

.rating-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 2;
}

.menu-container {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.menu-btn {
  background: rgba(0,0,0,0.5);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 200ms;
}

.menu-btn:hover {
  background: rgba(0,0,0,0.8);
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--bg-light);
  border: 1px solid var(--muted-dark);
  border-radius: 8px;
  padding: 4px;
  min-width: 160px;
  z-index: 100;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  color: var(--text-main);
  text-align: left;
  border-radius: 4px;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: rgba(255,255,255,0.1);
}

.destructive {
  color: #ef4444;
}
.destructive:hover {
  background-color: rgba(239, 68, 68, 0.1);
}
</style>
