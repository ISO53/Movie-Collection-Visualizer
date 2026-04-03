<script setup lang="ts">
import { ref } from 'vue'
import { X, Key } from 'lucide-vue-next'
import { useDialogStore } from '../../stores/dialog'
import { useSettingsStore } from '../../stores/settings'
import { useToastStore } from '../../stores/toast'

const dialogStore = useDialogStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const inputKey = ref('')

async function saveKey() {
  if (inputKey.value.trim() === '') return
  await settingsStore.saveApiKey(inputKey.value)
  toastStore.show('success', 'API key saved')
  dialogStore.closeApiKeyDialog()
}
</script>

<template>
  <div v-if="dialogStore.isApiKeyOpen" class="dialog-overlay" @click="dialogStore.closeApiKeyDialog">
    <div class="dialog-content" @click.stop>
      <button class="close-btn" @click="dialogStore.closeApiKeyDialog"><X :size="20" /></button>
      
      <div class="header">
        <Key class="icon" :size="32" />
        <h2>OMDB API Key Required</h2>
      </div>
      
      <p class="desc">
        To fetch movie metadata and posters, you need a free API key from OMDB.
        <br/><br/>
        Get yours at <a href="#" @click.prevent>omdbapi.com</a>
      </p>
      
      <div class="input-row">
        <input 
          type="password" 
          v-model="inputKey" 
          placeholder="Enter API key" 
          @keyup.enter="saveKey"
        />
        <button class="primary-btn" @click="saveKey" :disabled="!inputKey.trim()">Save</button>
      </div>
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
.close-btn:hover { color: white; }

.header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.header .icon { color: var(--accent-four); }
h2 { font-size: 20px; font-weight: 600; }
.desc { color: var(--muted-mid); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
a { color: var(--accent-four); text-decoration: none; }
a:hover { text-decoration: underline; }

.input-row { display: flex; gap: 12px; }
input {
  flex: 1; height: 40px; background: var(--bg-dark); border: 1px solid var(--muted-dark);
  border-radius: 4px; padding: 0 12px; color: white; font-size: 14px;
}
input:focus { border-color: var(--accent-four); }

.primary-btn {
  background-color: var(--accent-four); color: #101010; font-weight: 600;
  padding: 0 24px; height: 40px; border-radius: 4px; border: none;
}
.primary-btn:hover:not(:disabled) { opacity: 0.9; }
</style>
