<script setup lang="ts">
defineProps<{
  genre: string
}>()
</script>

<template>
  <span class="genre-badge">{{ genre }}</span>
</template>

<style scoped>
.genre-badge {
  display: inline-block;
  padding: 4px 12px;
  border: 1px solid var(--accent-four);
  color: var(--accent-four);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background-color: transparent;
}
</style>
