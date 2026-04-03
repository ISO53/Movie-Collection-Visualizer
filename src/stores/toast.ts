import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  type: 'success' | 'warning' | 'info'
  message: string
  duration: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function show(type: 'success' | 'warning' | 'info', message: string) {
    const id = nextId++
    const duration = 5000 + (message.length / 4.7) * 300
    toasts.value.push({ id, type, message, duration })

    if (toasts.value.length > 5) {
      toasts.value.shift()
    }

    setTimeout(() => {
      dismiss(id)
    }, duration)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, show, dismiss }
})
