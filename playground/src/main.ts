import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { persistPlugin } from '../../src/index'
import App from './App.vue'

const pinia = createPinia()
pinia.use(persistPlugin)

createApp(App).use(pinia).mount('#app')
