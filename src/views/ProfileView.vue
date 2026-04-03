<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StatsDashboard from '../components/profile/StatsDashboard.vue'
import SettingsPanel from '../components/profile/SettingsPanel.vue'

const props = defineProps<{
  tab?: string
}>()

const router = useRouter()
const activeTab = ref(props.tab || 'stats')

watch(() => props.tab, (newVal) => {
  if (newVal) activeTab.value = newVal
})

function setTab(tab: string) {
  activeTab.value = tab
  router.push({ query: { tab } })
}
</script>

<template>
  <div class="profile-container">
    <div class="tabs-header">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'stats' }" 
        @click="setTab('stats')"
      >
        Statistics
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'settings' }" 
        @click="setTab('settings')"
      >
        Settings
      </button>
    </div>
    
    <div class="tab-content">
      <StatsDashboard v-if="activeTab === 'stats'" />
      <SettingsPanel v-if="activeTab === 'settings'" />
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-header {
  display: flex;
  gap: 32px;
  padding: 32px 40px 0 40px;
  border-bottom: 1px solid var(--muted-dark);
}

.tab-btn {
  background: transparent;
  color: var(--muted-mid);
  font-size: 16px;
  font-weight: 600;
  padding: 12px 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  transition: all 200ms;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  color: var(--accent-four);
  border-bottom-color: var(--accent-four);
}

.tab-content {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
}
</style>
