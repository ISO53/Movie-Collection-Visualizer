<template>
  <section id="download" class="download-section">
    <div class="container">
      <div class="cta-card fade-in">
        <h2 class="cta-title">Ready to build your visual gallery?</h2>
        <p class="cta-subtitle">Download the latest release for Windows. Free and open-source.</p>
        
        <div class="cta-actions">
          <a href="https://github.com/ISO53/Movie-Collection-Visualizer/releases/latest/download/MovieCollectionVisualizer.exe" class="btn-download">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download .exe
          </a>
          <a href="https://github.com/ISO53/Movie-Collection-Visualizer" target="_blank" class="btn-github">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            GitHub Repository
          </a>
        </div>
        
        <p class="license-note">Released under the <a href="https://github.com/ISO53/Movie-Collection-Visualizer/blob/main/LICENSE" target="_blank">GPL-3.0 License</a>.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.download-section {
  padding: 8rem 0;
  background: radial-gradient(circle at center, #1a1a1a 0%, var(--page-bg) 100%);
}

.cta-card {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  background-color: rgba(31, 31, 31, 0.6);
  padding: 4rem 2rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.4);
}

.cta-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 2.5rem;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn-download, .btn-github {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-download {
  background-color: var(--primary-accent);
  color: var(--page-bg);
  box-shadow: 0 6px 20px rgba(236,130,0,0.3);
}

.btn-download:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(236,130,0,0.5);
}

.btn-github {
  background-color: transparent;
  color: var(--text-primary);
  border: 2px solid rgba(255,255,255,0.2);
}

.btn-github:hover {
  border-color: var(--text-primary);
  background-color: rgba(255,255,255,0.05);
}

.license-note {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.license-note a {
  color: var(--primary-accent);
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
