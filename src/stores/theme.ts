
import { applyTheme, listThemes } from '@/themes'

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
    return
  }

  themeTransitioning = true
  const transition = doc.startViewTransition(apply)
  void transition.finished.finally(() => {
    themeTransitioning = false
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
    },
    setTheme(id: string, options?: { animate?: boolean }) {
      const visualChange = id !== this.themeId
      const animate = options?.animate !== false && visualChange
      runThemeUpdate(() => {
        this.themeId = id
        localStorage.setItem(THEME_KEY, id)
        applyTheme(id)
      }, animate)
    },
  },
})
