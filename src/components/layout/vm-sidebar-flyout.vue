<template>
  <div
    class="vm-flyout"
    :class="{ 'is-nested': nested }"
    :style="panelStyle"
    @mouseenter="emit('enter')"
    @mouseleave="emit('leave')"
  >
    <div
      v-for="node in items"
      :key="node.id"
      class="vm-flyout__row"
      :class="{
        'is-active': isActiveLeaf(node) || containsActive(node),
        'is-open': openId === node.id,
      }"
      @mouseenter="onRowEnter(node)"
      @mouseleave="onRowLeave(node)"
    >
      <RouterLink
        v-if="isLeaf(node) && node.router"
        :to="node.router"
        class="vm-flyout__link"
        @click="onLeafClick(node)"
      >
        <vm-ri-icon v-if="hasIcon(node)" :name="iconOf(node)" class="vm-flyout__icon" />
        <span class="vm-flyout__label">{{ menuLabelOf(node) }}</span>
      </RouterLink>

      <button v-else type="button" class="vm-flyout__link">
        <vm-ri-icon v-if="hasIcon(node)" :name="iconOf(node)" class="vm-flyout__icon" />
        <span class="vm-flyout__label">{{ menuLabelOf(node) }}</span>
        <i class="ri-arrow-right-s-line vm-flyout__chevron" />
      </button>

      <vm-sidebar-flyout
        v-if="isDir(node) && openId === node.id"
        nested
        :items="kids(node)"
        :parent-id="node.id"
        @enter="clearLeaveTimer"
        @leave="scheduleCloseRow"
        @navigate="emit('navigate')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLocaleStore } from '@/stores/locale'

defineOptions({ name: 'vm-sidebar-flyout' })

const props = defineProps<{
  items: MenuTreeNode[]
  /** 浮窗相对视口定位（根级）；嵌套级不传 */
  anchor?: { top: number; left: number }
  nested?: boolean
  parentId?: number | null
}>()

const emit = defineEmits<{
  enter: []
  leave: []
  navigate: []
}>()

const locale = useLocaleStore()
function menuLabelOf(node: MenuTreeNode) {
  return locale.tMenu(node)
}

const route = useRoute()

const PENDING_KEY = 'sidebar-pending-leaf'
const DEEP_KEY = 'sidebar-deep-focus'
const pendingLeafId = inject<Ref<number | null>>(PENDING_KEY)!
const deepFocusId = inject<Ref<number | null>>(DEEP_KEY)!
if (!pendingLeafId || !deepFocusId) {
  throw new Error('[vm-sidebar-flyout] 缺少 sidebar provide')
}

const openId = ref<number | null>(null)
let leaveTimer: ReturnType<typeof setTimeout> | null = null

const panelStyle = computed(() => {
  if (props.nested || !props.anchor) return undefined
  return {
    top: `${props.anchor.top}px`,
    left: `${props.anchor.left}px`,
  } as Record<string, string>
})

function kids(item: MenuTreeNode) {
  return (item.children ?? []).filter(
    (c) => c.isShow !== false && Number(c.type) !== 2,
  )
}

function isDir(item: MenuTreeNode) {
  return Number(item.type) === 0 || kids(item).length > 0
}

function isLeaf(item: MenuTreeNode) {
  return Number(item.type) === 1 && Boolean(item.router)
}

/** 仅配置了 icon 才展示，不占空白位 */
function hasIcon(item: MenuTreeNode) {
  return Boolean(item.icon && String(item.icon).trim())
}

function iconOf(item: MenuTreeNode) {
  const raw = String(item.icon || '').trim()
  return raw.startsWith('ri-') ? raw : `ri-${raw}`
}

function isActiveLeaf(item: MenuTreeNode) {
  if (!item.router) return false
  return route.path === item.router || route.path.startsWith(`${item.router}/`)
}

function containsActive(item: MenuTreeNode): boolean {
  if (isActiveLeaf(item)) return true
  return kids(item).some((c) => containsActive(c))
}

function clearLeaveTimer() {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

function onRowEnter(node: MenuTreeNode) {
  clearLeaveTimer()
  if (isDir(node)) openId.value = node.id
  else openId.value = null
}

function onRowLeave(node: MenuTreeNode) {
  if (!isDir(node)) return
  leaveTimer = setTimeout(() => {
    if (openId.value === node.id) openId.value = null
  }, 120)
}

function scheduleCloseRow() {
  leaveTimer = setTimeout(() => {
    openId.value = null
  }, 120)
}

function onLeafClick(node: MenuTreeNode) {
  pendingLeafId.value = node.id
  deepFocusId.value = props.parentId ?? null
  emit('navigate')
}

onBeforeUnmount(() => clearLeaveTimer())
</script>

<style lang="scss" scoped>
.vm-flyout {
  position: fixed;
  z-index: 80;
  box-sizing: border-box;
  min-width: 168px;
  max-width: 240px;
  padding: 6px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(40, 50, 120, 0.14);

  /* 嵌套级：相对当前行右侧展开，级间留缝 */
  &.is-nested {
    position: absolute;
    top: -6px;
    left: calc(100% + 10px);
    margin: 0;

    /* 透明桥：盖住级间空隙，鼠标移动不中断 */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: -10px;
      width: 10px;
    }
  }
}

:global(.dark) .vm-flyout {
  background: var(--card);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.vm-flyout__row {
  position: relative;
}

.vm-flyout__link {
  display: flex;
  width: 100%;
  height: 38px;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--foreground);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover,
  .vm-flyout__row.is-open > & {
    background: var(--muted);
  }

  .vm-flyout__row.is-active > & {
    color: var(--brand);
    background: var(--brand-soft);
  }
}

.vm-flyout__icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
}

.vm-flyout__label {
  display: inline-flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
  text-align: left;
}

.vm-flyout__chevron {
  display: inline-flex;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  font-size: 16px;
  line-height: 1;
  opacity: 0.45;
}
</style>
