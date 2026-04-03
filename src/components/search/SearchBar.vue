<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'

const props = defineProps<{
  value: string
}>()

const emit = defineEmits<{
  (e: 'update', val: string): void
}>()

const localValue = ref(props.value)
let timeout: any = null

watch(() => props.value, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal
  }
})

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  localValue.value = val
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('update', val)
  }, 200)
}

function clear() {
  localValue.value = ''
  emit('update', '')
}
</script>

<template>
  <div class="search-wrapper">
    <Search class="search-icon" :size="20" />
    <input 
      type="text" 
      class="search-input" 
      placeholder="Search by title, year, director, actors..." 
      :value="localValue"
      @input="onInput"
    />
    <button v-if="localValue.length > 0" class="clear-btn" @click="clear">
      <X :size="16" />
    </button>
  </div>
</template>

<style scoped>
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--bg-light);
  border-radius: 8px;
  height: 48px;
  border: 1px solid var(--muted-dark);
  transition: border-color 200ms;
}

.search-wrapper:focus-within {
  border-color: var(--accent-four);
}

.search-icon {
  position: absolute;
  left: 16px;
  color: var(--muted-mid);
}

.search-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  padding: 0 48px;
  color: var(--text-main);
  font-size: 16px;
}

.search-input::placeholder {
  color: var(--muted-mid);
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  color: var(--muted-mid);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.clear-btn:hover {
  color: var(--text-main);
  background-color: rgba(255,255,255,0.1);
}
</style>
