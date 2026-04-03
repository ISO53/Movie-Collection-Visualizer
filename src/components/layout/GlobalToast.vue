<script setup lang="ts">
import { useToastStore } from '../../stores/toast'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'

const toastStore = useToastStore()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
        @click="toastStore.dismiss(toast.id)"
      >
        <div class="toast-icon">
          <CheckCircle2 v-if="toast.type === 'success'" :size="20" class="icon-success" />
          <AlertCircle v-else-if="toast.type === 'warning'" :size="20" class="icon-warning" />
          <Info v-else :size="20" class="icon-info" />
        </div>
        <div class="toast-content">{{ toast.message }}</div>
        <button class="close-btn" @click.stop="toastStore.dismiss(toast.id)">
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
  background-color: var(--bg-light);
  border-left: 4px solid var(--muted-dark);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 300ms ease;
}

.toast-success { border-left-color: #22c55e; }
.toast-warning { border-left-color: #ef4444; }
.toast-info { border-left-color: #3b82f6; }

.icon-success { color: #22c55e; }
.icon-warning { color: #ef4444; }
.icon-info { color: #3b82f6; }

.toast-content {
  flex: 1;
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.4;
  word-break: break-word;
}

.close-btn {
  background: transparent;
  color: var(--muted-mid);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-main);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
</style>
