<template>
  <div class="vm-layout">
    <vm-app-sidebar />
    <div class="vm-layout__main">
      <vm-app-header />
      <main class="vm-layout__content">
        <div class="vm-layout__viewport">
          <p v-if="error" class="vm-layout__error">{{ error }}</p>
          <p v-else-if="!ready" class="vm-layout__loading">加载中…</p>
          <RouterView
            v-else-if="ready && app.viewAlive"
            v-slot="{ Component, route: r }"
          >
            <div class="vm-page">
              <!-- 按组件 name（defineOptions）缓存；include 来自 tags.caches -->
              <KeepAlive :include="tags.caches">
                <component
                  :is="Component"
                  v-if="Component && r.meta.keepAlive !== false"
                  :key="String(r.meta.componentName || r.name || r.path)"
                  class="vm-scroll"
                />
              </KeepAlive>
              <component
                :is="Component"
                v-if="Component && r.meta.keepAlive === false"
                :key="String(r.name || r.path)"
                class="vm-scroll"
              />
            </div>
          </RouterView>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createEps, service, setServicePerms } from '/@/service'

defineOptions({ name: 'vm-layout' })

const app = useAppStore()
const user = useUserStore()
const tags = useTagsStore()
const route = useRoute()
const error = ref('')
const ready = ref(false)

onMounted(async () => {
  try {
    // 路由守卫已 load + createEps；此处 await 命中缓存，并校验后再放行业务页
    if (!user.loaded) await user.load()
    await createEps()
    setServicePerms(user.perms, user.isSuper)
    if (!service.base || typeof service.base !== 'object') {
      throw new Error(
        '[vome-eps] service.base 未挂载（createEps 后仍为空，检查 /admin/base/open/eps）',
      )
    }
    ready.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
    ready.value = false
  }
})

watch(
  () => route.fullPath,
  () => tags.add(route),
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.vm-layout {
  /* 内容区四边统一边距（顶栏贴按钮底 → 卡片顶 = 此值） */
  --vm-gutter: 12px;

  display: flex;
  height: 100%;
  overflow: hidden;
  background: var(--background);
}

.vm-layout__main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

/* 固定内容区：上边距仅此一处，与左右下相同 */
.vm-layout__content {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: var(--vm-gutter);
  overflow: hidden;
}

.vm-layout__viewport {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.vm-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;

  /* 业务页在固定视口内撑满；非 CRUD 在页内滚动 */
  > :deep(*) {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  > :deep(.vm-crud),
  > :deep(.vm-home) {
    overflow: hidden;
  }
}

.vm-layout__error {
  margin: 0;
  padding: 16px;
  font-size: 13px;
  color: var(--destructive, #dc2626);
}

.vm-layout__loading {
  margin: 0;
  padding: 16px;
  font-size: 13px;
  color: var(--muted-foreground);
}
</style>
