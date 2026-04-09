<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMovieStore } from '../../stores/movies'
import { useDialogStore } from '../../stores/dialog'
import { RefreshCcw, Star } from 'lucide-vue-next'
import { convertFileSrc } from '@tauri-apps/api/core'
import GenreBadge from '../shared/GenreBadge.vue'
import { truncate } from '../../lib/utils'

const movieStore = useMovieStore()
const dialogStore = useDialogStore()
const router = useRouter()

const randomMovie = ref<any>(null)

function pickRandom() {
  const candidates = movieStore.movies.filter(m => m.posterPath || (m.posterUrl && m.posterUrl !== 'N/A'))
  if (candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length)
    randomMovie.value = candidates[idx]
  } else if (movieStore.movies.length > 0) {
    const idx = Math.floor(Math.random() * movieStore.movies.length)
    randomMovie.value = movieStore.movies[idx]
  }
}

onMounted(pickRandom)
watch(() => movieStore.movies, pickRandom)

const bgImage = computed(() => {
  if (!randomMovie.value) return ''
  if (randomMovie.value.posterPath) return `url(${convertFileSrc(randomMovie.value.posterPath)})`
  if (randomMovie.value.posterUrl) return `url(${randomMovie.value.posterUrl})`
  return ''
})

const genres = computed(() => {
  if (!randomMovie.value?.genre) return []
  return randomMovie.value.genre.split(',').map((g: string) => g.trim()).slice(0, 3)
})

function viewDetails() {
  if (randomMovie.value) dialogStore.openMovieDetail(randomMovie.value)
}

function findSimilar() {
  if (genres.value.length > 0) {
    router.push({ path: '/search', query: { genre: genres.value[0] } })
  }
}
</script>

<template>
  <div v-if="randomMovie" class="hero-banner" :style="{ backgroundImage: bgImage }">
    <div class="hero-overlay"></div>
    <button class="refresh-btn" @click="pickRandom" title="Pick another random movie">
      <RefreshCcw :size="20" />
    </button>
    <div class="hero-content">
      <h1 class="hero-title">{{ randomMovie.title }}</h1>
      <div class="hero-meta">
        <span>{{ randomMovie.year }}</span>
        <span class="dot" v-if="randomMovie.rated && randomMovie.rated !== 'N/A'">·</span>
        <span v-if="randomMovie.rated && randomMovie.rated !== 'N/A'">{{ randomMovie.rated }}</span>
        <span class="dot" v-if="randomMovie.runtime && randomMovie.runtime !== 'N/A'">·</span>
        <span v-if="randomMovie.runtime && randomMovie.runtime !== 'N/A'">{{ randomMovie.runtime }}</span>
      </div>
      <div class="hero-genres">
        <GenreBadge v-for="g in genres" :key="g" :genre="g" />
      </div>
      <div v-if="randomMovie.imdbRating && randomMovie.imdbRating !== 'N/A'" class="hero-rating">
        <Star class="star-icon" fill="currentColor" :size="24" />
        <span class="rating-value">{{ randomMovie.imdbRating }}</span>
      </div>
      <p class="hero-plot">{{ truncate(randomMovie.plot || '', 180) }}</p>

      <div class="hero-actions">
        <button class="primary-btn" @click="viewDetails">View Details</button>
        <button v-if="genres.length > 0" class="outline-btn" @click="findSimilar">Find Similar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-banner {
  height: 55vh;
  min-height: 400px;
  width: 100%;
  background-size: cover;
  background-position: center 20%;
  position: relative;
  background-color: var(--bg-dark);
}

.hero-overlay {
  backdrop-filter: blur(5px);
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(16, 16, 16, 0.95) 20%, rgba(16, 16, 16, 0.4) 60%, rgba(16, 16, 16, 0.1) 100%),
    linear-gradient(to top, rgba(16, 16, 16, 1) 0px, rgba(16, 16, 16, 1) 4px, rgba(16, 16, 16, 0) 25%);
}

.refresh-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.5);
  color: var(--muted-light);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms;
}

.refresh-btn:hover {
  background: var(--accent-four);
  color: #101010;
  transform: rotate(30deg);
}

.hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 40px;
  width: 100%;
  max-width: 800px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.1;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: var(--muted-mid);
}

.dot {
  font-weight: bold;
}

.hero-genres {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-four);
}

.rating-value {
  font-size: 20px;
  font-weight: 700;
}

.hero-plot {
  font-size: 14px;
  color: var(--muted-mid);
  line-height: 1.6;
  max-width: 600px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.primary-btn {
  background-color: var(--accent-four);
  color: rgb(20, 20, 20);
  font-weight: 600;
  padding: 10px 24px;
  font-size: 14px;
  transition: opacity 200ms;
}

.primary-btn:hover {
  opacity: 0.9;
}

.outline-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
  padding: 10px 24px;
  font-size: 14px;
  backdrop-filter: blur(4px);
  transition: all 200ms;
}

.outline-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>
