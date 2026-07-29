/** 宿主 → 无界子应用主题同步 */

export const MICRO_THEME_EVENT = 'vome-host-theme'

/** 与 wujie EventBus 内部一致；无订阅时 $emit 会打 warn */
const WUJIE_ALL_EVENT = '_wujie_all_event'

/** 是否有子应用监听主题（无则跳过 emit，避免「事件订阅数量为空」） */
export function hasMicroThemeListeners(): boolean {
	try {
		const map = (
			window as Window & {
				__WUJIE_INJECT?: {
					appEventObjMap?: Map<string, Record<string, unknown[] | undefined>>
				}
			}
		).__WUJIE_INJECT?.appEventObjMap
		if (!map?.size) return false
		for (const eventObj of map.values()) {
			const cbs = eventObj[MICRO_THEME_EVENT]
			const all = eventObj[WUJIE_ALL_EVENT]
			if ((cbs?.length ?? 0) > 0 || (all?.length ?? 0) > 0) return true
		}
	} catch {
		/* ignore */
	}
	return false
}

export const MICRO_THEME_VARS = [
	'--brand',
	'--brand-soft',
	'--brand-deep',
	'--background',
	'--foreground',
	'--card',
	'--card-foreground',
	'--popover',
	'--popover-foreground',
	'--primary',
	'--primary-foreground',
	'--secondary',
	'--secondary-foreground',
	'--muted',
	'--muted-foreground',
	'--accent',
	'--accent-foreground',
	'--destructive',
	'--danger',
	'--danger-soft',
	'--warning',
	'--warning-soft',
	'--success',
	'--success-soft',
	'--border',
	'--input',
	'--ring',
	'--focus-border',
] as const

export type HostThemeSnapshot = {
	dark: boolean
	themeId: string
	tokens: Record<string, string>
}

/** 采集当前 documentElement 上的主题 token（含 inline + .dark） */
export function snapshotHostTheme(): HostThemeSnapshot {
	const root = document.documentElement
	const cs = getComputedStyle(root)
	const tokens: Record<string, string> = {}
	for (const key of MICRO_THEME_VARS) {
		const v = cs.getPropertyValue(key).trim()
		if (v) tokens[key] = v
	}
	return {
		dark: root.classList.contains('dark'),
		themeId: root.dataset.theme || 'light',
		tokens,
	}
}
