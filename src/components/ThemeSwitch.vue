<template>
  <el-switch
    v-model="isDark"
    inline-prompt
    :active-icon="Moon"
    :inactive-icon="Sunny"
    @change="toggleTheme"
  />
</template>

<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

const isDark = computed({
  get: () => settingsStore.theme === 'dark',
  set: (value) => settingsStore.updateSettings({ theme: value ? 'dark' : 'light' }),
})

const toggleTheme = () => {
  const html = document.documentElement
  if (isDark.value) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}
</script>
