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
      <header class="vm-micro__bar">
        <div class="vm-micro__bar-left">
          <span class="vm-micro__badge">Micro App</span>
          <strong class="vm-micro__name">{{ title }}</strong>
          <code class="vm-micro__key">{{ appKey }}</code>
        </div>
        <a
          class="vm-micro__link"
          :href="entryUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          打开入口
          <i class="ri-external-link-line" />
        </a>
      </header>

      <div class="vm-micro__frame">
        <WujieVue
          width="100%"
          height="100%"
          :name="appKey"
          :url="entryUrl"
          :alive="true"
          :sync="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WujieVue from 'wujie-vue3'
import { apiUrl } from '/@/api/client'

defineOptions({ name: 'MicroAppView' })

const route = useRoute()

const appKey = computed(() => String(route.meta.appKey || ''))
const title = computed(() => String(route.meta.title || appKey.value || '微应用'))
const entryUrl = computed(() =>
  appKey.value ? apiUrl(`/vome/apps/${appKey.value}/`) : '',
)
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
  border-radius: 24px;
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

.vm-micro__shell {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px;
  background: var(--card);
  box-shadow: var(--shadow-soft);
}

.vm-micro__bar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent);
}

.vm-micro__bar-left {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.vm-micro__badge {
  display: inline-flex;
  height: 22px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: #eef0ff;
  color: var(--brand);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.vm-micro__name {
  font-size: 14px;
  font-weight: 650;
  color: var(--foreground);
}

.vm-micro__key {
  padding: 2px 8px;
  border-radius: 8px;
  background: var(--background);
  color: var(--muted-foreground);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.vm-micro__link {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.vm-micro__frame {
  flex: 1;
  min-height: 420px;
  overflow: hidden;
  background: var(--background);
}
</style>
