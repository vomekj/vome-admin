<template>
  <div class="vm-login">
    <canvas ref="bubbleRef" class="vm-login__bubble" aria-hidden="true" />

    <div class="vm-login__panel">
      <form class="vm-login__box" @submit.prevent="submit">
        <div class="vm-login__brand">
          <div class="vm-login__logo">
            <img :src="logoDark" alt="" />
          </div>
          <span class="vm-login__name">{{ config.app.name }}</span>
        </div>
        <p class="vm-login__desc">{{ config.app.desc }}</p>

        <div class="vm-login__field">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            maxlength="20"
            autocomplete="username"
            placeholder="请输入用户名"
            :disabled="loading"
          />
        </div>

        <div class="vm-login__field">
          <label for="password">密码</label>
          <div class="vm-login__password-wrap">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              maxlength="32"
              autocomplete="current-password"
              placeholder="请输入密码"
              :disabled="loading"
            />
            <button
              type="button"
              class="vm-login__password-toggle"
              tabindex="-1"
              :title="showPassword ? '隐藏密码' : '显示密码'"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              :disabled="loading"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'ri-eye-line' : 'ri-eye-off-line'" />
            </button>
          </div>
        </div>

        <div class="vm-login__field">
          <label for="verifyCode">计算结果</label>
          <div class="vm-login__captcha-row">
            <input
              id="verifyCode"
              v-model="verifyCode"
              type="text"
              maxlength="4"
              inputmode="numeric"
              autocomplete="off"
              placeholder="请输入计算结果"
              :disabled="loading"
            />
            <button
              type="button"
              class="vm-login__captcha"
              title="点击刷新"
              :disabled="captchaLoading || loading"
              @click="refreshCaptcha"
            >
              <img v-if="captchaSrc" :src="captchaSrc" alt="验证码" />
              <span v-else class="vm-login__captcha-loading">…</span>
            </button>
          </div>
        </div>

        <p v-if="error" class="vm-login__error">{{ error }}</p>

        <button type="submit" class="vm-login__submit" :disabled="loading">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { config } from '@/config'
import { api, setTokens } from '/@/api/client'
import { resetMenuRoutesFlag } from '/@/router'
import logoDark from '@/static/image/深色logo.png'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const captchaId = ref('')
const verifyCode = ref('')
const captchaSrc = ref('')
const captchaLoading = ref(false)
const error = ref('')
const loading = ref(false)

const bubbleRef = ref<HTMLCanvasElement | null>(null)
let bubbleRaf = 0
let bubbleRo: ResizeObserver | null = null
let bubbleCssW = 0
let bubbleCssH = 0
let bubbleOnVisibility: (() => void) | null = null
let bubbleOnPointer: ((e: PointerEvent) => void) | null = null

/** 点击涟漪：局部把表面向外推开后衰减 */
type BubbleRipple = { x: number; y: number; born: number; power: number }
const bubbleRipples: BubbleRipple[] = []
const RIPPLE_LIFE = 1.6

function syncBubbleSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  bubbleCssW = rect.width
  bubbleCssH = rect.height
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const nextW = Math.max(1, Math.floor(bubbleCssW * dpr))
  const nextH = Math.max(1, Math.floor(bubbleCssH * dpr))
  if (canvas.width !== nextW) canvas.width = nextW
  if (canvas.height !== nextH) canvas.height = nextH
}

function bubbleCenter(w: number, h: number, t: number) {
  const cx = w * 0.1
  const cy = h * 0.44
  const ox =
    Math.sin(t * 0.32) * w * 0.018 + Math.sin(t * 0.19) * w * 0.012
  const oy =
    Math.cos(t * 0.27) * h * 0.022 + Math.sin(t * 0.38) * h * 0.01
  return {
    cx: cx + ox,
    cy: cy + oy,
    baseRx: w * 0.5,
    baseRy: h * 0.62,
  }
}

function ripplePush(px: number, py: number, nowMs: number) {
  let push = 0
  for (let i = bubbleRipples.length - 1; i >= 0; i--) {
    const r = bubbleRipples[i]!
    const age = (nowMs - r.born) / 1000
    if (age > RIPPLE_LIFE) {
      bubbleRipples.splice(i, 1)
      continue
    }
    const life = 1 - age / RIPPLE_LIFE
    const dist = Math.hypot(px - r.x, py - r.y)
    const envelope = Math.exp(-dist * 0.0038) * life * life
    const wave = Math.sin(dist * 0.028 - age * 9.5)
    push += wave * envelope * r.power * 0.22
  }
  return push
}

/** 画布水珠：多频正弦形变 + 点击涟漪 */
function paintBubble(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  nowMs: number,
) {
  ctx.clearRect(0, 0, w, h)
  if (w < 2 || h < 2) return

  const { cx, cy, baseRx, baseRy } = bubbleCenter(w, h, t)

  const segments = 96
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const wave =
      0.14 * Math.sin(a * 2 + t * 0.85) +
      0.09 * Math.sin(a * 3 - t * 1.05) +
      0.055 * Math.sin(a * 5 + t * 0.55) +
      0.04 * Math.cos(a * 4 + t * 0.72)
    let rx = baseRx * (1 + wave)
    let ry = baseRy * (1 + wave * 0.9 + 0.05 * Math.sin(a * 1.5 + t * 0.48))
    const nx = Math.cos(a)
    const ny = Math.sin(a)
    const roughX = cx + nx * rx
    const roughY = cy + ny * ry
    const push = ripplePush(roughX, roughY, nowMs)
    rx *= 1 + push
    ry *= 1 + push
    points.push({
      x: cx + nx * rx,
      y: cy + ny * ry,
    })
  }

  ctx.beginPath()
  const last = points[points.length - 1]!
  const first = points[0]!
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2)
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    const n = points[(i + 1) % points.length]!
    ctx.quadraticCurveTo(p.x, p.y, (p.x + n.x) / 2, (p.y + n.y) / 2)
  }
  ctx.closePath()

  const gx = cx - baseRx * 0.18
  const gy = cy - baseRy * 0.22
  const grad = ctx.createRadialGradient(
    gx,
    gy,
    0,
    cx,
    cy,
    Math.max(baseRx, baseRy) * 1.05,
  )
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.78)')
  grad.addColorStop(0.28, 'rgba(186, 196, 255, 0.48)')
  grad.addColorStop(0.58, 'rgba(120, 135, 255, 0.28)')
  grad.addColorStop(0.82, 'rgba(155, 168, 255, 0.12)')
  grad.addColorStop(1, 'rgba(155, 168, 255, 0)')

  ctx.save()
  ctx.shadowColor = 'rgba(78, 93, 255, 0.28)'
  ctx.shadowBlur = Math.min(w, h) * 0.06
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()

  // 点击亮环
  for (const r of bubbleRipples) {
    const age = (nowMs - r.born) / 1000
    if (age > RIPPLE_LIFE) continue
    const life = 1 - age / RIPPLE_LIFE
    const radius = 18 + age * 120
    ctx.beginPath()
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * life * life})`
    ctx.lineWidth = 2.5 * life
    ctx.stroke()
  }
}

function startBubble() {
  const canvas = bubbleRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  syncBubbleSize(canvas)
  bubbleRo = new ResizeObserver(() => syncBubbleSize(canvas))
  bubbleRo.observe(canvas)

  bubbleOnPointer = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const t = performance.now() / 1000
    const { cx, cy, baseRx, baseRy } = bubbleCenter(bubbleCssW, bubbleCssH, t)
    // 椭圆近似：点在泡附近才响应
    const dx = (x - cx) / (baseRx * 1.15)
    const dy = (y - cy) / (baseRy * 1.15)
    if (dx * dx + dy * dy > 1) return

    bubbleRipples.push({ x, y, born: performance.now(), power: 1 })
    if (bubbleRipples.length > 5) bubbleRipples.shift()
  }
  canvas.addEventListener('pointerdown', bubbleOnPointer)

  const tick = (now: number) => {
    bubbleRaf = 0
    if (document.hidden) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintBubble(ctx, bubbleCssW, bubbleCssH, now / 1000, now)
    bubbleRaf = requestAnimationFrame(tick)
  }

  bubbleOnVisibility = () => {
    if (document.hidden) {
      if (bubbleRaf) cancelAnimationFrame(bubbleRaf)
      bubbleRaf = 0
      return
    }
    if (!bubbleRaf) bubbleRaf = requestAnimationFrame(tick)
  }
  document.addEventListener('visibilitychange', bubbleOnVisibility)
  bubbleRaf = requestAnimationFrame(tick)
}

function stopBubble() {
  if (bubbleRaf) cancelAnimationFrame(bubbleRaf)
  bubbleRaf = 0
  bubbleRo?.disconnect()
  bubbleRo = null
  if (bubbleOnVisibility) {
    document.removeEventListener('visibilitychange', bubbleOnVisibility)
    bubbleOnVisibility = null
  }
  const canvas = bubbleRef.value
  if (canvas && bubbleOnPointer) {
    canvas.removeEventListener('pointerdown', bubbleOnPointer)
  }
  bubbleOnPointer = null
  bubbleRipples.length = 0
}

async function refreshCaptcha() {
  captchaLoading.value = true
  captchaSrc.value = ''
  verifyCode.value = ''
  try {
    const data = await api.captcha({ width: 150, height: 45, color: '#2c3142' })
    captchaId.value = data.captchaId
    captchaSrc.value = data.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : '验证码获取失败'
  } finally {
    captchaLoading.value = false
  }
}

async function submit() {
  error.value = ''
  if (!username.value) {
    error.value = '用户名不能为空'
    return
  }
  if (!password.value) {
    error.value = '密码不能为空'
    return
  }
  if (!verifyCode.value) {
    error.value = '请输入计算结果'
    return
  }

  loading.value = true
  try {
    const data = await api.login({
      username: username.value,
      password: password.value,
      captchaId: captchaId.value,
      verifyCode: verifyCode.value,
    })
    setTokens(data.accessToken, data.refreshToken)
    void import('@/lib/socket').then(({ reconnectWs }) => reconnectWs())
    resetMenuRoutesFlag()
    const redirect =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect || '/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
    await refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refreshCaptcha()
  startBubble()
})

onUnmounted(() => {
  stopBubble()
})
</script>

<style lang="scss" scoped>
.vm-login {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  background: #fff;
  color: #2c3142;
}

.vm-login__bubble {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  cursor: pointer;
}

.vm-login__panel {
  position: relative;
  z-index: 2;
  display: flex;
  width: 50%;
  margin-left: auto;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;

  @media (max-width: 1024px) {
    width: 100%;
  }
}

.vm-login__box {
  display: flex;
  width: 100%;
  max-width: 320px;
  flex-direction: column;
  align-items: center;
}

.vm-login__brand {
  --login-brand: #3b4456;
  display: flex;
  align-items: center;
  user-select: none;
  margin-bottom: 16px;
}

.vm-login__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  padding: 5px;
  border-radius: 9px;
  background: var(--login-brand);

  img {
    width: 38px;
    height: 38px;
    object-fit: contain;
  }
}

.vm-login__name {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1;
  color: var(--login-brand);
}

.vm-login__desc {
  margin: 0 0 50px;
  font-size: 15px;
  letter-spacing: 0.06em;
  color: #8a90a0;
  text-align: center;
  user-select: none;
  max-width: 90%;
}

.vm-login__field {
  width: 100%;
  margin-bottom: 18px;

  label {
    display: block;
    margin-bottom: 8px;
    padding-left: 4px;
    font-size: 13px;
    color: #8a90a0;
    user-select: none;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    height: 45px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: #f8f8f8;
    color: #333;
    font-size: 15px;
    outline: none;

    &::placeholder {
      color: #b0b4bf;
    }

    &:disabled {
      opacity: 0.7;
    }

    &:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 1000px #f8f8f8 inset;
      box-shadow: 0 0 0 1000px #f8f8f8 inset;
    }
  }
}

.vm-login__password-wrap {
  position: relative;

  input {
    padding-right: 44px;
  }
}

.vm-login__password-toggle {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 45px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8a90a0;
  cursor: pointer;

  i {
    font-size: 18px;
    line-height: 1;
  }

  &:hover:not(:disabled) {
    color: var(--brand, #4e5dff);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.vm-login__captcha-row {
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    flex: 1;
    min-width: 0;
  }
}

.vm-login__captcha {
  display: flex;
  flex-shrink: 0;
  width: 150px;
  height: 45px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: #f8f8f8;
  cursor: pointer;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:disabled {
    cursor: wait;
  }
}

.vm-login__captcha-loading {
  color: #8a90a0;
  font-size: 18px;
}

.vm-login__error {
  width: 100%;
  margin: 0 0 12px;
  font-size: 13px;
  color: #e11d48;
}

.vm-login__submit {
  width: 100%;
  height: 45px;
  margin-top: 22px;
  border: 0;
  border-radius: 8px;
  background: var(--brand, #4e5dff);
  color: #fff;
  font-size: 16px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
}
</style>
