<script setup>
import FeatureIcon from './FeatureIcon.vue'

const features = [
  {
    icon: 'import',
    title: 'Import from Folders',
    description: 'Bulk import your entire local directory structure quickly and accurately.'
  },
  {
    icon: 'metadata',
    title: 'OMDB Metadata Fetch',
    description: 'Automatically retrieve ratings, synopsis, and cast data via OMDB API integration.'
  },
  {
    icon: 'poster',
    title: 'Poster Caching',
    description: 'Downloads and caches high-quality posters locally for instantaneous offline viewing.'
  },
  {
    icon: 'search',
    title: 'Deep Search & Filter',
    description: 'Find movies instantly by title, genre, year, or custom runtime filters.'
  },
  {
    icon: 'sort',
    title: 'Sort & Shuffle',
    description: 'Sort your collection by rating or let the app pick a random movie for movie night.'
  },
  {
    icon: 'stats',
    title: 'Statistics Dashboard',
    description: 'View watch-time, average ratings, and collection value in a beautiful dashboard.'
  }
]
</script>

<template>
  <section id="features" class="features-section">
    <div class="container">
      <div class="section-header fade-in">
        <h2 class="section-title">Everything you need.</h2>
        <p class="section-subtitle">A simple tool equipped with powerful organizational features built-in.</p>
      </div>
      
      <div class="features-grid">
        <div v-for="(feature, index) in features" :key="index" class="feature-card fade-in" :style="`animation-delay: ${index * 100}ms`">
          <FeatureIcon :name="feature.icon" />
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-section {
  background-color: var(--page-bg);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: var(--surface-bg);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  transition: transform 0.3s ease, border-color 0.3s ease;
  border-left: 4px solid transparent;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(236,130,0,0.05), transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-left-color: var(--primary-accent);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.feature-desc {
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.95rem;
}
</style>
