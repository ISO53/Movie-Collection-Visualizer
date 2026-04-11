<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { SortOption } from '../../types/movie'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const isOpen = ref(false)

const options = [
  { val: 'added', label: 'Date Added' },
  { val: 'alpha', label: 'Alphabetical' },
  { val: 'rating', label: 'IMDB Rating' },
  { val: 'release', label: 'Release Date' },
  { val: 'runtime', label: 'Runtime' },
  { val: 'shuffle', label: 'Shuffle' }
]

function getLabel() {
  return options.find(o => o.val === props.modelValue)?.label || 'Sort By'
}

function selectOption(val: string) {
  emit('update:modelValue', val)
  isOpen.value = false
}
</script>

<template>
  <div class="dropdown-wrapper">
    <button class="dropdown-btn" @click="isOpen = !isOpen">
      <ArrowUpDown :size="16" />
      <span>{{ getLabel() }}</span>
    </button>

    <div v-if="isOpen" class="overlay" @click="isOpen = false"></div>
    
    <div v-if="isOpen" class="dropdown-menu">
      <button 
        v-for="opt in options" 
        :key="opt.label"
        class="dropdown-item"
        :class="{ active: modelValue === opt.val }"
        @click="selectOption(opt.val)"
      >
        <span class="item-label">{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dropdown-wrapper {
  position: relative;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-light);
  border: 1px solid var(--muted-dark);
  color: var(--text-main);
  padding: 0 16px;
  height: 48px;
  border-radius: 8px;
  font-size: 14px;
}

.dropdown-btn:hover {
  background-color: rgba(255,255,255,0.08);
  border-color: var(--muted-mid);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: var(--bg-light);
  border: 1px solid var(--muted-dark);
  border-radius: 8px;
  padding: 8px;
  min-width: 200px;
  z-index: 101;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  color: var(--text-main);
  text-align: left;
  border-radius: 4px;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: rgba(255,255,255,0.1);
}

.dropdown-item.active {
  color: var(--accent-four);
  background-color: rgba(236, 130, 0, 0.05);
}

.active-icon {
  color: var(--accent-four);
}

.icon-indicator {
  width: 14px;
  display: flex;
  align-items: center;
}
</style>
