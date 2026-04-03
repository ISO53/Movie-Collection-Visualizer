<script setup lang="ts">
defineProps<{
  genres: string[]
  selected: string[]
}>()

const emit = defineEmits<{
  (e: 'toggle', genre: string): void
}>()
</script>

<template>
  <div class="filter-bar">
    <button 
      v-for="genre in genres" 
      :key="genre"
      class="genre-chip"
      :class="{ active: selected.includes(genre) }"
      @click="emit('toggle', genre)"
    >
      {{ genre }}
    </button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.filter-bar::-webkit-scrollbar {
  display: none;
}

.genre-chip {
  padding: 6px 16px;
  background-color: var(--bg-light);
  border: 1px solid var(--muted-dark);
  border-radius: 9999px;
  color: var(--muted-mid);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 200ms;
}

.genre-chip:hover {
  border-color: var(--muted-mid);
  color: var(--text-main);
}

.genre-chip.active {
  background-color: rgba(236, 130, 0, 0.1);
  border-color: var(--accent-four);
  color: var(--accent-four);
}
</style>
