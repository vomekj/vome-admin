<template>
  <aside v-if="!browser.isMini" class="vm-sidebar" :class="{ 'is-collapsed': collapsed }">
    <div class="vm-sidebar__brand">
      <img :src="logoSrc" alt="" class="vm-sidebar__logo" />
      <span v-if="!collapsed" class="vm-sidebar__title">{{ appName }}</span>
    </div>
    <vm-sidebar-nav :menus="user.navMenus" :collapsed="collapsed" />
  </aside>

  <!-- 移动端抽屉：Sheet 传送到 body，样式用下方非 scoped 全局类 -->
  <Sheet :open="app.mobileOpen" @update:open="app.setMobileOpen">
    <SheetContent side="left" class="vm-sidebar-sheet">
      <SheetHeader class="vm-sidebar-sheet__head">
        <img :src="logoSrc" alt="" class="vm-sidebar-sheet__logo" />
        <SheetTitle class="vm-sidebar-sheet__title">{{ appName }}</SheetTitle>
      </SheetHeader>
      <div class="vm-sidebar-sheet__nav">
        <vm-sidebar-nav :menus="user.navMenus" mobile />
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { config } from '@/config/index.js'
import logoLight from '@/static/image/logo-light.png'

defineOptions({ name: 'vm-app-sidebar' })

const app = useAppStore()
const user = useUserStore()
const route = useRoute()
const { browser } = useBrowser()

const collapsed = computed(() => !browser.isMini && app.sidebarFold)
/** 彩底侧栏始终用浅色 logo */
const logoSrc = logoLight
const appName = computed(() => config.app.name)

// 回到桌面断点时关掉抽屉；勿在 isMini 下监听 screen 变化强关（开抽屉去滚动条会触发断点抖动）
watch(
  () => browser.isMini,
  (mini) => {
    if (!mini) app.setMobileOpen(false)
  },
)

watch(
  () => route.path,
  () => {
    if (browser.isMini) app.setMobileOpen(false)
  },
)
</script>

<style lang="scss" scoped>
.vm-sidebar {
  position: relative;
  z-index: 20;
  display: flex;
  width: 268px;
  height: 100%;
  flex-shrink: 0;
  flex-direction: column;
  overflow: visible;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  transition: width 0.2s ease;

  &.is-collapsed {
    width: 80px;
    overflow: visible;

    .vm-sidebar__logo {
      height: 28px;
    }
  }
}

.vm-sidebar__brand {
  display: flex;
  height: 84px;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 0 14px;

  .is-collapsed & {
    justify-content: center;
    padding: 0;
  }
}

.vm-sidebar__logo {
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.vm-sidebar__title {
  display: flex;
  height: 60px;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 与 60px logo 视觉同高（大写字面接近 logo） */
  font-size: 28px !important;
  font-weight: 1000 !important;
  line-height: 1 !important;
  letter-spacing: -0.04em;
  color: #fff !important;
}
</style>

<!-- Sheet 经 Portal 挂到 body，scoped 无法稳定命中，必须用全局类 -->
<style lang="scss">
.vm-sidebar-sheet {
  width: min(280px, 85vw) !important;
  max-width: 85vw !important;
  height: 100% !important;
  padding: 0 !important;
  gap: 0 !important;
  border: none !important;
  background: var(--sidebar) !important;
  color: #fff !important;
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.18) !important;

  /* 关闭按钮：蓝底上用白 */
  > button {
    color: rgba(255, 255, 255, 0.92) !important;
    opacity: 1;

    &:hover {
      opacity: 0.85;
      background: rgba(255, 255, 255, 0.12);
    }
  }
}

.vm-sidebar-sheet__head {
  display: flex !important;
  height: 64px;
  flex-shrink: 0;
  flex-direction: row !important;
  align-items: center;
  gap: 10px;
  padding: 0 44px 0 16px;
  margin: 0 !important;
  text-align: left !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.vm-sidebar-sheet__logo {
  height: 28px;
  flex-shrink: 0;
  object-fit: contain;
}

.vm-sidebar-sheet__title {
  display: flex !important;
  height: auto !important;
  align-items: center;
  overflow: hidden;
  font-size: 22px !important;
  font-weight: 1000 !important;
  line-height: 1 !important;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #fff !important;
}

.vm-sidebar-sheet__nav {
  flex: 1;
  min-height: 0;
  overflow: auto;
  /* 深色侧栏滚动条用 token 覆盖全局色 */
  --scrollbar-thumb: rgba(255, 255, 255, 0.35);
  --scrollbar-thumb-hover: rgba(255, 255, 255, 0.55);

  .vm-nav {
    height: 100%;
  }
}
</style>
