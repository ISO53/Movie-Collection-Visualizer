<script setup>
import logo from '../assets/logo.svg'
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-logo">
          <img :src="logo" alt="Movie Collection Visualizer Logo" class="logo-img" />
          <p class="footer-desc">Your ultimate local movie vault.</p>
        </div>
        
        <div class="footer-links">
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="https://github.com/ISO53/Movie-Collection-Visualizer" target="_blank">GitHub</a>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} Movie Collection Visualizer. Licensed under GPL-3.0.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: #080808;
  padding: 4rem 0 2rem 0;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 3rem;
}

.logo-img {
  height: 35px;
  width: auto;
  display: block;
}

.footer-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-links a {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: var(--primary-accent);
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.05);
  color: #666;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
