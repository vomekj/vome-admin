<template>
  <div class="vm-header">
    <header class="vm-header__bar">
      <div class="vm-header__tools">
        <button
          v-if="browser.isMini"
          type="button"
          class="vm-header__icon-btn"
          title="菜单"
          @click="app.setMobileOpen(true)"
        >
          <i class="ri-menu-line" />
        </button>
        <button
          v-else
          type="button"
          class="vm-header__icon-btn"
          title="折叠侧栏"
          @click="app.toggleSidebarFold()"
        >
          <i :class="app.sidebarFold ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'" />
        </button>
        <button
          type="button"
          class="vm-header__icon-btn"
          title="上一页"
          @click="goBack"
        >
          <i class="ri-arrow-go-back-line" />
        </button>
        <button
          type="button"
          class="vm-header__icon-btn"
          title="刷新页面"
          @click="reloadPage"
        >
          <i class="ri-refresh-line" />
        </button>
        <button
          type="button"
          class="vm-header__icon-btn"
          title="首页"
          @click="goHome"
        >
          <i class="ri-home-4-line" />
        </button>

        <!-- 移动端不显示多页签，避免挤占工具栏 -->
        <vm-tags-view v-if="!browser.isMini" />
      </div>

      <div class="vm-header__right">
        <button
          type="button"
          class="vm-header__icon-btn"
          :title="theme.themeId === 'dark' ? '浅色' : '深色'"
          @click="toggleTheme"
        >
          <i :class="theme.themeId === 'dark' ? 'ri-sun-line' : 'ri-moon-line'" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button type="button" class="vm-header__user">
              <span class="vm-header__avatar">
                {{ (user.username || 'A').slice(0, 1).toUpperCase() }}
              </span>
              <span class="vm-header__name">{{ user.username }}</span>
              <i class="ri-arrow-down-s-line" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44">
            <DropdownMenuLabel class="text-xs font-normal text-muted-foreground">
              {{ user.username }}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              class="text-xs"
              :disabled="loggingOut"
              @click="logout"
            >
              <i class="ri-logout-box-r-line" />
              {{ loggingOut ? '退出中…' : '退出登录' }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { api } from '/@/api/client'
import { resetMenuRoutesFlag } from '/@/router'
import { useThemeStore } from '@/stores/theme'

defineOptions({ name: 'vm-app-header' })

const app = useAppStore()
const theme = useThemeStore()
const user = useUserStore()
const tags = useTagsStore()
const router = useRouter()
const { browser } = useBrowser()

const loggingOut = ref(false)

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await api.logout()
  } finally {
    void import('@/lib/socket').then(({ disconnectWs }) => disconnectWs())
    user.logout()
    tags.clear()
    resetMenuRoutesFlag()
    // 硬跳转：卸掉 Layout 与动态路由残留，避免 URL 已是 /login 仍停在壳层
    location.href = '/login'
  }
}

function toggleTheme() {
  theme.setTheme(theme.themeId === 'dark' ? 'light' : 'dark')
}

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push('/')
}

function reloadPage() {
  void app.reloadView()
}

function goHome() {
  void router.push('/')
}
</script>

<style lang="scss" scoped>
.vm-header {
  flex-shrink: 0;
  /* 顶栏只要上边距，贴紧下方内容区（不要下边距） */
  margin: 12px 0 0;
  background: color-mix(in srgb, var(--background) 88%, transparent);
  backdrop-filter: blur(10px);
}

.vm-header__bar {
  display: flex;
  /* 与按钮/Tab 同高，避免顶栏底部多出一截被当成「上边距」 */
  height: 32px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  /* 左右与内容区 --vm-gutter 对齐 */
  padding: 0 12px;
}

.vm-header__tools {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 4px;
}

.vm-header__right {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

.vm-header__icon-btn {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: var(--muted);
  color: var(--foreground);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: color-mix(in srgb, var(--muted) 70%, var(--foreground) 8%);
    color: var(--foreground);
  }

  &:active {
    background: color-mix(in srgb, var(--muted) 45%, var(--foreground) 18%);
  }
}

.vm-header__user {
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 8px;
  padding: 0 8px 0 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--muted);
  }

  > i {
    font-size: 14px;
    opacity: 0.45;
  }
}

.vm-header__avatar {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
}

.vm-header__name {
  display: none;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;

  @media (min-width: 640px) {
    display: inline;
  }
}
</style>
