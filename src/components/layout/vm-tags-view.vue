<template>
  <div ref="rootRef" class="vm-tags">
    <div ref="trackRef" class="vm-tags__track" :style="trackStyle">
      <button
        v-for="tag in list"
        :key="tag.path"
        type="button"
        class="vm-tags__item"
        :class="{ 'is-active': route.path === tag.path }"
        @click="router.push(tag.fullPath)"
        @click.middle="close(tag.path, $event)"
      >
        <span class="vm-tags__title">{{ tag.title }}</span>
        <i
          v-if="tag.path !== '/'"
          class="ri-close-line vm-tags__close"
          @click="close(tag.path, $event)"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'vm-tags-view' })

const tags = useTagsStore()
const route = useRoute()
const router = useRouter()

const rootRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const offset = ref(0)

/** 首页由顶栏按钮进入，tabs 不再塞首页项 */
const list = computed(() => tags.list.filter((t) => t.path !== '/'))

const trackStyle = computed(() =>
  offset.value > 0 ? { transform: `translateX(-${offset.value}px)` } : undefined,
)

function measureTabs() {
  const root = rootRef.value
  const track = trackRef.value
  if (!root || !track) return

  const containerWidth = root.clientWidth
  const items = track.querySelectorAll<HTMLElement>('.vm-tags__item')
  if (!items.length || containerWidth <= 0) {
    offset.value = 0
    return
  }

  const gap = 4
  const positions: number[] = []
  const widths: number[] = []
  let total = 0

  items.forEach((el, i) => {
    positions.push(total)
    const w = el.offsetWidth
    widths.push(w)
    total += w + (i < items.length - 1 ? gap : 0)
  })

  const maxOffset = Math.max(0, total - containerWidth)
  if (maxOffset === 0) {
    offset.value = 0
    return
  }

  const activeIndex = list.value.findIndex((t) => t.path === route.path)
  // 默认贴右：左侧最早打开的 tab 被裁切隐藏
  let next = maxOffset

  if (activeIndex >= 0) {
    const left = positions[activeIndex]!
    const right = left + widths[activeIndex]!
    if (left < next) next = left
    if (right > next + containerWidth) next = right - containerWidth
    next = Math.min(maxOffset, Math.max(0, next))
  }

  offset.value = next
}

let ro: ResizeObserver | undefined

function scheduleMeasure() {
  nextTick(() => measureTabs())
}

function close(path: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (path === '/') return
  const i = list.value.findIndex((t) => t.path === path)
  tags.remove(path)
  if (route.path === path) {
    const next = list.value[i - 1] || list.value[i] || null
    void router.push(next?.fullPath || '/')
  }
  scheduleMeasure()
}

watch(
  () => [list.value.length, route.path, ...list.value.map((t) => t.title)] as const,
  scheduleMeasure,
)

onMounted(() => {
  scheduleMeasure()
  ro = new ResizeObserver(scheduleMeasure)
  if (rootRef.value) ro.observe(rootRef.value)
  if (trackRef.value) ro.observe(trackRef.value)
})

onUnmounted(() => {
  ro?.disconnect()
})
</script>

<style lang="scss" scoped>
.vm-tags {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  margin-left: 4px;
  padding: 0;
}

.vm-tags__track {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 4px;
  transition: transform 0.15s ease;
}

.vm-tags__item {
  display: inline-flex;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  gap: 0;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    gap 0.15s ease,
    padding 0.15s ease;

  &:hover {
    gap: 4px;
    padding-right: 8px;
    color: var(--foreground);
  }

  &.is-active {
    background: #fff;
    color: var(--brand);
    box-shadow: var(--shadow-card);

    .dark & {
      background: var(--card);
    }
  }
}

.vm-tags__title {
  white-space: nowrap;
}

/* 默认占 0 宽；悬停展开关闭按钮宽度 */
.vm-tags__close {
  display: inline-flex;
  width: 0;
  height: 14px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 14px;
  line-height: 1;
  opacity: 0;
  transition:
    width 0.15s ease,
    opacity 0.15s ease,
    color 0.15s ease;

  .vm-tags__item:hover & {
    width: 14px;
    opacity: 0.55;
  }

  .vm-tags__item:hover &:hover {
    opacity: 1;
    color: var(--destructive);
  }
}
</style>
