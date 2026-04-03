<script setup>
import { ref } from 'vue'

const currentSlide = ref(0)
const slides = [
  { id: 1, image: new URL('../assets/screenshot-1.png', import.meta.url).href, label: 'Main Collection Dashboard' },
  { id: 2, image: new URL('../assets/screenshot-2.png', import.meta.url).href, label: 'Detailed Movie View' }
]

const setSlide = (index) => {
  currentSlide.value = index
}
</script>

<template>
  <section id="screenshots" class="screenshots-section">
    <div class="container">
      <div class="window-chrome fade-in">
        <div class="title-bar">
          <div class="traffic-lights">
            <div class="light close"></div>
            <div class="light min"></div>
            <div class="light exp"></div>
          </div>
          <div class="window-title">MVC - {{ slides[currentSlide].label }}</div>
        </div>
        
        <div class="window-content">
          <div class="carousel-container">
            <transition name="fade" mode="out-in">
              <img :key="currentSlide" :src="slides[currentSlide].image" :alt="slides[currentSlide].label" class="app-screenshot" />
            </transition>
          </div>
        </div>
      </div>

      <div class="carousel-controls fade-in delay-200">
        <button 
          v-for="(slide, index) in slides" 
          :key="index"
          :class="['dot', { active: currentSlide === index }]"
          @click="setSlide(index)"
          aria-label="View screenshot"
        ></button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.screenshots-section {
  background: linear-gradient(180deg, var(--page-bg) 0%, #151515 100%);
  padding: 8rem 0;
}

.window-chrome {
  max-width: 1000px;
  margin: 0 auto;
  background-color: var(--surface-bg);
  border-radius: 12px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05);
  overflow: hidden;
  transform: translateY(0);
  transition: transform 0.4s ease;
}

.window-chrome:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(236,130,0,0.3);
}

.title-bar {
  background-color: #1a1a1a;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
}

.traffic-lights {
  display: flex;
  gap: 8px;
}

.light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.close { background-color: #ff5f56; }
.min { background-color: #ffbd2e; }
.exp { background-color: #27c93f; }

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.window-content {
  position: relative;
  background-color: #0d0d0d;
  aspect-ratio: 16 / 9;
  width: 100%;
}

.carousel-container {
  width: 100%;
  height: 100%;
  position: relative;
}


.app-screenshot {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 2;
  background-color: var(--surface-bg);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.carousel-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 2rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255,255,255,0.2);
  transition: all 0.3s ease;
  padding: 0;
}

.dot.active {
  background-color: var(--primary-accent);
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(236, 130, 0, 0.5);
}

.dot:hover:not(.active) {
  background-color: rgba(255,255,255,0.4);
}
</style>
