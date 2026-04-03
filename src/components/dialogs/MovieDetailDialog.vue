<script setup lang="ts">
import { computed } from 'vue'
import { X, Star, Calendar, Clock, Award, Trash2 } from 'lucide-vue-next'
import { invoke } from '@tauri-apps/api/core'
import { useDialogStore } from '../../stores/dialog'
import { useMovieStore } from '../../stores/movies'
import { useToastStore } from '../../stores/toast'
import MoviePoster from '../shared/MoviePoster.vue'
import GenreBadge from '../shared/GenreBadge.vue'

const dialogStore = useDialogStore()
const movieStore = useMovieStore()
const toastStore = useToastStore()

const movie = computed(() => dialogStore.movieDetailData)

const genres = computed(() => {
  if (!movie.value?.genre || movie.value.genre === 'N/A') return []
  return movie.value.genre.split(',').map(g => g.trim())
})

async function openWrongMovie() {
  const m = movie.value
  if (m) {
    dialogStore.openWrongMovie(m)
  }
}

async function deleteMovie() {
  if (!movie.value) return
  if (confirm(`Are you sure you want to delete ${movie.value.title}?`)) {
    try {
      await movieStore.deleteMovie(movie.value.imdbId)
      toastStore.show('success', 'Movie deleted')
      dialogStore.closeMovieDetail()
    } catch (e: any) {
      toastStore.show('warning', 'Failed to delete movie')
    }
  }
}

const ratingsList = computed(() => {
  if (!movie.value?.ratingsJson) return []
  try {
    const list = JSON.parse(movie.value.ratingsJson)
    // Avoid double IMDb rating by filtering out the secondary one from OMDB
    return list.filter((r: any) => r.Source !== 'Internet Movie Database')
  } catch(e) {
    return []
  }
})

async function showInExplorer() {
  if (!movie.value?.fileName) return
  try {
    await invoke('show_in_explorer', { path: movie.value.fileName })
  } catch (e: any) {
    toastStore.show('warning', 'Error: ' + e)
  }
}
</script>

<template>
  <div v-if="movie" class="dialog-overlay" @click="dialogStore.closeMovieDetail">
    <div class="dialog-content" @click.stop>
      <button class="close-btn" @click="dialogStore.closeMovieDetail"><X :size="24" /></button>
      
      <div class="split-layout">
        <div class="poster-col">
          <MoviePoster 
            :poster-path="movie.posterPath" 
            :poster-url="movie.posterUrl" 
            :alt="movie.title"
            class="poster-large"
          />
          <div class="action-buttons">
            <button class="outline-btn" @click="openWrongMovie">Wrong Movie?</button>
            <button class="outline-btn destructive" @click="deleteMovie">
              <Trash2 :size="16" /> Delete
            </button>
          </div>
        </div>
        
        <div class="info-col">
          <h2 class="title">{{ movie.title }}</h2>
          
          <div class="meta-row">
            <span v-if="movie.year && movie.year !== 'N/A'" class="meta-item"><Calendar :size="14" /> {{ movie.year }}</span>
            <span v-if="movie.runtime && movie.runtime !== 'N/A'" class="meta-item"><Clock :size="14" /> {{ movie.runtime }}</span>
            <span v-if="movie.rated && movie.rated !== 'N/A'" class="meta-item boxed">{{ movie.rated }}</span>
          </div>

          <div class="genres" v-if="genres.length > 0">
            <GenreBadge v-for="g in genres" :key="g" :genre="g" />
          </div>

          <p class="plot">{{ movie.plot }}</p>

          <div class="details-grid">
            <div class="detail-cell" v-if="movie.director && movie.director !== 'N/A'">
              <span class="d-label">Director</span>
              <span class="d-value">{{ movie.director }}</span>
            </div>
            <div class="detail-cell" v-if="movie.writer && movie.writer !== 'N/A'">
              <span class="d-label">Writer</span>
              <span class="d-value">{{ movie.writer }}</span>
            </div>
            <div class="detail-cell span-2" v-if="movie.actors && movie.actors !== 'N/A'">
              <span class="d-label">Actors</span>
              <span class="d-value">{{ movie.actors }}</span>
            </div>
            <div class="detail-cell" v-if="movie.language && movie.language !== 'N/A'">
              <span class="d-label">Language</span>
              <span class="d-value">{{ movie.language }}</span>
            </div>
            <div class="detail-cell" v-if="movie.country && movie.country !== 'N/A'">
              <span class="d-label">Country</span>
              <span class="d-value">{{ movie.country }}</span>
            </div>
            <div class="detail-cell span-2" v-if="movie.awards && movie.awards !== 'N/A'">
              <span class="d-label"><Award :size="14" class="inline" /> Awards</span>
              <span class="d-value">{{ movie.awards }}</span>
            </div>
            <div class="detail-cell span-2" v-if="movie.fileName">
              <span class="d-label">File</span>
              <span class="d-value monospace path-text" :title="movie.fileName" @click="showInExplorer">{{ movie.fileName }}</span>
            </div>
          </div>

          <div class="ratings-section" v-if="ratingsList.length > 0 || (movie.imdbRating && movie.imdbRating !== 'N/A')">
            <h3>Ratings</h3>
            <div class="ratings-row">
              <div class="rating-box" v-if="movie.imdbRating && movie.imdbRating !== 'N/A'">
                <div class="r-source">IMDb</div>
                <div class="r-value"><Star :size="14" fill="currentColor" class="star" /> {{ movie.imdbRating }} <span class="r-votes" v-if="movie.imdbVotes && movie.imdbVotes !== 'N/A'">({{ movie.imdbVotes }})</span></div>
              </div>
              <div class="rating-box" v-for="r in ratingsList" :key="r.Source">
                <div class="r-source">{{ r.Source === 'Internet Movie Database' ? 'IMDb' : r.Source }}</div>
                <div class="r-value">{{ r.Value }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100;
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px);
}
.dialog-content {
  background: var(--bg-light); width: 100%; max-width: 900px; max-height: 90vh;
  border-radius: 12px; position: relative; border: 1px solid var(--muted-dark);
  display: flex; overflow: hidden;
}

.close-btn {
  position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,0.5); width: 32px; height: 32px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: var(--muted-light); z-index: 10; transition: all 200ms;
}
.close-btn:hover { background: var(--accent-four); color: #101010; }

.split-layout {
  display: flex; width: 100%; height: 100%; max-height: 90vh; overflow-y: auto;
}

.poster-col {
  width: 310px; flex-shrink: 0; background: var(--bg-dark); padding: 24px;
  display: flex; flex-direction: column; gap: 16px; min-height: 100%;
}

.poster-large { width: 100%; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

.action-buttons { display: flex; flex-direction: column; gap: 8px; }
.outline-btn {
  background: transparent; color: var(--text-main); border: 1px solid var(--muted-dark);
  border-radius: 4px; padding: 8px; font-weight: 500; font-size: 14px; transition: all 200ms;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.outline-btn:hover { background: rgba(255,255,255,0.05); border-color: var(--muted-mid); }
.outline-btn.destructive { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
.outline-btn.destructive:hover { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }

.info-col { flex: 1; padding: 32px 40px 32px 24px; }

.title { font-size: 32px; font-weight: 700; margin-bottom: 12px; line-height: 1.1; padding-right: 24px;}

.meta-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;}
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--muted-mid); font-weight: 500;}
.meta-item.boxed { border: 1px solid var(--muted-mid); padding: 2px 6px; border-radius: 4px; font-size: 12px; }

.genres { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }

.plot { font-size: 15px; line-height: 1.6; color: var(--muted-light); margin-bottom: 32px; }

.details-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px;
}
.detail-cell { display: flex; flex-direction: column; gap: 4px; }
.detail-cell.span-2 { grid-column: span 2; }
.d-label { font-size: 12px; color: var(--muted-mid); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
.d-value { font-size: 14px; color: var(--text-main); }
.d-value.monospace { font-family: monospace; color: var(--muted-mid); word-break: break-all; }
.path-text { 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  cursor: pointer; transition: color 200ms;
}
.path-text:hover { color: var(--accent-four); text-decoration: underline; }

.inline { display: inline-block; vertical-align: middle; margin-right: 4px; margin-top: -2px;}

.ratings-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--muted-mid); }
.ratings-row { display: flex; gap: 16px; flex-wrap: wrap; }
.rating-box {
  background: var(--bg-dark); border: 1px solid var(--muted-dark); border-radius: 6px;
  padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; min-width: 120px;
}
.r-source { font-size: 12px; color: var(--muted-mid); }
.r-value { font-size: 16px; font-weight: 600; color: white; display: flex; align-items: center; gap: 4px;}
.r-votes { font-size: 12px; font-weight: 400; color: var(--muted-mid); }
.star { color: var(--accent-four); }

@media (max-width: 768px) {
  .split-layout { flex-direction: column; }
  .poster-col { width: 100%; display: none; }
}
</style>
