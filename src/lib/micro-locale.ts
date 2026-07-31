/** 宿主 → 无界子应用语种同步（与 micro-theme 同模式） */

export const MICRO_LOCALE_EVENT = 'vome-host-locale'
export const HOST_LOCALE_KEY = 'vome_admin_locale'

/** 与 wujie EventBus 内部一致；无订阅时 $emit 会打 warn */
const WUJIE_ALL_EVENT = '_wujie_all_event'

export function hasMicroLocaleListeners(): boolean {
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
			const cbs = eventObj[MICRO_LOCALE_EVENT]
			const all = eventObj[WUJIE_ALL_EVENT]
			if ((cbs?.length ?? 0) > 0 || (all?.length ?? 0) > 0) return true
		}
	} catch {
		/* ignore */
	}
	return false
}

export function readHostLocale(): string {
	try {
		return localStorage.getItem(HOST_LOCALE_KEY)?.trim() || 'zh-CN'
	} catch {
		return 'zh-CN'
	}
}
