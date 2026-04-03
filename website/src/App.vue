<script setup>
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import FeaturesLayout from './components/FeaturesLayout.vue'
import ScreenshotsSection from './components/ScreenshotsSection.vue'
import HowItWorks from './components/HowItWorks.vue'
import StatsTeaser from './components/StatsTeaser.vue'
import DownloadCTA from './components/DownloadCTA.vue'
import Footer from './components/Footer.vue'
import { onMounted, onUnmounted } from 'vue'

let observer = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.15 })

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <NavBar />
  <main>
    <HeroSection />
    <FeaturesLayout />
    <ScreenshotsSection />
    <HowItWorks />
    <StatsTeaser />
    <DownloadCTA />
  </main>
  <Footer />
</template>

<style>
/* Global intersection observer animations configured here to apply uniformly */
html {
  scroll-padding-top: 80px; /* Offset for fixed navbar */
}
</style>
