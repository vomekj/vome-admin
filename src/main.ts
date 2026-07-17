import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from '/@/router'
import { vPerm } from '/@/directives/perm'
import { Plugins, setCrudConfig } from '/@/crud'
import { config } from '@/config/index.js'
import logoDark from '@/static/image/深色logo.png'
import { useThemeStore } from '@/stores/theme'
import '@/styles/theme.css'
import '/@/styles/base.css'
import './views-registry'

/** 横图 logo：先裁掉透明边，再宽度铺满方画布（无左右留白，必要时裁上下） */
function setSquareFavicon(src: string, size = 64) {
  const img = new Image()
  img.onload = () => {
    const probe = document.createElement('canvas')
    probe.width = img.width
    probe.height = img.height
    const pctx = probe.getContext('2d')
    if (!pctx) return
    pctx.drawImage(img, 0, 0)
    const { data, width, height } = pctx.getImageData(0, 0, img.width, img.height)

    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }
    if (maxX < minX || maxY < minY) return

    const cw = maxX - minX + 1
    const ch = maxY - minY + 1
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = size / cw
    const drawH = ch * scale
    if (drawH <= size) {
      const drawY = (size - drawH) / 2
      ctx.drawImage(img, minX, minY, cw, ch, 0, drawY, size, drawH)
    } else {
      const srcH = size / scale
      const srcY = minY + (ch - srcH) / 2
      ctx.drawImage(img, minX, srcY, cw, srcH, 0, 0, size, size)
    }

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/png'
    link.href = canvas.toDataURL('image/png')
  }
  img.src = src
}

function syncDocumentTitle(routeTitle?: string) {
  const base = config.app.name
  document.title = routeTitle ? `${routeTitle} - ${base}` : base
}

setSquareFavicon(logoDark)
syncDocumentTitle()

router.afterEach((to) => {
  const page = to.meta.title ? String(to.meta.title) : ''
  syncDocumentTitle(page || undefined)
})

// 全局 Form/Search 插件
setCrudConfig({
  style: {
    form: {
      labelPosition: 'top',
      labelWidth: '100px',
      span: 24,
      plugins: [Plugins.Form.setFocus(), Plugins.Form.setRules()],
    },
    search: {
      plugins: [Plugins.Search.setAuto()],
    },
    table: {
      border: false,
      highlightCurrentRow: true,
      autoHeight: true,
      contextMenu: ['refresh', 'check', 'edit', 'delete', 'order-asc', 'order-desc'],
      column: { align: 'left', opWidth: 180 },
      plugins: [],
    },
  },
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('perm', vPerm)

useThemeStore(pinia).initTheme()

app.mount('#app')

// Socket.IO：已登录则连接
void import('@/lib/socket').then(({ connectWs }) => connectWs())
