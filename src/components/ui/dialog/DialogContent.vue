<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { X } from "@lucide/vue"
import { reactiveOmit } from "@vueuse/core"
import {
  DialogClose,
  DialogContent,
  DialogPortal,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "/@/lib/cn"
import DialogOverlay from "./DialogOverlay.vue"

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      class?: HTMLAttributes["class"]
      showCloseButton?: boolean
      /** CRUD 弹窗：桌面 50vw，≤768px 全屏 */
      shell?: "crud" | "default"
    }
  >(),
  {
    showCloseButton: true,
    shell: "default",
  },
)
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class", "shell", "showCloseButton")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent
      data-slot="dialog-content"
      :data-shell="shell"
      v-bind="{ ...$attrs, ...forwarded }"
      :aria-describedby="undefined"
      :class="
        cn(
          'bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-50 duration-200',
          // default：居中卡片；crud：定位交给下方 CSS（避免 top/translate 与移动端全屏打架）
          shell === 'default' &&
            'top-[50%] left-[50%] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg',
          shell === 'crud' && 'vm-dialog-shell-crud',
          props.class,
        )
      "
    >
      <slot />

      <DialogClose
        v-if="showCloseButton"
        data-slot="dialog-close"
        class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-3 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <X />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>

<!--
  宽度写死在此：reka DismissableLayer 会覆盖透传的 style；
  Tailwind w-full 在 max-w 失效时会撑满视口。CRUD 壳层用属性选择器 + !important。
-->
<style>
.vm-dialog-shell-crud[data-slot='dialog-content'],
[data-slot='dialog-content'][data-shell='crud'] {
  top: 50%;
  left: 50%;
  display: flex !important;
  width: 50vw !important;
  max-width: 50vw !important;
  min-width: 0 !important;
  min-height: 400px;
  max-height: 800px;
  height: auto;
  flex-direction: column;
  gap: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  border: none !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-soft) !important;
  translate: -50% -50%;
}

/* 列表类弹窗：直接拉满规范最高高度 */
.vm-dialog-shell-crud.is-fill[data-slot='dialog-content'],
[data-slot='dialog-content'][data-shell='crud'].is-fill {
  height: 800px !important;
  max-height: 800px !important;
}

/* 指定高度：--vm-dialog-height（如 800px） */
.vm-dialog-shell-crud.is-height[data-slot='dialog-content'],
[data-slot='dialog-content'][data-shell='crud'].is-height {
  height: var(--vm-dialog-height) !important;
  max-height: var(--vm-dialog-height) !important;
}

/* 移动端：铺满视口（无上下边距、无圆角） */
@media (max-width: 768px) {
  .vm-dialog-shell-crud[data-slot='dialog-content'],
  [data-slot='dialog-content'][data-shell='crud'] {
    inset: 0 !important;
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    min-height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    translate: none !important;
    transform: none !important;
    animation: none !important;
  }
}
</style>
