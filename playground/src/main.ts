import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistPlugin from '../../src/index'
import App from './App.vue'

const pinia = createPinia()
pinia.use(piniaPersistPlugin)

createApp(App).use(pinia).mount('#app')
