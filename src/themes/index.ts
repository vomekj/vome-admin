import { darkTheme } from './dark'
import { lightTheme } from './light'

const registry = new Map<string, ThemeDefinition>([
  [lightTheme.id, lightTheme],
  [darkTheme.id, darkTheme],
])

/** 注册/覆盖主题（业务方可扩展） */
export function registerTheme(theme: ThemeDefinition) {
  registry.set(theme.id, theme)
}

export function getTheme(id: string) {
  return registry.get(id)
}

export function listThemes() {
  return [...registry.values()]
}

export function applyTheme(id: string) {
  const theme = registry.get(id) ?? lightTheme
  const root = document.documentElement
  root.classList.toggle('dark', Boolean(theme.dark))
  root.dataset.theme = theme.id

  if (theme.tokens) {
    for (const [key, value] of Object.entries(theme.tokens)) {
      root.style.setProperty(key, value)
    }
  }
}

export type { ThemeDefinition, ThemeTokens } from '../../typings/theme'
export { lightTheme, darkTheme }
