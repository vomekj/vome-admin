<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <RouterView />
  <!-- richColors：success/warning/error/info 走色底+图标（类 Element Message）；勿用 toast.message（白底无类型） -->
  <Toaster position="top-center" :rich-colors="true" :close-button="false" class="!z-[200]" />
</template>
