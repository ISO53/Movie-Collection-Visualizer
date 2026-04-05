<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMovieStore } from '../../stores/movies'
import { formatTotalRuntime, generateCsvContent, parseRuntime } from '../../lib/utils'
import { Download, Repeat } from 'lucide-vue-next'
import {
  Chart as ChartJS, CategoryScale, LinearScale, RadialLinearScale, BarElement, PointElement, LineElement, Filler, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Radar } from 'vue-chartjs'
import MovieRowCard from '../home/MovieRowCard.vue'

ChartJS.register(
  CategoryScale, LinearScale, RadialLinearScale, BarElement, PointElement, LineElement, Filler, Title, Tooltip, Legend
)

const movieStore = useMovieStore()
const router = useRouter()

function goToPerson(name: string) {
  router.push({ path: '/search', query: { q: name } })
}

const totalMovies = computed(() => movieStore.movies.length)

const averageRating = computed(() => {
  const valid = movieStore.movies.filter(m => m.imdbRating && m.imdbRating !== 'N/A')
  if (valid.length === 0) return '0.0'
  const sum = valid.reduce((acc, m) => acc + parseFloat(m.imdbRating!), 0)
  return (sum / valid.length).toFixed(1)
})

const totalRuntime = computed(() => {
  const mins = movieStore.movies.reduce((acc, m) => acc + parseRuntime(m.runtime), 0)
  return formatTotalRuntime(mins)
})

const uniqueDirectors = computed(() => {
  const set = new Set<string>()
  movieStore.movies.forEach(m => {
    if (m.director && m.director !== 'N/A') {
      m.director.split(',').forEach(d => set.add(d.trim()))
    }
  })
  return set.size
})

const decadeDataMixed = computed((): any => {
  const stats = new Map<number, { count: number, ratingSum: number, ratingCount: number }>()
  movieStore.movies.forEach(m => {
    if (m.year && m.year !== 'N/A') {
      const y = parseInt(m.year)
      if (!isNaN(y)) {
        const decade = Math.floor(y / 10) * 10
        const current = stats.get(decade) || { count: 0, ratingSum: 0, ratingCount: 0 }
        current.count++
        
        if (m.imdbRating && m.imdbRating !== 'N/A') {
          const r = parseFloat(m.imdbRating)
          if (!isNaN(r)) {
            current.ratingSum += r
            current.ratingCount++
          }
        }
        stats.set(decade, current)
      }
    }
  })
  
  const sortedKeys = Array.from(stats.keys()).sort()
  return {
    labels: sortedKeys.map(k => `${k}s`),
    datasets: [
      {
        type: 'line' as const,
        label: 'Avg Rating',
        borderColor: '#E5BA73',
        backgroundColor: '#E5BA73',
        borderWidth: 2,
        pointBackgroundColor: '#1a1a1a',
        pointBorderWidth: 2,
        pointRadius: 4,
        yAxisID: 'y1',
        data: sortedKeys.map(k => {
          const s = stats.get(k)!
          return s.ratingCount > 0 ? parseFloat((s.ratingSum / s.ratingCount).toFixed(1)) : 0
        })
      },
      {
        type: 'bar' as const,
        label: 'Movies',
        backgroundColor: '#ec8200',
        yAxisID: 'y',
        data: sortedKeys.map(k => stats.get(k)!.count)
      }
    ]
  }
})

function getTopItems(field: 'genre' | 'director' | 'actors' | 'writer', limit: number) {
  const counts = new Map<string, number>()
  movieStore.movies.forEach(m => {
    if (m[field] && m[field] !== 'N/A') {
      m[field]!.split(',').forEach(v => {
        const trimmed = v.trim()
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1)
      })
    }
  })
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit)
  return {
    labels: sorted.map(i => i[0]),
    datasets: [{
      label: 'Movies',
      backgroundColor: ['#ec8200', '#E5BA73', '#FAEAB1'],
      data: sorted.map(i => i[1])
    }]
  }
}

function getTopRatedItems(field: 'director' | 'actors' | 'genre' | 'writer', limit: number, minMovies: number = 2) {
  const ratings = new Map<string, { sum: number, count: number }>()
  movieStore.movies.forEach(m => {
    if (m[field] && m[field] !== 'N/A' && m.imdbRating && m.imdbRating !== 'N/A') {
      const rating = parseFloat(m.imdbRating)
      m[field]!.split(',').forEach(v => {
        const trimmed = v.trim()
        const current = ratings.get(trimmed) || { sum: 0, count: 0 }
        ratings.set(trimmed, { sum: current.sum + rating, count: current.count + 1 })
      })
    }
  })
  
  const entries = Array.from(ratings.entries())
    .filter(([_, data]) => data.count >= minMovies) // Increased min requirement
    .map(([name, data]) => ({ name, avg: data.sum / data.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, limit)
    
  return {
    labels: entries.map(e => e.name),
    datasets: [{
      label: 'Avg. Rating',
      backgroundColor: ['#ec8200', '#E5BA73', '#FAEAB1'],
      data: entries.map(e => parseFloat(e.avg.toFixed(1)))
    }]
  }
}

const directorSort = ref<'count' | 'rating'>('count')
const actorSort = ref<'count' | 'rating'>('count')
const writerSort = ref<'count' | 'rating'>('count')

function getLollipopData(field: 'director' | 'actors' | 'writer', sortMode: 'count' | 'rating', limit: number = 10) {
  const stats = new Map<string, { count: number, ratingSum: number, ratingCount: number }>()
  movieStore.movies.forEach(m => {
    if (m[field] && m[field] !== 'N/A') {
      m[field]!.split(',').forEach(v => {
        const name = v.trim()
        const current = stats.get(name) || { count: 0, ratingSum: 0, ratingCount: 0 }
        current.count++
        if (m.imdbRating && m.imdbRating !== 'N/A') {
          const r = parseFloat(m.imdbRating)
          if (!isNaN(r)) {
            current.ratingSum += r
            current.ratingCount++
          }
        }
        stats.set(name, current)
      })
    }
  })
  
  const entries = Array.from(stats.entries())
    .map(([name, s]) => ({
      name,
      count: s.count,
      avgRating: s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0
    }))
    .filter(e => e.count >= 3)

  if (sortMode === 'count') {
    entries.sort((a, b) => b.count - a.count || b.avgRating - a.avgRating)
  } else {
    entries.sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
  }
  
  return entries.slice(0, limit)
}

const lollipopDirectors = computed(() => getLollipopData('director', directorSort.value))
const lollipopActors = computed(() => getLollipopData('actors', actorSort.value))
const lollipopWriters = computed(() => getLollipopData('writer', writerSort.value))

function getRatingColor(rating: number) {
  // Map 0-10 to a range of orange brightness
  // Lower = #4a2b00, Mid = #9e6200, High = #ec8200
  if (rating >= 9) return '#ffaa00'
  if (rating >= 8) return '#ec8200'
  if (rating >= 7) return '#c46c00'
  if (rating >= 6) return '#9e5600'
  return '#6b3a00'
}

const genreData = computed(() => getTopItems('genre', 10))

const topRatedGenresRadar = computed(() => {
  const data = getTopRatedItems('genre', 8, 2)
  return {
    labels: data.labels,
    datasets: [{
      label: 'Avg Rating',
      backgroundColor: 'rgba(236, 130, 0, 0.4)',
      borderColor: '#ec8200',
      pointBackgroundColor: '#ec8200',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#ec8200',
      data: data.datasets[0].data
    }]
  }
})

const radarOptions = computed(() => {
  const data = topRatedGenresRadar.value.datasets[0].data as number[]
  let chartMin = 0
  let chartMax = 10
  
  if (data.length > 0) {
    const minVal = Math.min(...data)
    const maxVal = Math.max(...data)
    chartMin = Math.max(0, Math.floor(minVal) - 1)
    chartMax = Math.min(10, Math.ceil(maxVal) + 1)
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.2)' },
        pointLabels: { color: '#E5BA73', font: { size: 12, weight: 600 } },
        ticks: { 
          display: true, 
          color: 'rgba(255,255,255,0.4)', 
          backdropColor: 'transparent', 
          min: chartMin, 
          max: chartMax, 
          stepSize: 1 
        }
      }
    }
  }
})

const mixedChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: { legend: { display: true, labels: { color: 'rgba(255,255,255,0.6)' } } },
  scales: {
    y: { 
      type: 'linear' as const, display: true, position: 'left' as const,
      grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.6)' }
    },
    y1: {
      type: 'linear' as const, display: true, position: 'right' as const, min: 0, max: 10,
      grid: { drawOnChartArea: false }, ticks: { color: 'rgba(255,255,255,0.6)' }
    },
    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.6)' } }
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.6)', autoSkip: false } },
    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.6)', autoSkip: false } }
  }
}

const hzChartOptions = {
  ...chartOptions,
  indexAxis: 'y' as const,
}

const rarestGems = computed(() => {
  return movieStore.movies
    .filter(m => m.imdbRating && m.imdbRating !== 'N/A' && parseFloat(m.imdbRating) >= 8.0)
    .sort((a, b) => parseFloat(b.imdbRating!) - parseFloat(a.imdbRating!))
})

const isExportOpen = ref(false)

function exportCsv() {
  const csv = generateCsvContent(movieStore.movies)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Movie_Collection_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  isExportOpen.value = false
}

async function exportPdf() {
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
  
  const doc = new jsPDF('landscape')
  doc.setFillColor(16, 16, 16)
  doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F')
  doc.setTextColor(255, 255, 255)
  
  doc.setFontSize(20)
  doc.text(`Movie Collection — ${new Date().toLocaleDateString()}`, 14, 22)
  doc.setFontSize(12)
  doc.text(`Total Movies: ${totalMovies.value}  |  Average Rating: ${averageRating.value}  |  Total Runtime: ${totalRuntime.value}`, 14, 32)
  
  const body = movieStore.movies.map(m => [
    m.title, m.year || '', m.genre || '', m.imdbRating || '', m.director || '', m.runtime || ''
  ])
  
  ;(doc as any).autoTable({
    startY: 40,
    head: [['Title', 'Year', 'Genre', 'IMDB Rating', 'Director', 'Runtime']],
    body,
    theme: 'plain',
    styles: { fillColor: [31, 31, 31], textColor: [255, 255, 255], lineColor: [50, 50, 50], lineWidth: 0.1 },
    headStyles: { fillColor: [236, 130, 0], textColor: [0, 0, 0], fontStyle: 'bold' }
  })
  
  doc.save(`Movie_Collection_${new Date().toISOString().split('T')[0]}.pdf`)
  isExportOpen.value = false
}
</script>

<template>
  <div class="stats-container">
    <div class="header-row">
      <h2>Collection Statistics</h2>
      <div class="dropdown-wrapper">
        <button class="primary-btn export-btn" @click="isExportOpen = !isExportOpen">
          <Download :size="16" /> Export
        </button>
        <div v-if="isExportOpen" class="overlay" @click="isExportOpen = false"></div>
        <div v-if="isExportOpen" class="dropdown-menu">
          <button class="dropdown-item" @click="exportCsv">Export as CSV</button>
          <button class="dropdown-item" @click="exportPdf">Export as PDF</button>
        </div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Total Movies</span>
        <span class="metric-value">{{ totalMovies }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Avg. IMDB Rating</span>
        <span class="metric-value">{{ averageRating }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Total Runtime</span>
        <span class="metric-value">{{ totalRuntime }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Unique Directors</span>
        <span class="metric-value">{{ uniqueDirectors }}</span>
      </div>
    </div>
    
    <!-- Time & Trends Section -->
    <h2 class="section-heading">Time & Trends</h2>
    <div class="charts-row single">
      <div class="chart-card">
        <h3 class="chart-title">Movies By Decade vs Average Rating</h3>
        <div class="chart-wrapper"><Bar :data="decadeDataMixed" :options="mixedChartOptions" /></div>
      </div>
    </div>
    
    <!-- Genres Section -->
    <h2 class="section-heading">Thematic Breakdown</h2>
    <div class="charts-row genres-layout">
      <div class="chart-card frequent-genres">
        <h3 class="chart-title">Most Frequent Genres</h3>
        <div class="chart-wrapper"><Bar :data="genreData" :options="hzChartOptions" /></div>
      </div>
      <div class="chart-card rated-genres">
        <h3 class="chart-title">Highest Rated Genres</h3>
        <div class="chart-wrapper square"><Radar :data="topRatedGenresRadar" :options="radarOptions" /></div>
      </div>
    </div>
    
    <!-- Cast & Crew Section -->
    <h2 class="section-heading">Cast & Crew Analytics</h2>
    <div class="charts-row three-col">
      <!-- Directors Lollipop -->
      <div class="chart-card">
        <div class="card-header-actions">
          <h3 class="chart-title">Top Directors</h3>
          <button class="sort-toggle-btn" @click="directorSort = directorSort === 'count' ? 'rating' : 'count'" :title="'Sort by ' + (directorSort === 'count' ? 'Rating' : 'Count')">
            <Repeat :size="12" /> {{ directorSort === 'count' ? 'Mode: Count' : 'Mode: Rating' }}
          </button>
        </div>
        <div class="lollipop-container">
          <div v-for="d in lollipopDirectors" :key="d.name" class="lollipop-item" @click="goToPerson(d.name)">
            <div class="loll-track">
              <div class="loll-bar" :style="{ width: (d.count / Math.max(...lollipopDirectors.map(x => x.count)) * 90) + '%' }">
                <span class="loll-name-in">{{ d.name }} <span class="loll-count-in">({{ d.count }})</span></span>
              </div>
              <div class="loll-dot" :style="{ backgroundColor: getRatingColor(d.avgRating), left: (d.count / Math.max(...lollipopDirectors.map(x => x.count)) * 90) + '%' }">
                <span class="loll-rating">{{ d.avgRating.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actors Lollipop -->
      <div class="chart-card">
        <div class="card-header-actions">
          <h3 class="chart-title">Top Actors</h3>
          <button class="sort-toggle-btn" @click="actorSort = actorSort === 'count' ? 'rating' : 'count'" :title="'Sort by ' + (actorSort === 'count' ? 'Rating' : 'Count')">
            <Repeat :size="12" /> {{ actorSort === 'count' ? 'Mode: Count' : 'Mode: Rating' }}
          </button>
        </div>
        <div class="lollipop-container">
          <div v-for="a in lollipopActors" :key="a.name" class="lollipop-item" @click="goToPerson(a.name)">
            <div class="loll-track">
              <div class="loll-bar" :style="{ width: (a.count / Math.max(...lollipopActors.map(x => x.count)) * 90) + '%' }">
                <span class="loll-name-in">{{ a.name }} <span class="loll-count-in">({{ a.count }})</span></span>
              </div>
              <div class="loll-dot" :style="{ backgroundColor: getRatingColor(a.avgRating), left: (a.count / Math.max(...lollipopActors.map(x => x.count)) * 90) + '%' }">
                <span class="loll-rating">{{ a.avgRating.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Writers Lollipop -->
      <div class="chart-card">
        <div class="card-header-actions">
          <h3 class="chart-title">Top Writers</h3>
          <button class="sort-toggle-btn" @click="writerSort = writerSort === 'count' ? 'rating' : 'count'" :title="'Sort by ' + (writerSort === 'count' ? 'Rating' : 'Count')">
            <Repeat :size="12" /> {{ writerSort === 'count' ? 'Mode: Count' : 'Mode: Rating' }}
          </button>
        </div>
        <div class="lollipop-container">
          <div v-for="w in lollipopWriters" :key="w.name" class="lollipop-item" @click="goToPerson(w.name)">
            <div class="loll-track">
              <div class="loll-bar" :style="{ width: (w.count / Math.max(...lollipopWriters.map(x => x.count)) * 90) + '%' }">
                <span class="loll-name-in">{{ w.name }} <span class="loll-count-in">({{ w.count }})</span></span>
              </div>
              <div class="loll-dot" :style="{ backgroundColor: getRatingColor(w.avgRating), left: (w.count / Math.max(...lollipopWriters.map(x => x.count)) * 90) + '%' }">
                <span class="loll-rating">{{ w.avgRating.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="rarestGems.length > 0" class="gems-section">
      <h3 class="gems-title">Your Rarest Gems</h3>
      <div class="cards-scroll">
        <MovieRowCard v-for="m in rarestGems.slice(0, 20)" :key="m.imdbId" :movie="m" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--accent-four);
  color: #101010;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 4px;
}

.dropdown-wrapper { position: relative; }
.overlay { position: fixed; inset: 0; z-index: 100; }
.dropdown-menu {
  position: absolute; top: calc(100% + 8px); right: 0;
  background-color: var(--bg-light); border: 1px solid var(--muted-dark);
  border-radius: 8px; padding: 4px; min-width: 150px; z-index: 101;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.dropdown-item {
  width: 100%; text-align: left; padding: 8px 12px; background: transparent;
  border: none;
  color: var(--text-main); font-size: 14px;
}
.dropdown-item:hover { background-color: rgba(255,255,255,0.1); }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  background-color: var(--bg-light);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label { font-size: 12px; color: var(--muted-mid); }
.metric-value { font-size: 32px; font-weight: 700; color: white; }

.section-heading {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 16px 0 0 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
.charts-row.single { grid-template-columns: 1fr; }
.charts-row.genres-layout { grid-template-columns: 1fr minmax(300px, 400px); }
.charts-row.three-col { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width: 1200px) { .charts-row.three-col { grid-template-columns: 1fr 1fr; } }
@media (max-width: 1000px) { .charts-row, .charts-row.genres-layout, .charts-row.three-col { grid-template-columns: 1fr; } }

.lollipop-container {
  display: flex; flex-direction: column; gap: 8px;
}
.lollipop-item {
  display: flex; flex-direction: column; width: 100%; cursor: pointer; transition: opacity 0.2s;
}
.lollipop-item:hover { opacity: 0.8; }
.lollipop-item:hover .loll-bar { background: rgba(255,255,255,0.12); }
.loll-track { height: 24px; position: relative; width: 100%; display: flex; align-items: center; }
.loll-bar {
  height: 24px; background: rgba(255,255,255,0.06); border-radius: 4px;
  transition: width 0.5s ease; position: relative; display: flex; align-items: center;
  padding-left: 10px; overflow: hidden; min-width: 40px;
}
.loll-name-in {
  font-size: 11px; color: var(--text-main); white-space: nowrap; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.loll-count-in { font-size: 10px; color: var(--muted-mid); margin-left: 4px; font-weight: 400; }
.loll-dot {
  position: absolute; transform: translateY(-50%) translateX(-50%); top: 50%;
  width: 32px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 2;
}
.loll-rating { font-size: 11px; color: #000; font-weight: 800; }

.chart-card {
  background-color: var(--bg-light); border-radius: 12px; padding: 20px;
  height: 100%; display: flex; flex-direction: column; overflow: hidden;
}
.card-header-actions {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px;
}
.chart-title { font-size: 16px; font-weight: 600; margin: 0; color: var(--muted-mid); }
.sort-toggle-btn {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: var(--muted-mid); font-size: 11px; padding: 4px 8px; border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;
}
.sort-toggle-btn:hover { background: rgba(255,255,255,0.1); color: var(--accent-four); }

.rated-genres { aspect-ratio: 1 / 1; max-width: 400px; width: 100%; justify-self: end; }
.chart-wrapper { flex: 1; min-height: 280px; position: relative; }
@media (max-width: 1000px) { 
  .charts-row.genres-layout { grid-template-columns: 1fr; } 
  .rated-genres { width: 100%; max-width: 100%; aspect-ratio: auto; } 
}

.gems-section { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.gems-title { font-size: 20px; font-weight: 600; }
.cards-scroll { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px; scrollbar-width: thin; scrollbar-color: var(--muted-dark) transparent; }
.cards-scroll::-webkit-scrollbar { height: 6px; }
.cards-scroll::-webkit-scrollbar-track { background: transparent; }
.cards-scroll::-webkit-scrollbar-thumb { background: var(--muted-dark); border-radius: 3px; }
.cards-scroll::-webkit-scrollbar-thumb:hover { background: var(--muted-mid); }
</style>
