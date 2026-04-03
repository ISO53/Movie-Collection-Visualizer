<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImportStore } from '../../stores/import'
import { useMovieStore } from '../../stores/movies'

const importStore = useImportStore()
const movieStore = useMovieStore()

const isHovered = ref(false)
const isCancelHovered = ref(false)

const isVisible = computed(() => importStore.isImporting || importStore.showSummary)
const isExpanded = computed(() => isHovered.value && !isCancelHovered.value)

const timeRemaining = computed(() => {
  if (importStore.current === 0) return 'calculating...'
  const remainingMovies = importStore.total - importStore.current
  if (remainingMovies <= 0) return 'wrapping up...'
  const secsRemaining = (importStore.elapsedSecs / importStore.current) * remainingMovies
  const minutes = Math.floor(secsRemaining / 60)
  const seconds = Math.floor(secsRemaining % 60)
  if (minutes > 0) return `${minutes}m ${seconds}s remaining`
  return `${seconds}s remaining`
})

const progressPercent = computed(() => {
  if (importStore.total === 0) return 0
  return (importStore.current / importStore.total) * 100
})

function handleCancelEnter() { isCancelHovered.value = true }
function handleCancelLeave() { isCancelHovered.value = false }
</script>

<template>
  <div 
    class="status-bar" 
    :class="{ 
      hidden: !isVisible, 
      expanded: isExpanded,
      'is-complete': importStore.showSummary && !importStore.isImporting,
      'is-warning': importStore.rateLimited 
    }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="progress-bar-container">
      <div 
        class="progress-bar-fill" 
        :style="{ width: progressPercent + '%' }"
        :class="{ pulse: importStore.isImporting }"
      ></div>
    </div>
    
    <div class="main-row">
      <div class="left-section">
        <div class="status-indicator" :class="{ rotating: importStore.isImporting }">
          <svg v-if="importStore.isImporting" viewBox="0 0 24 24" class="status-icon">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
          <svg v-else-if="importStore.rateLimited" viewBox="0 0 24 24" class="status-icon warning">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" class="status-icon success">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <span class="status-text">
          <template v-if="importStore.isImporting">
            Importing: <span class="highlight">{{ importStore.currentTitle || 'Preparing...' }}</span>
          </template>
          <template v-else-if="importStore.rateLimited">
            API Rate Limit Reached
          </template>
          <template v-else>
            Sync Complete
          </template>
        </span>
        <span class="count" v-if="importStore.isImporting">({{ importStore.current }}/{{ importStore.total }})</span>
      </div>
      
      <div class="right-section">
        <span class="time" v-if="importStore.isImporting">{{ timeRemaining }}</span>
        
        <div class="actions">
          <button 
            v-if="importStore.isImporting"
            class="action-btn cancel" 
            @click="importStore.cancelImport"
            @mouseenter="handleCancelEnter"
            @mouseleave="handleCancelLeave"
          >
            <svg viewBox="0 0 24 24" class="btn-icon"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            Cancel
          </button>
          
          <button 
            v-if="!importStore.isImporting"
            class="action-btn dismiss" 
            @click="importStore.dismissSummary"
            @mouseenter="handleCancelEnter"
            @mouseleave="handleCancelLeave"
          >
            <svg viewBox="0 0 24 24" class="btn-icon"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            Dismiss
          </button>
        </div>
      </div>
    </div>

    <div class="expanded-content">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">DATABASE SYNCED</div>
          <div class="stat-value">{{ movieStore.movies.length }} movies</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">NEWLY DISCOVERED</div>
          <div class="stat-value">{{ importStore.newCount || importStore.total }} items</div>
        </div>
        <div class="stat-item" v-if="importStore.rateLimited">
          <div class="stat-label">STATUS</div>
          <div class="stat-value highlight-red">RATE LIMITED (skipped)</div>
        </div>
        <div class="stat-item" v-else>
          <div class="stat-label">LAST IMPORTED</div>
          <div class="stat-value">{{ importStore.lastResult?.totalImported || 0 }} movies</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">REMOVED FROM DISK</div>
          <div class="stat-value highlight-red">{{ importStore.removedCount }} items</div>
        </div>
      </div>
      
      <div class="sync-details" v-if="importStore.isImporting">
        <div class="detail-row">
          <span>Processing at:</span>
          <span class="detail-val">{{ (importStore.current / (importStore.elapsedSecs || 1)).toFixed(1) }} movies/sec</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 38px;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.status-bar.hidden {
  transform: translateY(100%);
}

.status-bar.expanded {
  height: 140px;
  background: rgba(15, 15, 15, 0.95);
}

.progress-bar-container {
  height: 2px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-four), #ffffff);
  transition: width 300ms ease;
  box-shadow: 0 0 12px var(--accent-four);
}

.progress-bar-fill.pulse {
  animation: pulse-shadow 2s infinite;
}

@keyframes pulse-shadow {
  0% { opacity: 0.8; }
  50% { opacity: 1; box-shadow: 0 0 16px var(--accent-four); }
  100% { opacity: 0.8; }
}

.main-row {
  height: 36px;
  min-height: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  font-size: 13px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-icon {
  width: 16px;
  height: 16px;
  fill: var(--accent-four);
}

.status-icon.success {
  fill: #4ade80;
}

.status-text {
  color: var(--muted-mid);
  white-space: nowrap;
}

.highlight {
  color: var(--text-main);
  font-weight: 600;
}

.count {
  color: var(--muted-mid);
  font-family: monospace;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.time {
  color: var(--muted-mid);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  padding: 3px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 200ms ease;
  cursor: pointer;
}

.action-btn.cancel {
  color: #ff5f5f;
}

.action-btn.cancel:hover {
  background: rgba(255, 95, 95, 0.15);
  border-color: rgba(255, 95, 95, 0.3);
}

.status-bar.is-warning {
  border-top-color: rgba(239, 68, 68, 0.4);
}

.status-bar.is-warning .progress-bar-fill {
  background: var(--accent-four);
}

.status-icon.warning {
  fill: var(--accent-four);
  filter: drop-shadow(0 0 8px rgba(236, 130, 0, 0.4));
}

.status-bar.is-warning .status-text {
  color: var(--accent-four);
  font-weight: 700;
}

.action-btn.dismiss {
  border-color: rgba(255, 255, 255, 0.15);
}

.action-btn.dismiss:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-icon {
  width: 12px;
  height: 12px;
  fill: currentColor;
}

/* Expanded Content */
.expanded-content {
  padding: 20px 24px;
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
}

.expanded .expanded-content {
  opacity: 1;
  pointer-events: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--muted-mid);
  letter-spacing: 1px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.highlight-red {
  color: #ff5f5f;
}

.sync-details {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 12px;
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: var(--muted-mid);
}

.detail-row {
  display: flex;
  gap: 8px;
}

.detail-val {
  color: var(--accent-four);
  font-weight: 600;
}
</style>
