<script setup lang="ts">
import { ref } from 'vue'
import { Rocket } from 'lucide-vue-next'
import { useDialogStore } from '../../stores/dialog'
import { useSettingsStore } from '../../stores/settings'

const dialogStore = useDialogStore()
const settingsStore = useSettingsStore()

const step = ref(1)
const inputKey = ref('')

async function saveAndNext() {
  if (inputKey.value.trim() !== '') {
    await settingsStore.saveApiKey(inputKey.value)
  }
  step.value = 2
}

async function finish() {
  await settingsStore.markFirstTimeCompleted()
  dialogStore.closeFirstTimeDialog()
}
</script>

<template>
  <div v-if="dialogStore.isFirstTimeOpen" class="dialog-overlay">
    <div class="dialog-content">
      <div v-if="step === 1" class="step">
        <Rocket class="icon mb-4" :size="48" />
        <h2>Welcome to Movie Visualizer</h2>
        <p class="desc">Let's set up your personal collection. To automatically fetch posters, ratings, and plot summaries, you need an OMDB API key.</p>
        
        <input 
          type="text" 
          v-model="inputKey" 
          placeholder="Paste API Key here (optional)" 
          @keyup.enter="saveAndNext"
        />
        <a class="help-link" href="#" @click.prevent>Don't have one? Get it for free at omdbapi.com</a>
        
        <div class="actions">
          <button class="primary-btn" @click="saveAndNext">Continue</button>
        </div>
      </div>
      
      <div v-if="step === 2" class="step">
        <Rocket class="icon mb-4" :size="48" />
        <h2>You're All Set!</h2>
        <p class="desc">You can import your movies now by clicking the Import button on the sidebar. Go to Settings later to set up automatic folder watching.</p>
        
        <div class="actions mt-12">
          <button class="primary-btn" @click="finish">Get Started</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000;
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px);
}
.dialog-content {
  background: var(--bg-light); width: 100%; max-width: 460px;
  border-radius: 12px; padding: 48px 40px; text-align: center; border: 1px solid var(--muted-dark);
}

.icon { color: var(--accent-four); margin: 0 auto; display: block; }
.mb-4 { margin-bottom: 24px; }
.mt-12 { margin-top: 48px; }

h2 { font-size: 28px; font-weight: 700; margin-bottom: 16px; }
.desc { color: var(--muted-mid); font-size: 15px; margin-bottom: 32px; line-height: 1.6; }

input {
  width: 100%; height: 48px; background: var(--bg-dark); border: 1px solid var(--muted-dark);
  border-radius: 6px; padding: 0 16px; color: white; font-size: 16px; text-align: center;
  margin-bottom: 12px;
}
input:focus { border-color: var(--accent-four); }

.help-link { display: block; filter: brightness(0.7); font-size: 13px; color: var(--muted-mid); margin-bottom: 32px; }
.help-link:hover { filter: brightness(1); text-decoration: underline; }

.actions { display: flex; justify-content: center; }
.primary-btn { 
  background-color: var(--accent-four); color: #101010; font-weight: 600; font-size: 16px;
  padding: 0 32px; height: 48px; border-radius: 6px; width: 100%; border: none; cursor: pointer;
}
.primary-btn:hover { opacity: 0.9; }
</style>
