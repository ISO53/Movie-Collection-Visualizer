<template>
  <div class="hero-bg">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" class="cinematic-svg">
      <defs>
        <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ec8200" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#101010" stop-opacity="0" />
        </radialGradient>
        
        <linearGradient id="film-strip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ec8200" stop-opacity="0.4" />
          <stop offset="50%" stop-color="#1f1f1f" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#ec8200" stop-opacity="0.1" />
        </linearGradient>

        <filter id="blur">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <!-- Background Ambient Glow -->
      <rect width="1920" height="1080" fill="url(#bg-glow)" class="bg-pulse" />

      <!-- Abstract Floating Elements (Posters / Reels) -->
      <g class="drifting-group-1">
        <rect x="200" y="800" width="120" height="180" rx="8" fill="none" stroke="#ec8200" stroke-width="2" stroke-opacity="0.6" filter="url(#blur)" />
        <rect x="200" y="800" width="120" height="180" rx="8" fill="url(#film-strip)" />
        
        <rect x="1500" y="100" width="180" height="260" rx="8" fill="none" stroke="#e5ba73" stroke-width="1.5" stroke-opacity="0.4" />
        <rect x="1500" y="100" width="180" height="260" rx="8" fill="#1f1f1f" opacity="0.8" />
        <circle cx="1590" cy="230" r="40" fill="none" stroke="#ec8200" stroke-width="4" stroke-dasharray="20 10" class="spin-slow" />
      </g>

      <g class="drifting-group-2">
        <rect x="800" y="300" width="160" height="240" rx="8" fill="#101010" stroke="#faeab1" stroke-width="1" stroke-opacity="0.3" transform="rotate(-15 800 300)" />
        <rect x="50" y="200" width="90" height="140" rx="4" fill="url(#film-strip)" transform="rotate(25 50 200)" />
        
        <rect x="1100" y="700" width="220" height="320" rx="12" fill="none" stroke="#ec8200" stroke-width="2" stroke-opacity="0.2" filter="url(#blur)" transform="rotate(10 1100 700)" />
        <circle cx="1210" cy="860" r="80" fill="none" stroke="#969696" stroke-width="1" stroke-dasharray="10 20" class="spin-reverse" />
      </g>

      <g class="drifting-group-3">
        <!-- Film strip path -->
        <path d="M-100 540 Q 400 400 960 540 T 2020 540" fill="none" stroke="#ec8200" stroke-width="40" stroke-dasharray="20 40" stroke-opacity="0.1" class="wave-motion" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
  background-color: var(--page-bg);
}

.cinematic-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes pulseGlow {
  0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.7; transform: scale(1); }
}

@keyframes driftUp {
  0% { transform: translateY(100px) scale(0.95); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(-150px) scale(1.05); opacity: 0; }
}

@keyframes driftDown {
  0% { transform: translateY(-100px) scale(1.05); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(150px) scale(0.95); opacity: 0; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes wave {
  0% { transform: translateY(0) scaleX(1); }
  50% { transform: translateY(-30px) scaleX(1.02); }
  100% { transform: translateY(0) scaleX(1); }
}

.bg-pulse {
  transform-origin: center;
  animation: pulseGlow 8s ease-in-out infinite;
}

.drifting-group-1 {
  animation: driftUp 18s linear infinite;
}

.drifting-group-2 {
  animation: driftDown 22s linear infinite;
}

.spin-slow {
  transform-origin: center;
  transform-box: fill-box;
  animation: spin 20s linear infinite;
}

.spin-reverse {
  transform-origin: center;
  transform-box: fill-box;
  animation: spin 25s linear infinite reverse;
}

.wave-motion {
  animation: wave 12s ease-in-out infinite;
}
</style>
