import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/Movie-Collection-Visualizer/',
  plugins: [vue()],
})
