<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="feature-icon">
    <!-- Import Folder SVG -->
    <svg v-if="name === 'import'" viewBox="0 0 80 80" class="animated-svg">
      <defs>
        <linearGradient id="folder-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ec8200" />
          <stop offset="100%" stop-color="#1f1f1f" />
        </linearGradient>
      </defs>
      <path d="M10,20 L30,20 L40,30 L70,30 L70,60 L10,60 Z" fill="none" stroke="url(#folder-grad)" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40,50 L40,35 M30,45 L40,35 L50,45" fill="none" stroke="#e5ba73" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="arrow-up" />
    </svg>

    <!-- OMDB Metadata SVG -->
    <svg v-else-if="name === 'metadata'" viewBox="0 0 80 80" class="animated-svg">
      <circle cx="40" cy="40" r="30" fill="none" stroke="#1f1f1f" stroke-width="4"/>
      <circle cx="40" cy="40" r="30" fill="none" stroke="#ec8200" stroke-width="4" stroke-dasharray="40 188" class="spin-circle" />
      <rect x="25" y="30" width="30" height="4" fill="#e5ba73" rx="2" class="fade-line-1" />
      <rect x="25" y="40" width="20" height="4" fill="#e5ba73" rx="2" class="fade-line-2" />
      <rect x="25" y="50" width="25" height="4" fill="#e5ba73" rx="2" class="fade-line-3" />
    </svg>

    <!-- Poster Caching SVG -->
    <svg v-else-if="name === 'poster'" viewBox="0 0 80 80" class="animated-svg">
      <rect x="20" y="10" width="40" height="60" rx="4" fill="none" stroke="#1f1f1f" stroke-width="4" />
      <rect x="25" y="15" width="30" height="40" rx="2" fill="#ec8200" fill-opacity="0.2" class="pulse-rect" />
      <path d="M25,55 L35,45 L45,55 L55,40 L55,55 Z" fill="#ec8200" class="pulse-rect" />
      <circle cx="50" cy="65" r="8" fill="#101010" stroke="#e5ba73" stroke-width="2" class="spin-gear" />
      <circle cx="50" cy="65" r="3" fill="#e5ba73" class="spin-gear" />
    </svg>

    <!-- Search & Filter SVG -->
    <svg v-else-if="name === 'search'" viewBox="0 0 80 80" class="animated-svg">
      <circle cx="35" cy="35" r="15" fill="none" stroke="#ec8200" stroke-width="4" class="search-lens" />
      <path d="M46,46 L65,65" fill="none" stroke="#ec8200" stroke-width="5" stroke-linecap="round" class="search-handle" />
      <line x1="15" y1="55" x2="25" y2="55" stroke="#e5ba73" stroke-width="3" stroke-linecap="round" class="filter-line-1" />
      <line x1="10" y1="65" x2="30" y2="65" stroke="#e5ba73" stroke-width="3" stroke-linecap="round" class="filter-line-2" />
    </svg>

    <!-- Sort & Shuffle SVG -->
    <svg v-else-if="name === 'sort'" viewBox="0 0 80 80" class="animated-svg">
      <path d="M20,20 Q40,20 40,40 T60,60" fill="none" stroke="#ec8200" stroke-width="4" stroke-linecap="round" class="shuffle-path-1" />
      <path d="M55,55 L60,60 L55,65 M60,60 L60,60" fill="none" stroke="#ec8200" stroke-width="4" stroke-linecap="round" class="shuffle-arrow-1" />
      
      <path d="M20,60 Q40,60 40,40 T60,20" fill="none" stroke="#e5ba73" stroke-width="4" stroke-linecap="round" class="shuffle-path-2" />
      <path d="M55,15 L60,20 L55,25" fill="none" stroke="#e5ba73" stroke-width="4" stroke-linecap="round" class="shuffle-arrow-2" />
    </svg>

    <!-- Statistics SVG -->
    <svg v-else-if="name === 'stats'" viewBox="0 0 80 80" class="animated-svg">
      <line x1="10" y1="70" x2="70" y2="70" stroke="#1f1f1f" stroke-width="4" stroke-linecap="round" />
      <rect x="20" y="40" width="10" height="28" fill="#1f1f1f" rx="2" class="bar-1" />
      <rect x="40" y="20" width="10" height="48" fill="#ec8200" rx="2" class="bar-2" />
      <rect x="60" y="50" width="10" height="18" fill="#e5ba73" rx="2" class="bar-3" />
    </svg>
  </div>
</template>

<style scoped>
.feature-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 1.5rem;
}

.animated-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Import Animation */
@keyframes arrowUp {
  0% { transform: translateY(5px); opacity: 0; }
  50% { transform: translateY(-5px); opacity: 1; }
  100% { transform: translateY(-10px); opacity: 0; }
}
.arrow-up { animation: arrowUp 2s ease-in-out infinite; }

/* Metadata Animation */
@keyframes spinCircle {
  0% { transform: rotate(0deg); stroke-dasharray: 40 188; }
  50% { stroke-dasharray: 100 188; }
  100% { transform: rotate(360deg); stroke-dasharray: 40 188; }
}
.spin-circle { transform-origin: 40px 40px; animation: spinCircle 3s linear infinite; }

@keyframes fadeLine {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}
.fade-line-1 { animation: fadeLine 2s ease-in-out infinite; }
.fade-line-2 { animation: fadeLine 2s ease-in-out infinite 0.4s; }
.fade-line-3 { animation: fadeLine 2s ease-in-out infinite 0.8s; }

/* Poster Animation */
@keyframes pulseRect {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
.pulse-rect { animation: pulseRect 4s ease-in-out infinite; }

@keyframes spinGear {
  100% { transform: rotate(360deg); }
}
.spin-gear { transform-origin: 50px 65px; animation: spinGear 5s linear infinite; }

/* Search Animation */
@keyframes searchMove {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-5px, -5px); }
  50% { transform: translate(5px, -10px); }
  75% { transform: translate(10px, 5px); }
}
.search-lens, .search-handle { animation: searchMove 6s ease-in-out infinite; }

/* Sort & Shuffle Animation */
@keyframes dashFlow {
  0% { stroke-dashoffset: 100; stroke-dasharray: 10 20; }
  100% { stroke-dashoffset: 0; stroke-dasharray: 10 20; }
}
.shuffle-path-1, .shuffle-path-2 { 
  stroke-dasharray: 100;
  animation: dashFlow 4s linear infinite;
}

/* Stats Animation */
@keyframes barGrow1 { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.4); } }
@keyframes barGrow2 { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.8); } }
@keyframes barGrow3 { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.8); } }
.bar-1 { transform-origin: bottom; animation: barGrow1 3s ease-in-out infinite; }
.bar-2 { transform-origin: bottom; animation: barGrow2 4s ease-in-out infinite; }
.bar-3 { transform-origin: bottom; animation: barGrow3 3.5s ease-in-out infinite; }
</style>
