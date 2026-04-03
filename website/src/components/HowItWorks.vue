<script setup>
const steps = [
  { id: 1, title: 'Get OMDB Key', desc: 'Sign up for a simple free API key from OMDB to fetch live metadata.' },
  { id: 2, title: 'Import Collection', desc: 'Select your root movie folder. MVC correctly parses nested directory structures automatically.' },
  { id: 3, title: 'Auto-Fetch Metadata', desc: 'The app scours OMDB, matching movie titles to years and pulling descriptions and actors.' },
  { id: 4, title: 'Browse & Explore', desc: 'Cache high-res posters offline, shuffle your collection, and filter down your perfect movie night.' }
]
</script>

<template>
  <section id="how-it-works" class="hiw-section">
    <div class="container">
      <div class="section-header fade-in">
        <h2 class="section-title">How It Works</h2>
        <p class="section-subtitle">Set up your local library in four simple steps.</p>
      </div>

      <div class="timeline">
        <div v-for="(step, index) in steps" :key="step.id" class="timeline-step fade-in" :style="`animation-delay: ${index * 150}ms`">
          <div class="step-badge">
            <span class="step-number">{{ step.id }}</span>
          </div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-desc">{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hiw-section {
  background-color: var(--page-bg);
}

.section-header {
  text-align: center;
  margin-bottom: 5rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.timeline {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 5%;
  right: 5%;
  height: 2px;
  background: linear-gradient(90deg, var(--surface-bg) 0%, var(--primary-accent) 50%, var(--surface-bg) 100%);
  z-index: 1;
}

.timeline-step {
  flex: 1;
  text-align: center;
  position: relative;
  z-index: 2;
  padding: 0 1rem;
}

.step-badge {
  width: 60px;
  height: 60px;
  background-color: var(--surface-bg);
  border: 2px solid var(--primary-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  box-shadow: 0 0 20px rgba(236,130,0,0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.timeline-step:hover .step-badge {
  transform: scale(1.1);
  box-shadow: 0 0 30px rgba(236,130,0,0.4);
  background-color: var(--primary-accent);
}

.step-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-accent);
}

.timeline-step:hover .step-number {
  color: var(--page-bg);
}

.step-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.step-desc {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .timeline {
    flex-direction: column;
    gap: 3rem;
  }
  
  .timeline::before {
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, var(--surface-bg) 0%, var(--primary-accent) 50%, var(--surface-bg) 100%);
    transform: translateX(-50%);
  }
  
  .timeline-step {
    padding: 0;
    background: var(--page-bg);
  }
}
</style>
