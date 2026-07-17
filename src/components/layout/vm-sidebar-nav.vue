<template>
  <nav class="vm-nav" :class="{ 'is-collapsed': collapsed && !mobile }">
    <vm-sidebar-nav-item
      v-for="item in visibleMenus"
      :key="item.id"
      :item="item"
      :depth="0"
      :parent-id="null"
      :collapsed="collapsed && !mobile"
      :mobile="mobile"
    />
  </nav>
</template>

<script setup lang="ts">
defineOptions({ name: 'vm-sidebar-nav' })

const props = defineProps<{
  menus: MenuTreeNode[]
  collapsed?: boolean
  /** 移动端抽屉：禁用右侧开口选中态 */
  mobile?: boolean
}>()

const route = useRoute()
const openIds = ref(new Set<number>())
/** 点击瞬间先开口，等路由落地后再清，避免闪烁 */
const pendingLeafId = ref<number | null>(null)
/**
 * 加深背景的目录 id：
 * - 展开目录 → 该目录
 * - 切到页面 → 改为该页面的直接父目录
 */
const deepFocusId = ref<number | null>(null)

provide('sidebar-open-ids', openIds)
provide('sidebar-pending-leaf', pendingLeafId)
provide('sidebar-deep-focus', deepFocusId)

const visibleMenus = computed(() =>
  props.menus.filter((m) => m.isShow !== false && Number(m.type) !== 2),
)

function visibleChildren(item: MenuTreeNode) {
  return (item.children ?? []).filter(
    (c) => c.isShow !== false && Number(c.type) !== 2,
  )
}

function isActivePath(routerPath: string) {
  return route.path === routerPath || route.path.startsWith(`${routerPath}/`)
}

/** 当前激活叶子页的直接父目录 id */
function findActiveLeafParent(
  items: MenuTreeNode[],
  parentId: number | null = null,
): number | null | undefined {
  for (const item of items) {
    const kids = visibleChildren(item)
    if (Number(item.type) === 1 && item.router && isActivePath(item.router)) {
      return parentId
    }
    if (kids.length) {
      const hit = findActiveLeafParent(kids, item.id)
      if (hit !== undefined) return hit
    }
  }
  return undefined
}

watch(
  () => [route.path, props.menus] as const,
  () => {
    pendingLeafId.value = null
    const parentId = findActiveLeafParent(visibleMenus.value)
    // undefined = 未找到叶子；null = 顶级叶子无父级
    if (parentId !== undefined) {
      deepFocusId.value = parentId
    }
  },
  { immediate: true, deep: true },
)
</script>

<style lang="scss" scoped>
$gutter: 10px;

.vm-nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 8px $gutter 24px;

  &.is-collapsed {
    align-items: center;
    overflow: visible;
    padding: 8px $gutter 24px;
  }
}
</style>
