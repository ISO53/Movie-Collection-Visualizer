<script setup lang="ts">
import { Star } from 'lucide-vue-next'

defineProps<{
  rating?: string | null
}>()
</script>

<template>
  <div v-if="rating && rating !== 'N/A'" class="rating-badge">
    <Star :size="12" class="star" fill="currentColor" />
    <span>{{ rating }}</span>
  </div>
</template>

<style scoped>
.rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: var(--accent-four);
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
}
.star {
  color: var(--accent-four);
}
</style>
