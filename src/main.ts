import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from '/@/router'
import { vPerm } from '/@/directives/perm'
import logoDark from '@/static/image/logo-dark.png'
import { useThemeStore } from '@/stores/theme'
import { setSquareFavicon } from '@/utils/favicon'
import { bindDocumentTitle } from '@/utils/document-title'
import { setupCrudDefaults } from '@/utils/setup-crud'
import '@/styles/theme.css'
import '/@/styles/base.css'
import './views-registry'

setSquareFavicon(logoDark)
setupCrudDefaults()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('perm', vPerm)

useThemeStore(pinia).initTheme()

app.mount('#app')
bindDocumentTitle(router, pinia)

// Socket.IO：已登录则连接
void import('@/lib/socket').then(({ connectWs }) => connectWs())
