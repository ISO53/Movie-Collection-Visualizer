<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useMovieStore } from '../stores/movies'
import { useDialogStore } from '../stores/dialog'
import { parseImdbRating, splitAndTrim, parseRuntime, formatTotalRuntime } from '../lib/utils'
import HeroBanner from '../components/home/HeroBanner.vue'

const movieStore = useMovieStore()
const dialogStore = useDialogStore()
const router = useRouter()

const isEmpty = computed(() => movieStore.movies.length === 0)

// Section 1: Stats
const stats = computed(() => {
  const total = movieStore.movies.length
  if (total === 0) return []
  
  const avgRating = (movieStore.movies.reduce((acc, m) => acc + parseImdbRating(m.imdbRating), 0) / total).toFixed(1)
  
  const allDirectors = movieStore.movies.flatMap(m => splitAndTrim(m.director))
  const uniqueDirectors = new Set(allDirectors).size
  
  const totalMinutes = movieStore.movies.reduce((acc, m) => acc + parseRuntime(m.runtime), 0)
  
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const thisMonthCount = movieStore.movies.filter(m => new Date(m.addedAt) >= firstDayOfMonth).length

  return [
    { label: 'TOTAL MOVIES', value: total, trend: `↑ ${thisMonthCount} this month` },
    { label: 'AVG RATING', value: avgRating, trend: '↑ 0.1 from last week' },
    { label: 'DIRECTORS', value: uniqueDirectors, trend: '↑ 2 new' },
    { label: 'TOTAL RUNTIME', value: formatTotalRuntime(totalMinutes), trend: '↑ 14h this month' }
  ]
})

// Section 2: Featured Mosaic
const featuredMovies = computed(() => {
  return [...movieStore.movies]
    .filter(m => m.imdbRating && m.imdbRating !== 'N/A')
    .sort((a, b) => parseImdbRating(b.imdbRating) - parseImdbRating(a.imdbRating))
    .slice(0, 5)
})

// Section 3: Browse by Mood
const moodGenres = computed(() => {
  const counts = new Map<string, number>()
  movieStore.movies.forEach(m => {
    splitAndTrim(m.genre).forEach(g => {
      counts.set(g, (counts.get(g) || 0) + 1)
    })
  })
  
  const genreData = [
    { name: 'Action', emoji: '🔥', gradient: 'linear-gradient(135deg, #451a1a 0%, #2a0a0a 100%)' },
    { name: 'Comedy', emoji: '😂', gradient: 'linear-gradient(135deg, #1a451a 0%, #0a2a0a 100%)' },
    { name: 'Horror', emoji: '👻', gradient: 'linear-gradient(135deg, #1a1a45 0%, #0a0a2a 100%)' },
    { name: 'Drama', emoji: '🎭', gradient: 'linear-gradient(135deg, #451a45 0%, #2a0a2a 100%)' },
    { name: 'Sci-Fi', emoji: '🚀', gradient: 'linear-gradient(135deg, #1a4545 0%, #0a2a2a 100%)' },
    { name: 'Thriller', emoji: '🔪', gradient: 'linear-gradient(135deg, #45451a 0%, #2a2a0a 100%)' }
  ]

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => {
      const preset = genreData.find(g => g.name === name) || {
        name,
        emoji: '🎬',
        gradient: `linear-gradient(135deg, #333 0%, #111 100%)`
      }
      return { ...preset, count }
    })
})

// Section 4: Directors
const topDirectors = computed(() => {
  const counts = new Map<string, number>()
  movieStore.movies.forEach(m => {
    splitAndTrim(m.director).forEach(d => {
      counts.set(d, (counts.get(d) || 0) + 1)
    })
  })
  
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => {
      const directorMovies = movieStore.movies
        .filter(m => splitAndTrim(m.director).includes(name))
        .slice(0, 4)
      
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      
      return { name, count, movies: directorMovies, initials }
    })
})

function getInitialsGradient(name: string) {
  const hues = [200, 260, 320, 20, 50, 140]
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = hues[charCodeSum % hues.length]
  return `linear-gradient(135deg, hsl(${hue}, 60%, 40%) 0%, hsl(${hue}, 70%, 20%) 100%)`
}

function openMovie(movie: any) {
  dialogStore.openMovieDetail(movie)
}

function getPosterUrl(movie: any) {
  if (!movie) return ''
  if (movie.posterPath) return convertFileSrc(movie.posterPath)
  if (movie.posterUrl && movie.posterUrl !== 'N/A') return movie.posterUrl
  return ''
}
</script>

<template>
  <div class="home-container">
    <div v-if="isEmpty && !movieStore.isLoading" class="empty-state">
      <div class="empty-content">
        <h1 class="empty-title">Movie Collection Visualizer</h1>
        <p class="empty-subtitle">Your personal movie collection</p>
        <button class="primary-btn" @click="router.push('/profile?tab=settings')">
          Setup Your Collection
        </button>
      </div>
    </div>
    
    <div v-else-if="!isEmpty" class="scroll-content">
      <HeroBanner />
      
      <div class="content-sections">
        <!-- Section 1: Stats Strip -->
        <section class="stats-section">
          <div class="stats-grid">
            <div 
              v-for="stat in stats" 
              :key="stat.label" 
              class="stat-card"
              @click="router.push('/profile?tab=stats')"
            >
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-trend">{{ stat.trend }}</div>
            </div>
          </div>
        </section>

        <!-- Section 2: Featured Mosaic -->
        <section class="section-container">
          <header class="section-header">
            <h2 class="section-title">Handpicked for tonight</h2>
            <router-link to="/search?sort=rating_desc" class="see-all-link">See all →</router-link>
          </header>
          
          <div class="mosaic-grid" v-if="featuredMovies.length > 0">
            <!-- Large Card -->
            <div 
              class="mosaic-card large" 
              :style="{ backgroundImage: `url(${getPosterUrl(featuredMovies[0])})` }"
              @click="openMovie(featuredMovies[0])"
            >
              <div class="mosaic-overlay">
                <div class="mosaic-top">
                  <span class="rating-badge">★ {{ featuredMovies[0].imdbRating }}</span>
                  <span class="top-rated-pill">TOP RATED</span>
                </div>
                <div class="mosaic-bottom">
                  <h3 class="movie-title">{{ featuredMovies[0].title }}</h3>
                  <p class="movie-meta">{{ featuredMovies[0].year }} • {{ featuredMovies[0].runtime }}</p>
                </div>
              </div>
            </div>
            
            <!-- Small Cards -->
            <div class="mini-grid">
              <div 
                v-for="movie in featuredMovies.slice(1, 5)" 
                :key="movie.imdbId"
                class="mosaic-card small"
                :style="{ backgroundImage: `url(${getPosterUrl(movie)})` }"
                @click="openMovie(movie)"
              >
                <div class="mosaic-overlay">
                  <div class="mosaic-top">
                    <span class="rating-badge small">★ {{ movie.imdbRating }}</span>
                  </div>
                  <div class="mosaic-bottom">
                    <h4 class="movie-title small">{{ movie.title }}</h4>
                    <p class="movie-meta small">{{ movie.year }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 3: Browse by Mood -->
        <section class="section-container">
          <header class="section-header">
            <h2 class="section-title">Browse by mood</h2>
            <router-link to="/search" class="see-all-link">All genres →</router-link>
          </header>
          
          <div class="mood-grid">
            <div 
              v-for="genre in moodGenres" 
              :key="genre.name"
              class="genre-tile"
              :style="{ background: genre.gradient }"
              @click="router.push(`/search?genre=${genre.name}`)"
            >
              <div class="genre-info">
                <div class="genre-name">{{ genre.name }}</div>
                <div class="genre-count">{{ genre.count }} films</div>
              </div>
              <div class="genre-emoji">{{ genre.emoji }}</div>
            </div>
          </div>
        </section>

        <!-- Section 4: Directors -->
        <section class="section-container">
          <header class="section-header">
            <h2 class="section-title">Directors in your collection</h2>
            <router-link to="/search" class="see-all-link">View all →</router-link>
          </header>
          
          <div class="director-grid">
            <div 
              v-for="director in topDirectors" 
              :key="director.name"
              class="director-card"
              @click="router.push(`/search?director=${director.name}`)"
            >
              <div class="director-avatar" :style="{ background: getInitialsGradient(director.name) }">
                {{ director.initials }}
              </div>
              <h3 class="director-name">{{ director.name }}</h3>
              <p class="director-count">{{ director.count }} films</p>
              
              <div class="mini-posters">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  class="mini-poster-placeholder"
                >
                  <img 
                    v-if="director.movies[i-1]" 
                    :src="getPosterUrl(director.movies[i-1])" 
                    alt=""
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  height: 100%;
}

.scroll-content {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-dark);
}

.content-sections {
  padding: 32px 32px 64px 32px;
  background-color: var(--bg-dark);
}

/* Section Common */
.section-container {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.see-all-link {
  color: var(--accent-four);
  text-decoration: none;
  font-size: 14px;
  transition: opacity 0.2s;
}

.see-all-link:hover {
  opacity: 0.8;
}

/* Section 1: Stats */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: #1a1a1a;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.stat-card:hover {
  border-color: var(--accent-four);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-mid);
  text-transform: uppercase;
  margin-top: 4px;
}

.stat-trend {
  font-size: 12px;
  color: var(--accent-four);
  margin-top: 12px;
}

/* Section 2: Mosaic */
.mosaic-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 408px;
}

.mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
}

.mosaic-card {
  border-radius: 12px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  position: relative;
  cursor: pointer;
}

.mosaic-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%);
  z-index: 1;
}

.mosaic-overlay {
  position: relative;
  z-index: 2;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mosaic-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.rating-badge {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  color: var(--accent-four);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
}

.rating-badge.small {
  font-size: 11px;
  padding: 2px 6px;
}

.top-rated-pill {
  background: var(--accent-four);
  color: black;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.movie-title {
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.movie-title.small {
  font-size: 14px;
}

.movie-meta {
  color: var(--muted-mid);
  font-size: 14px;
  margin: 4px 0 0 0;
}

.movie-meta.small {
  font-size: 11px;
}

/* Section 3: Mood */
.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.genre-tile {
  height: 90px;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  transition: transform 0.2s;
}

.genre-tile:hover {
  transform: translateY(-2px);
}

.genre-info {
  z-index: 2;
}

.genre-name {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.genre-count {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}

.genre-emoji {
  font-size: 48px;
  opacity: 0.15;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  user-select: none;
}

/* Section 4: Directors */
.director-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.director-card {
  background: #1a1a1a;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.director-card:hover {
  border-color: var(--accent-four);
}

.director-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 12px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.director-name {
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.director-count {
  color: var(--muted-mid);
  font-size: 12px;
  margin: 4px 0 16px 0;
}

.mini-posters {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.mini-poster-placeholder {
  width: 28px;
  height: 40px;
  border-radius: 4px;
  background: #000;
  overflow: hidden;
}

.mini-poster-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 64px);
}

.empty-content {
  text-align: center;
  background-color: var(--bg-light);
  padding: 48px;
  border-radius: 12px;
  max-width: 400px;
}

.empty-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-four);
  margin-bottom: 8px;
}

.empty-subtitle {
  color: var(--muted-mid);
  margin-bottom: 24px;
}

.primary-btn {
  background-color: var(--accent-four);
  color: rgb(30,30,30);
  font-weight: 600;
  padding: 10px 24px;
  font-size: 16px;
  transition: opacity 200ms;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.primary-btn:hover {
  opacity: 0.9;
}
</style>
