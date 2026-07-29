
import { bus } from 'wujie'
import { applyTheme, listThemes } from '@/themes'
import {
  hasMicroThemeListeners,
  MICRO_THEME_EVENT,
  snapshotHostTheme,
} from '@/lib/micro-theme'

const THEME_KEY = 'vome_admin_theme'

/** 弧形扫瞄过渡中，避免连点叠两次 View Transition */
let themeTransitioning = false

type ViewTransitionDoc = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>
  }
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function broadcastHostTheme() {
  try {
    // 启动时尚无微应用 $on，直接 emit 会触发 wujie warn
    if (!hasMicroThemeListeners()) return
    bus.$emit(MICRO_THEME_EVENT, snapshotHostTheme())
  } catch {
    /* ignore */
  }
}

/** 亮暗视觉变化时走 View Transition；启动 / 降级则即时应用。不改主题变量。 */
function runThemeUpdate(apply: () => void, animate: boolean) {
  const doc =
    typeof document !== 'undefined'
      ? (document as ViewTransitionDoc)
      : null
  if (
    !animate ||
    !doc?.startViewTransition ||
    prefersReducedMotion() ||
    themeTransitioning
  ) {
    apply()
    // 无动画也广播，保证无界子应用跟进
    queueMicrotask(() => broadcastHostTheme())
    return
  }

  themeTransitioning = true
  const transition = doc.startViewTransition(apply)
  // VT 进行中 iframe 往往不参与弧形动画；结束后再广播，子应用才能跟齐
  void transition.finished.finally(() => {
    themeTransitioning = false
    broadcastHostTheme()
    // 再补一帧，确保 computed style 已结算
    requestAnimationFrame(() => broadcastHostTheme())
  })
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    themeId: localStorage.getItem(THEME_KEY) || 'light',
  }),
  getters: {
    themes: () => listThemes(),
  },
  actions: {
    initTheme() {
      applyTheme(this.themeId)
      broadcastHostTheme()
    },
    setTheme(id: string, options?: { animate?: boolean }) {
      const visualChange = id !== this.themeId
      const animate = options?.animate !== false && visualChange
      runThemeUpdate(() => {
        this.themeId = id
        localStorage.setItem(THEME_KEY, id)
        applyTheme(id)
        // 过渡回调里先发一次；finished 后再发（见 runThemeUpdate）
        broadcastHostTheme()
      }, animate)
    },
  },
})
