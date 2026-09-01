<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
  <Toaster position="top-center" :rich-colors="true" :close-button="false" class="!z-[200]" />
</template>
