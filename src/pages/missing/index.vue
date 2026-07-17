<template>
  <div class="vm-missing">
    <img
      class="vm-missing__img"
      :src="emptyImg"
      alt="视图未找到"
    />
    <div class="vm-missing__actions">
      <button type="button" class="vm-missing__btn" @click="goHome">返回首页</button>
      <button type="button" class="vm-missing__btn is-ghost" @click="goBack">上一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import emptyImg from '@/static/scarce/页面不存在.svg'

defineOptions({ name: 'MissingViewPage' })
defineProps<{ path?: string }>()

const router = useRouter()

function goHome() {
  void router.push('/')
}

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push('/')
}
</script>

<style lang="scss" scoped>
.vm-missing {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 28px;
  padding: 72px 24px 24px;
}

.vm-missing__img {
  width: min(280px, 70%);
  height: auto;
  user-select: none;
  pointer-events: none;
}

.vm-missing__actions {
  display: flex;
  gap: 10px;
}

.vm-missing__btn {
  box-sizing: border-box;
  width: 112px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: var(--brand);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--brand-deep, #3d4ae6);
  }

  &.is-ghost {
    background: transparent;
    color: var(--foreground);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--foreground) 12%, transparent);

    &:hover {
      background: color-mix(in srgb, var(--foreground) 4%, transparent);
    }
  }
}
</style>
