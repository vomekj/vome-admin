import {
  ADMIN_THEME_COLOR_DEFS,
  resolveCssThemeColorOptions,
  type ThemeColorDef,
} from '@core/admin/lib/theme-color-options'

/** 与 admin/src/styles/theme.css 对齐；可按项目增删 token */
export const THEME_COLOR_DEFS: ThemeColorDef[] = [...ADMIN_THEME_COLOR_DEFS]

export function listThemeColorOptions() {
  return resolveCssThemeColorOptions(THEME_COLOR_DEFS)
}
