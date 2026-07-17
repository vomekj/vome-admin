
import { applyTheme, listThemes } from '@/themes'

const THEME_KEY = 'vome_admin_theme'

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
    setTheme(id: string) {
      this.themeId = id
      localStorage.setItem(THEME_KEY, id)
      applyTheme(id)
    },
  },
})
