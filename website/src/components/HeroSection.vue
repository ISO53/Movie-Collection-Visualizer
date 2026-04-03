<script setup>
import HeroBackground from './HeroBackground.vue'
</script>

<template>
  <section id="hero" class="hero-section">
    <HeroBackground />
    
    <div class="container hero-content">
      <div class="hero-text fade-in">
        <h1 class="headline">Explore Your Cinema.</h1>
        <p class="subtitle fade-in delay-100">
          The ultimate vault for your local movies. Beautiful metadata, dynamic sorting, and automatic imports built specifically for the cinematic enthusiast.
        </p>
        <div class="cta-group fade-in delay-200">
          <a href="#download" class="btn-primary">Download Last Release</a>
          <a href="https://github.com/ISO53/Movie-Collection-Visualizer" target="_blank" class="btn-secondary">View on GitHub</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  height: 100vh;
  min-height: 800px;
  display: flex;
  align-items: center;
  padding: 0;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
}

.hero-text {
  max-width: 800px;
}

.headline {
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 30px rgba(236, 130, 0, 0.2);
}

.subtitle {
  font-size: clamp(1.1rem, 2vw, 1.3rem);
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 2.5rem;
  max-width: 600px;
}

.cta-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2rem;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  display: inline-block;
}

.btn-primary {
  background-color: var(--primary-accent);
  color: var(--page-bg);
  box-shadow: 0 4px 20px rgba(236, 130, 0, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(236, 130, 0, 0.5);
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .hero-text {
    text-align: center;
    margin: 0 auto;
  }
  
  .subtitle {
    margin-left: auto;
    margin-right: auto;
  }
  
  .cta-group {
    justify-content: center;
  }
}
</style>
