<template>
  <div class="vm-micro">
    <div v-if="!appKey" class="vm-micro__empty">
      <div class="vm-micro__icon is-warn" aria-hidden="true">
        <i class="ri-error-warning-line" />
      </div>
      <h2 class="vm-micro__title">缺少 appKey</h2>
      <p class="vm-micro__desc">该菜单未配置微应用标识，无法加载插件页面。</p>
    </div>

    <div v-else class="vm-micro__shell">
      <WujieVue
        width="100%"
        height="100%"
        :name="appKey"
        :url="entryUrl"
        :alive="true"
        :sync="false"
        :props="microProps"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import WujieVue from 'wujie-vue3'
import { apiUrl } from '/@/api/client'
import { snapshotHostTheme } from '@/lib/micro-theme'
import { useThemeStore } from '@/stores/theme'

defineOptions({ name: 'MicroAppView' })

const route = useRoute()
const themeStore = useThemeStore()

const appKey = computed(() => String(route.meta.appKey || ''))
/** 仅供 wujie 静默加载；用户只通过 Admin 侧栏菜单进入，不暴露独立入口 */
const entryUrl = computed(() =>
  appKey.value ? apiUrl(`/vome/apps/${appKey.value}/`) : '',
)

/** 初始主题快照；切换后由 theme store → wujie bus 广播 */
const microProps = computed(() => {
  void themeStore.themeId
  return { theme: snapshotHostTheme() }
})
</script>

<style lang="scss" scoped>
.vm-micro {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.vm-micro__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  border-radius: var(--radius, 16px);
  background: var(--card);
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.vm-micro__icon {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border-radius: 16px;
  font-size: 24px;

  &.is-warn {
    background: #fff0e8;
    color: #e07a45;
  }
}

.vm-micro__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--foreground);
}

.vm-micro__desc {
  margin: 0;
  max-width: 360px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--muted-foreground);
}

/* 宿主内容容器（--card）；子应用必须透明，勿再盖白底 */
.vm-micro__shell {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  /* iframe 固定 100% 时由子文档滚动；auto 避免再被壳裁切 */
  overflow: auto;
  border-radius: var(--radius, 16px);
  background: var(--card);
  box-shadow: var(--shadow-soft);

  :deep(wj-app),
  :deep(iframe) {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: transparent !important;
    color-scheme: inherit;
  }
}
</style>
