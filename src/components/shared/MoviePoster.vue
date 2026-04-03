<script setup lang="ts">
import { computed } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import { Film } from 'lucide-vue-next'

const props = defineProps<{
  posterPath?: string | null
  posterUrl?: string | null
  alt: string
  class?: string
}>()

const src = computed(() => {
  if (props.posterPath) return convertFileSrc(props.posterPath)
  if (props.posterUrl && props.posterUrl !== 'N/A') return props.posterUrl
  return null
})
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" :class="props.class" />
  <div v-else :class="props.class" class="poster-placeholder">
    <Film :size="48" class="placeholder-icon" />
  </div>
</template>

<style scoped>
.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-light);
  color: var(--muted-dark);
}
</style>
