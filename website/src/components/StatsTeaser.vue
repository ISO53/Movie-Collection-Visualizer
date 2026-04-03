<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const statsSection = ref(null)
const isVisible = ref(false)

const stats = ref([
  { id: 1, value: 0, target: 182, label: 'Movies Visualized', suffix: '' },
  { id: 2, value: 0, target: 7.8, label: 'Average Rating', suffix: '' },
  { id: 3, value: 0, target: 312, label: 'Hours of Cinema', suffix: 'h' }
])

let observer = null

const startCounting = () => {
  stats.value.forEach(stat => {
    const duration = 2000 // 2s
    const frameRate = 1000 / 60
    const totalFrames = Math.round(duration / frameRate)
    let frame = 0

    const counter = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      // Ease out quad
      const current = stat.target * (progress * (2 - progress))
      
      stat.value = Number.isInteger(stat.target) 
        ? Math.round(current) 
        : Number(current.toFixed(1))

      if (frame === totalFrames) {
        clearInterval(counter)
        stat.value = stat.target
      }
    }, frameRate)
  })
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isVisible.value) {
      isVisible.value = true
      startCounting()
    }
  }, { threshold: 0.3 })

  if (statsSection.value) {
    observer.observe(statsSection.value)
  }
})

onUnmounted(() => {
  if (observer && statsSection.value) {
    observer.unobserve(statsSection.value)
  }
})
</script>

<template>
  <section id="stats" class="stats-section" ref="statsSection">
    <div class="container">
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.id" class="stat-card" :class="{ 'fade-in': isVisible }">
          <div class="stat-number">
            {{ stat.value }}{{ stat.suffix }}
          </div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-section {
  padding: 6rem 0;
  background-color: var(--surface-bg);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  text-align: center;
}

.stat-card {
  padding: 3rem 2rem;
  background-color: var(--page-bg);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  transition: transform 0.3s ease;
  opacity: 0; 
}

.stat-card.fade-in {
  opacity: 1;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-number {
  font-size: clamp(3rem, 5vw, 4.5rem);
  font-weight: 800;
  color: var(--primary-accent);
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(236,130,0,0.3);
}

.stat-label {
  font-size: 1.1rem;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>
