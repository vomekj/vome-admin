<template>
  <div>
    <!-- ===== 迷你侧栏：图标轨 + 多级浮窗 ===== -->
    <template v-if="collapsed">
      <!-- 叶子：直接跳转 -->
      <RouterLink
        v-if="isLeaf && item.router"
        :to="item.router"
        class="vm-nav-item is-collapsed"
        :class="{ 'is-active': shownActive }"
        :title="item.name"
        @click="onLeafClick"
      >
        <span class="vm-nav-item__icon-slot">
          <vm-ri-icon v-if="hasIcon(item)" :name="iconName(item)" class="vm-nav-item__icon" />
        </span>
      </RouterLink>

      <!-- 目录：悬停弹出多级浮窗（无子项仍显示图标） -->
      <div
        v-else-if="isDir"
        ref="miniRef"
        class="vm-nav-mini"
        @mouseenter="openMiniFlyout"
        @mouseleave="scheduleCloseMini"
      >
        <button
          type="button"
          class="vm-nav-item is-collapsed is-dir"
          :class="{ 'is-active': activeBranch, 'is-branch': activeBranch }"
          :title="item.name"
        >
          <span class="vm-nav-item__icon-slot">
            <vm-ri-icon v-if="hasIcon(item)" :name="iconName(item)" class="vm-nav-item__icon" />
          </span>
        </button>

        <Teleport to="body">
          <vm-sidebar-flyout
            v-if="miniOpen && children.length"
            :items="children"
            :parent-id="item.id"
            :anchor="miniAnchor"
            @enter="clearMiniTimer"
            @leave="scheduleCloseMini"
            @navigate="closeMiniNow"
          />
        </Teleport>
      </div>
    </template>

    <!-- ===== 展开侧栏 ===== -->
    <template v-else>
      <RouterLink
        v-if="isLeaf && item.router"
        :to="item.router"
        class="vm-nav-item"
        :class="{ 'is-active': shownActive, 'is-mobile': mobile }"
        :style="{ paddingLeft: `${pad}px` }"
        @click="onLeafClick"
      >
        <span
          v-if="!mobile"
          class="vm-nav-item__notch vm-nav-item__notch--top"
          aria-hidden="true"
        />
        <span
          v-if="!mobile"
          class="vm-nav-item__notch vm-nav-item__notch--bottom"
          aria-hidden="true"
        />
        <span class="vm-nav-item__icon-slot">
          <vm-ri-icon v-if="hasIcon(item)" :name="iconName(item)" class="vm-nav-item__icon" />
        </span>
        <span class="vm-nav-item__label">{{ item.name }}</span>
      </RouterLink>

      <div
        v-else-if="isDir"
        class="vm-nav-group"
        :class="{ 'is-deep': isDeepGroup }"
      >
        <button
          type="button"
          class="vm-nav-item is-dir"
          :class="{ 'is-branch': activeBranch, 'is-mobile': mobile }"
          :style="{ paddingLeft: `${pad}px` }"
          @click="toggle"
        >
          <span class="vm-nav-item__icon-slot">
            <vm-ri-icon v-if="hasIcon(item)" :name="iconName(item)" class="vm-nav-item__icon" />
          </span>
          <span class="vm-nav-item__label">{{ item.name }}</span>
          <i
            class="ri-arrow-down-s-line vm-nav-item__arrow"
            :class="{ 'is-open': open }"
          />
        </button>
        <div v-show="open" class="vm-nav-group__children">
          <vm-sidebar-nav-item
            v-for="child in children"
            :key="child.id"
            :item="child"
            :depth="depth + 1"
            :parent-id="item.id"
            :collapsed="false"
            :mobile="mobile"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'vm-sidebar-nav-item' })

const props = defineProps<{
  item: MenuTreeNode
  depth: number
  parentId?: number | null
  collapsed?: boolean
  /** 移动端抽屉：选中用内嵌白底，不用右侧开口 */
  mobile?: boolean
}>()

const route = useRoute()

const OPEN_KEY = 'sidebar-open-ids'
const PENDING_KEY = 'sidebar-pending-leaf'
const DEEP_KEY = 'sidebar-deep-focus'
const openIds = inject<Ref<Set<number>>>(OPEN_KEY)!
const pendingLeafId = inject<Ref<number | null>>(PENDING_KEY)!
const deepFocusId = inject<Ref<number | null>>(DEEP_KEY)!
if (!openIds || !pendingLeafId || !deepFocusId) {
  throw new Error('[vm-sidebar-nav-item] 缺少 sidebar provide')
}

const miniRef = ref<HTMLElement | null>(null)
const miniOpen = ref(false)
const miniAnchor = ref({ top: 0, left: 0 })
let miniTimer: ReturnType<typeof setTimeout> | null = null

function hasIcon(item: MenuTreeNode) {
  return Boolean(item.icon && String(item.icon).trim())
}

function iconName(item: MenuTreeNode) {
  const raw = String(item.icon || '').trim()
  return raw.startsWith('ri-') ? raw : `ri-${raw}`
}

function visibleChildren(item: MenuTreeNode) {
  return (item.children ?? []).filter(
    (c) => c.isShow !== false && Number(c.type) !== 2,
  )
}

const children = computed(() => visibleChildren(props.item))
const isDir = computed(
  () => Number(props.item.type) === 0 || children.value.length > 0,
)
const isLeaf = computed(
  () => Number(props.item.type) === 1 && Boolean(props.item.router),
)

function isActiveLeaf(item: MenuTreeNode) {
  if (!item.router) return false
  return route.path === item.router || route.path.startsWith(`${item.router}/`)
}

function containsActive(item: MenuTreeNode): boolean {
  if (isActiveLeaf(item)) return true
  return visibleChildren(item).some((c) => containsActive(c))
}

function containsId(item: MenuTreeNode, id: number): boolean {
  if (item.id === id) return true
  return visibleChildren(item).some((c) => containsId(c, id))
}

const activeLeaf = computed(() => isActiveLeaf(props.item))
const shownActive = computed(
  () => activeLeaf.value || pendingLeafId.value === props.item.id,
)
const activeBranch = computed(() => containsActive(props.item))
const open = computed(() => openIds!.value.has(props.item.id))
const isDeepGroup = computed(
  () => !props.collapsed && open.value && deepFocusId.value === props.item.id,
)

function onLeafClick() {
  pendingLeafId.value = props.item.id
  deepFocusId.value = props.parentId ?? null
}

function ensureOpenAlongActive(item: MenuTreeNode) {
  if (!containsActive(item)) return
  if (isDir.value) {
    openIds!.value = new Set(openIds!.value).add(item.id)
  }
  for (const c of children.value) {
    if (containsActive(c) && (Number(c.type) === 0 || visibleChildren(c).length)) {
      openIds!.value = new Set(openIds!.value).add(c.id)
    }
  }
}

watch(
  () => route.path,
  () => ensureOpenAlongActive(props.item),
  { immediate: true },
)

function toggle() {
  const next = new Set(openIds!.value)
  const willOpen = !next.has(props.item.id)
  if (willOpen) {
    next.add(props.item.id)
    deepFocusId.value = props.item.id
  } else {
    next.delete(props.item.id)
    const focus = deepFocusId.value
    if (focus != null && containsId(props.item, focus)) {
      deepFocusId.value = null
    }
  }
  openIds!.value = next
}

function clearMiniTimer() {
  if (miniTimer) {
    clearTimeout(miniTimer)
    miniTimer = null
  }
}

function openMiniFlyout() {
  clearMiniTimer()
  const el = miniRef.value
  if (!el) return
  const btn = el.querySelector('.vm-nav-item') as HTMLElement | null
  const btnRect = (btn || el).getBoundingClientRect()
  // 按钮在侧栏内居中，必须用侧栏右边缘，否则浮窗会盖住图标
  const sidebar = el.closest('.vm-sidebar') as HTMLElement | null
  const sideRight = sidebar?.getBoundingClientRect().right ?? btnRect.right
  miniAnchor.value = {
    top: Math.round(btnRect.top),
    left: Math.round(sideRight + 12),
  }
  miniOpen.value = true
}

function scheduleCloseMini() {
  clearMiniTimer()
  miniTimer = setTimeout(() => {
    miniOpen.value = false
  }, 140)
}

function closeMiniNow() {
  clearMiniTimer()
  miniOpen.value = false
}

onBeforeUnmount(() => clearMiniTimer())

const pad = computed(() => 12 + props.depth * 14)
</script>

<style lang="scss" scoped>
$open: 14px;
$gutter: 10px;

.vm-nav-mini {
  position: relative;
}

.vm-nav-item {
  position: relative;
  z-index: 0;
  display: flex;
  width: 100%;
  height: 44px;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding-right: 12px;
  margin: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 700 !important;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: none;

  .vm-nav-item__icon-slot,
  .vm-nav-item__icon,
  .vm-nav-item__label,
  .vm-nav-item__arrow {
    position: relative;
    z-index: 1;
  }

  &:hover:not(.is-active)::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.16);
    pointer-events: none;
  }

  &:active:not(.is-active)::before {
    background: rgba(255, 255, 255, 0.24);
  }

  &.is-collapsed {
    width: 44px;
    height: 44px;
    justify-content: center;
    padding: 0;
    margin: 0 auto;
    border-radius: 12px;
  }

  /* 桌面展开：右侧开口贴内容区 */
  &.is-active:not(.is-collapsed):not(.is-mobile) {
    z-index: 1;
    width: calc(100% + #{$gutter});
    margin-right: -$gutter;
    border-radius: $open 0 0 $open;
    background: var(--background);
    color: var(--brand);

    .vm-nav-item__icon,
    .vm-nav-item__label {
      color: var(--brand);
    }

    .vm-nav-item__notch {
      display: block;
    }
  }

  /* 移动端抽屉：内嵌白底圆角，避免开口溢出 Sheet */
  &.is-active.is-mobile:not(.is-collapsed) {
    z-index: 1;
    width: 100%;
    margin-right: 0;
    border-radius: 12px;
    background: #fff;
    color: var(--brand);

    .vm-nav-item__icon,
    .vm-nav-item__label {
      color: var(--brand);
    }

    .vm-nav-item__notch {
      display: none;
    }
  }

  &.is-active.is-collapsed,
  &.is-branch.is-collapsed {
    width: 44px;
    margin-right: auto;
    background: #fff;
    color: var(--brand);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);

    .vm-nav-item__notch {
      display: none;
    }

    .vm-nav-item__icon {
      color: var(--brand);
    }
  }

  &.is-dir.is-branch:not(.is-active):not(.is-collapsed) {
    color: #fff;
  }
}

.vm-nav-item__notch {
  display: none;
  position: absolute;
  right: 0;
  width: $open;
  height: $open;
  background: transparent;
  pointer-events: none;

  &--top {
    top: -$open;
    border-bottom-right-radius: $open;
    box-shadow: 5px 5px 0 5px var(--background);
  }

  &--bottom {
    bottom: -$open;
    border-top-right-radius: $open;
    box-shadow: 5px -5px 0 5px var(--background);
  }
}

.vm-nav-item__icon-slot {
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.vm-nav-item__icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  opacity: 0.95;
}

.vm-nav-item__label {
  display: inline-flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  font-synthesis: weight;
}

.vm-nav-item__arrow {
  display: inline-flex;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-right: 2px;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  opacity: 0.75;
  transition: transform 0.2s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.vm-nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  border-radius: 12px;

  &.is-deep {
    background: rgba(0, 0, 0, 0.2);
  }
}

.vm-nav-group__children {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
