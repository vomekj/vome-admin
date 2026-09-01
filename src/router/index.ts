import {
  createAdminRouter,
  resetMenuRoutesFlag as resetCoreMenuRoutes,
} from '@core/admin/router'
import { configureAdminShellHooks } from '@core/admin/lib/shell'
import Home from '@/pages/home/index.vue'
import Layout from '@/pages/layout/index.vue'
import Login from '@/pages/login/index.vue'
import MissingView from '@/pages/missing/index.vue'
import MicroAppView from '@/pages/micro/index.vue'

const { router, menuRouteShell } = createAdminRouter({
  home: Home,
  layout: Layout,
  login: Login,
  missing: MissingView,
  micro: MicroAppView,
})

configureAdminShellHooks({
  resetMenuRoutes: () => resetCoreMenuRoutes(router),
  onLogoutCleanup: () =>
    import('@/lib/socket').then(({ disconnectWs }) => disconnectWs()),
})

export { router, menuRouteShell }

export function resetMenuRoutesFlag() {
  resetCoreMenuRoutes(router)
}
