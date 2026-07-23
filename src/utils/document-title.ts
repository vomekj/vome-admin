import { watch } from 'vue'
import type { Pinia } from 'pinia'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { config } from '@/config/index.js'
import { useLocaleStore } from '@/stores/locale'
import { useUserStore } from '/@/stores/user'

function findMenuByPath(
  nodes: MenuTreeNode[],
  path: string,
): MenuTreeNode | null {
  for (const n of nodes) {
    if (n.router === path) return n
    if (n.children?.length) {
      const hit = findMenuByPath(n.children, path)
      if (hit) return hit
    }
  }
  return null
}

/** 与侧栏/Tags 一致：优先 menu.${id} 译名 */
function resolvePageTitle(to: RouteLocationNormalizedLoaded): string {
  try {
    const locale = useLocaleStore()
    const user = useUserStore()
    const node = findMenuByPath(user.menus, to.path)
    if (node) return locale.tMenu(node)
  } catch {
    /* pinia 未就绪时回退 meta.title */
  }
  return to.meta.title ? String(to.meta.title) : ''
}

export function syncDocumentTitle(routeTitle?: string) {
  if (typeof document === 'undefined') return
  const base = config.app.name
  document.title = routeTitle ? `${routeTitle} - ${base}` : base
}

export function syncDocumentTitleFromRoute(
  router: Router,
  to: RouteLocationNormalizedLoaded = router.currentRoute.value,
) {
  const page = resolvePageTitle(to)
  syncDocumentTitle(page || undefined)
}

/** 路由切换 + 语言包切换时同步浏览器标签标题 */
export function bindDocumentTitle(router: Router, pinia: Pinia) {
  syncDocumentTitle()
  router.afterEach((to) => {
    syncDocumentTitleFromRoute(router, to)
  })
  const localeStore = useLocaleStore(pinia)
  watch(
    () => [localeStore.locale, localeStore.messages] as const,
    () => syncDocumentTitleFromRoute(router),
  )
}
