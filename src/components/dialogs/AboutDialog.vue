<script setup lang="ts">
import { useDialogStore } from '../../stores/dialog'
import { X } from 'lucide-vue-next'
const dialogStore = useDialogStore()
</script>
<template>
  <div v-if="dialogStore.isAboutOpen" class="dialog-overlay" @click="dialogStore.closeAboutDialog">
    <div class="dialog-content" @click.stop>
      <button class="close-btn" @click="dialogStore.closeAboutDialog"><X :size="20" /></button>
      <h2>About Movie Collection Visualizer</h2>
      <p>A fast, modern desktop application for managing your personal movie collection.</p>
    </div>
  </div>
</template>
<style scoped>
.dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100;
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
}
.dialog-content {
  background: var(--bg-light); width: 100%; max-width: 440px;
  border-radius: 12px; padding: 32px; position: relative; border: 1px solid var(--muted-dark);
}
.close-btn {
  position: absolute; top: 16px; right: 16px; background: transparent; color: var(--muted-mid);
}
</style>
