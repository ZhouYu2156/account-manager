import './assets/main.css'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { useAccountStore } from './stores/account'
import { useSettingsStore } from './stores/settings'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

// 初始化 store
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

settingsStore.initialize()
accountStore.initialize()

// 设置初始主题
const html = document.documentElement
if (settingsStore.theme === 'dark') {
  html.classList.add('dark')
} else {
  html.classList.remove('dark')
}
