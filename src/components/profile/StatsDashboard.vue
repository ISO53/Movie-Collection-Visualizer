<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMovieStore } from '../../stores/movies'
import { formatTotalRuntime, generateCsvContent } from '../../lib/utils'
import { Download } from 'lucide-vue-next'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import MovieRowCard from '../home/MovieRowCard.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const movieStore = useMovieStore()

const totalMovies = computed(() => movieStore.movies.length)

const averageRating = computed(() => {
  const valid = movieStore.movies.filter(m => m.imdbRating && m.imdbRating !== 'N/A')
  if (valid.length === 0) return '0.0'
  const sum = valid.reduce((acc, m) => acc + parseFloat(m.imdbRating!), 0)
  return (sum / valid.length).toFixed(1)
})

const totalRuntime = computed(() => {
  const mins = movieStore.movies.reduce((acc, m) => {
    if (m.runtime && m.runtime !== 'N/A') {
      const parsed = parseInt(m.runtime)
      if (!isNaN(parsed)) return acc + parsed
    }
    return acc
  }, 0)
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

const decadeData = computed(() => {
  const counts = new Map<number, number>()
  movieStore.movies.forEach(m => {
    if (m.year && m.year !== 'N/A') {
      const y = parseInt(m.year)
      if (!isNaN(y)) {
        const decade = Math.floor(y / 10) * 10
        counts.set(decade, (counts.get(decade) || 0) + 1)
      }
    }
  })
  const sortedKeys = Array.from(counts.keys()).sort()
  return {
    labels: sortedKeys.map(k => `${k}s`),
    datasets: [{
      label: 'Movies',
      backgroundColor: '#ec8200',
      data: sortedKeys.map(k => counts.get(k) || 0)
    }]
  }
})

function getTopItems(field: 'genre' | 'director' | 'actors', limit: number) {
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

const genreData = computed(() => getTopItems('genre', 10))
const directorData = computed(() => getTopItems('director', 15))
const actorData = computed(() => getTopItems('actors', 20))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.6)' } },
    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.6)' } }
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
    
    <div class="charts-row">
      <div class="chart-card">
        <h3 class="chart-title">Movies By Decade</h3>
        <div class="chart-wrapper"><Bar :data="decadeData" :options="chartOptions" /></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Top Genres</h3>
        <div class="chart-wrapper"><Bar :data="genreData" :options="hzChartOptions" /></div>
      </div>
    </div>
    
    <div class="charts-row">
      <div class="chart-card">
        <h3 class="chart-title">Top Directors</h3>
        <div class="chart-wrapper"><Bar :data="directorData" :options="hzChartOptions" /></div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Top Actors</h3>
        <div class="chart-wrapper"><Bar :data="actorData" :options="hzChartOptions" /></div>
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

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 1000px) { .charts-row { grid-template-columns: 1fr; } }

.chart-card {
  background-color: var(--bg-light); border-radius: 12px; padding: 20px;
}
.chart-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--muted-mid); }
.chart-wrapper { height: 300px; position: relative; }

.gems-section { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.gems-title { font-size: 20px; font-weight: 600; }
.cards-scroll { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px; scrollbar-width: thin; scrollbar-color: var(--muted-dark) transparent; }
.cards-scroll::-webkit-scrollbar { height: 6px; }
.cards-scroll::-webkit-scrollbar-track { background: transparent; }
.cards-scroll::-webkit-scrollbar-thumb { background: var(--muted-dark); border-radius: 3px; }
.cards-scroll::-webkit-scrollbar-thumb:hover { background: var(--muted-mid); }
</style>
