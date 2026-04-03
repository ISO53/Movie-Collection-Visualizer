<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import logo from '../assets/logo.svg'

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const scrollTo = (id) => {
  isMobileMenuOpen.value = false
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <nav :class="['navbar', { 'nav-scrolled': isScrolled }]">
    <div class="container nav-content">
      <div class="logo" @click="scrollTo('hero')">
        <img :src="logo" alt="Movie Collection Visualizer Logo" class="logo-img" />
      </div>

      <div class="nav-links desktop-only">
        <button @click="scrollTo('hero')">Home</button>
        <button @click="scrollTo('features')">Features</button>
        <button @click="scrollTo('how-it-works')">How It Works</button>
        <button @click="scrollTo('download')" class="btn-primary-outline">Download</button>
      </div>

      <div class="mobile-toggle" @click="toggleMenu">
        <span class="bar" :class="{ 'bar-open-1': isMobileMenuOpen }"></span>
        <span class="bar" :class="{ 'bar-open-2': isMobileMenuOpen }"></span>
        <span class="bar" :class="{ 'bar-open-3': isMobileMenuOpen }"></span>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ 'menu-open': isMobileMenuOpen }">
      <button @click="scrollTo('hero')">Home</button>
      <button @click="scrollTo('features')">Features</button>
      <button @click="scrollTo('how-it-works')">How It Works</button>
      <button @click="scrollTo('download')" class="btn-primary">Download</button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  z-index: 100;
  transition: background-color 0.4s ease, border-bottom 0.4s ease;
  background-color: transparent;
  border-bottom: 1px solid transparent;
}

.nav-scrolled {
  background-color: rgba(16, 16, 16, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo {
  cursor: pointer;
}

.logo-img {
  height: 40px;
  width: auto;
  display: block;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-links button {
  background: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.nav-links button:hover {
  color: var(--primary-accent);
}

.btn-primary-outline {
  border: 1px solid var(--primary-accent) !important;
  padding: 0.5rem 1.25rem;
  border-radius: 4px;
  color: var(--primary-accent) !important;
  transition: all 0.3s ease !important;
}

.btn-primary-outline:hover {
  background-color: var(--primary-accent) !important;
  color: var(--page-bg) !important;
  box-shadow: 0 0 15px rgba(236, 130, 0, 0.4);
}

.btn-primary {
  background-color: var(--primary-accent);
  color: var(--page-bg);
  padding: 0.8rem 2rem;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 1rem;
}

.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  z-index: 101;
}

.bar {
  width: 25px;
  height: 2px;
  background-color: var(--text-primary);
  transition: all 0.3s ease;
}

.bar-open-1 { transform: translateY(8px) rotate(45deg); }
.bar-open-2 { opacity: 0; }
.bar-open-3 { transform: translateY(-8px) rotate(-45deg); }

.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 70%;
  height: 100vh;
  background-color: var(--surface-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  transition: right 0.4s ease;
  z-index: 99;
  box-shadow: -5px 0 20px rgba(0,0,0,0.5);
}

.menu-open {
  right: 0;
}

.mobile-menu button {
  background: none;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-toggle { display: flex; }
}
</style>
