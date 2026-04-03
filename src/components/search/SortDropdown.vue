<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { SortOption } from '../../types/movie'

const props = defineProps<{
  modelValue: SortOption
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: SortOption): void
}>()

const isOpen = ref(false)

const options = [
  { val_asc: 'added_asc', val_desc: 'added_desc', label: 'Date Added' },
  { val_asc: 'alpha_asc', val_desc: 'alpha_desc', label: 'Alphabetical' },
  { val_asc: 'rating_asc', val_desc: 'rating_desc', label: 'IMDB Rating' },
  { val_asc: 'release_asc', val_desc: 'release_desc', label: 'Release Date' },
  { val_asc: 'runtime_asc', val_desc: 'runtime_desc', label: 'Runtime' },
  { val_asc: 'shuffle', val_desc: 'shuffle', label: 'Shuffle' }
]

function getLabel() {
  if (props.modelValue === 'shuffle') return 'Shuffle'
  return options.find(o => o.val_asc === props.modelValue || o.val_desc === props.modelValue)?.label
}

function selectOption(opt: any) {
  if (opt.val_asc === 'shuffle') {
    emit('update:modelValue', 'shuffle')
  } else if (props.modelValue === opt.val_desc) {
    emit('update:modelValue', opt.val_asc as SortOption)
  } else {
    emit('update:modelValue', opt.val_desc as SortOption)
  }
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
        @click="selectOption(opt)"
      >
        <span class="item-label">{{ opt.label }}</span>
        <div class="icon-indicator">
          <template v-if="opt.val_asc !== 'shuffle'">
            <ArrowDown v-if="modelValue === opt.val_desc" :size="14" class="active-icon" />
            <ArrowUp v-else-if="modelValue === opt.val_asc" :size="14" class="active-icon" />
          </template>
        </div>
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
  background-color: rgba(255,255,255,0.05);
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

.active-icon {
  color: var(--accent-four);
}

.icon-indicator {
  width: 14px;
  display: flex;
  align-items: center;
}
</style>
