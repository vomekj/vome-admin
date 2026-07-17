<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from '@lucide/vue'
import { cn } from '/@/lib/cn'
/** 必须引入，否则定位/色底样式全丢 */
import 'vue-sonner/style.css'

const props = withDefaults(defineProps<ToasterProps>(), {
  theme: 'system',
  richColors: true,
  closeButton: false,
  position: 'top-center',
  duration: 2500,
})
</script>

<template>
  <Sonner
    :class="cn('toaster group vm-toaster', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'color-mix(in srgb, var(--border) 55%, transparent)',
      '--border-radius': 'var(--vm-control-radius)',
      '--success-bg': 'var(--success-soft)',
      '--success-border': 'color-mix(in srgb, var(--success) 22%, transparent)',
      '--success-text': 'var(--success)',
      '--error-bg': 'var(--danger-soft)',
      '--error-border': 'color-mix(in srgb, var(--destructive) 22%, transparent)',
      '--error-text': 'var(--destructive)',
      '--warning-bg': 'var(--warning-soft)',
      '--warning-border': 'color-mix(in srgb, var(--warning) 22%, transparent)',
      '--warning-text': 'var(--warning)',
      '--info-bg': 'var(--brand-soft)',
      '--info-border': 'color-mix(in srgb, var(--brand) 22%, transparent)',
      '--info-text': 'var(--brand)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
  </Sonner>
</template>

<style lang="scss">
/* 跟消息自适应宽度；圆角与按钮一致；淡描边；图标与文案间距收紧
 * sonner 内联 --width:356px，必须用 !important 覆盖 */
.vm-toaster[data-sonner-toaster] {
  --toast-icon-margin-end: 0px;
  --toast-svg-margin-end: 0px;
  width: max-content !important;
  max-width: min(400px, 100vw - 32px) !important;

  [data-sonner-toast] {
    width: max-content !important;
    max-width: min(400px, 100vw - 32px) !important;
    min-width: 0;
    min-height: 40px;
    height: auto !important;
    padding: 10px 14px;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    border-width: 1px;
    border-style: solid;
    border-radius: var(--vm-control-radius) !important;
    box-shadow: var(--shadow-soft, 0 4px 12px rgb(0 0 0 / 8%));
  }

  [data-content] {
    max-width: 100%;
  }

  [data-title],
  [data-description] {
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  [data-icon] {
    width: 1.125rem;
    height: 1.125rem;
    margin: 0 !important;
    flex-shrink: 0;
  }
}
</style>
