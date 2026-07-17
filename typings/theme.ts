export type ThemeTokens = Record<string, string>

export type ThemeDefinition = {
  id: string
  label: string
  /** 是否挂 dark class */
  dark?: boolean
  /** 可选：覆盖 CSS 变量 */
  tokens?: ThemeTokens
}
