<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "/@/lib/cn"

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="cn(
      'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-[var(--vm-control-height)] w-full min-w-0 rounded-[var(--vm-control-radius)] border bg-transparent px-[var(--vm-control-padding-x)] py-0 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      /* 聚焦：不要外圈粗 ring，仅细边框淡蓝 */
      'focus-visible:border-[var(--focus-border)] focus-visible:ring-0 focus-visible:shadow-none',
      'aria-invalid:border-destructive aria-invalid:ring-0',
      props.class,
    )"
  >
</template>
