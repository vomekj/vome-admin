<template>
  <vm-crud ref="Crud">
    <vm-row>
      <vm-search />
    </vm-row>
    <vm-row>
      <vm-refresh-btn />
      <vm-toolbar :trash="false" :show-add="false" :show-delete="false">
        <vm-action-btn
          variant="danger"
          icon="ri-delete-bin-5-line"
          :label="clearing ? '清空中…' : '清空'"
          :loading="clearing"
          @click="clearLogs"
        />
        <div class="vm-log-page__scope">
          <span>写入范围</span>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="vm-log-page__scope-trigger"
                :disabled="scopeSaving"
              >
                <span class="vm-log-page__scope-text">{{ scopeLabel }}</span>
                <i class="ri-arrow-down-s-line" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="vm-log-page__scope-menu w-48 p-1">
              <DropdownMenuItem
                v-for="opt in scopeOptions"
                :key="opt.value"
                class="vm-log-page__scope-item"
                :disabled="scopeSaving"
                @select.prevent
                @click="toggleScope(opt.value)"
              >
                <i
                  class="vm-log-page__scope-check"
                  :class="
                    isScopeChecked(opt.value)
                      ? 'ri-checkbox-fill'
                      : 'ri-checkbox-blank-line'
                  "
                />
                <span>{{ opt.label }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div class="vm-log-page__keep">
          <span>日志保存天数</span>
          <input
            v-model.number="keepDays"
            type="number"
            min="0"
            class="vm-log-page__keep-input"
            :disabled="keepSaving"
            @change="saveKeepDays"
            @keydown.enter.prevent="saveKeepDays"
          />
        </div>
      </vm-toolbar>
    </vm-row>
    <vm-row>
      <vm-table ref="Table">
        <template #cell-params="{ value }">
          <vm-text-link
            v-if="hasJsonContent(value)"
            label="查看"
            @click="openJson('请求参数', value)"
          />
          <span v-else class="vm-log-page__empty">—</span>
        </template>
        <template #cell-response="{ value }">
          <vm-text-link
            v-if="hasJsonContent(value)"
            label="查看"
            @click="openJson('响应数据', value)"
          />
          <span v-else class="vm-log-page__empty">—</span>
        </template>
      </vm-table>
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>

    <vm-upsert
      :title="jsonTitle"
      :items="[]"
      :confirm="false"
      :height="800"
      layout="fill"
      close-text="关闭"
    >
      <template #default>
        <div class="vm-log-json">
          <div class="vm-log-json__frame">
            <vm-json-code :model-value="jsonBody" />
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="vm-log-json__foot">
          <button
            type="button"
            class="vm-crud-shell__btn is-ghost"
            @click="close()"
          >
            关闭
          </button>
          <vm-copy-btn
            :text="jsonText"
            @copied="toast.success('已复制')"
            @error="toast.error('复制失败')"
          />
        </div>
      </template>
    </vm-upsert>
  </vm-crud>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import { hasJsonContent, prettyJson } from '/@/lib/json'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

defineOptions({ name: 'base-log' })

const { service } = useVome()

type ScopeOpt = { value: string; label: string }

const keepDays = ref(30)
const keepSaving = ref(false)
const clearing = ref(false)
const scopeSaving = ref(false)
const scopeValues = ref<string[]>([
  'other',
  'query',
  'update',
  'delete',
  'error',
])
const scopeOptions = ref<ScopeOpt[]>([
  { value: 'all', label: '全部' },
  { value: 'other', label: '其它' },
  { value: 'query', label: '查询' },
  { value: 'add', label: '新增' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'import', label: '导入' },
  { value: 'export', label: '导出' },
  { value: 'restore', label: '恢复' },
  { value: 'public', label: '开放接口' },
  { value: 'error', label: '异常' },
])
const jsonTitle = ref('JSON')
const jsonBody = ref<unknown>(null)
const jsonText = computed(() => prettyJson(jsonBody.value))

const scopeLabel = computed(() => {
  if (scopeValues.value.includes('all')) return '全部'
  const labels = scopeOptions.value
    .filter((o) => o.value !== 'all' && scopeValues.value.includes(o.value))
    .map((o) => o.label)
  if (!labels.length) return '未选择'
  if (labels.length <= 2) return labels.join('、')
  return `${labels.slice(0, 2).join('、')}等${labels.length}项`
})

function isScopeChecked(value: string) {
  if (value === 'all') return scopeValues.value.includes('all')
  if (scopeValues.value.includes('all')) return false
  return scopeValues.value.includes(value)
}

function formatDuration(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${n} ms`
}

function formatLogType(v: unknown) {
  const key = v == null ? '' : String(v)
  if (!key) return '—'
  const hit = scopeOptions.value.find((o) => o.value === key)
  if (hit) return hit.label
  return key
}

function openJson(title: string, value: unknown) {
  jsonTitle.value = title
  jsonBody.value = value
  Crud.value?.openUpsert({}, 'info')
}

async function loadScope() {
  try {
    const res = await service.base.log.getScope()
    if (Array.isArray(res?.options) && res.options.length) {
      scopeOptions.value = res.options
    }
    if (Array.isArray(res?.value) && res.value.length) {
      scopeValues.value = res.value
    }
  } catch (e) {
    console.error(e)
  }
}

async function toggleScope(value: string) {
  if (scopeSaving.value) return
  let next: string[]
  if (value === 'all') {
    next = scopeValues.value.includes('all')
      ? ['other', 'query', 'update', 'delete', 'error']
      : ['all']
  } else if (scopeValues.value.includes('all')) {
    next = [value]
  } else if (scopeValues.value.includes(value)) {
    next = scopeValues.value.filter((v) => v !== value)
    if (!next.length) next = ['error']
  } else {
    next = [...scopeValues.value, value]
  }

  const prev = [...scopeValues.value]
  scopeValues.value = next
  scopeSaving.value = true
  try {
    const saved = await service.base.log.setScope({ value: next })
    if (Array.isArray(saved) && saved.length) scopeValues.value = saved
    toast.success('已保存写入范围')
  } catch (e) {
    scopeValues.value = prev
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    scopeSaving.value = false
  }
}

useTable({
  columns: [
    { type: 'index', label: '#', width: 60 },
    { prop: 'userId', label: '用户ID', width: 100 },
    {
      prop: 'logType',
      label: '日志类型',
      width: 96,
      align: 'center',
      formatter: (_row, v) => formatLogType(v),
    },
    { prop: 'action', label: '请求地址', minWidth: 260 },
    {
      prop: 'params',
      label: '参数',
      width: 88,
      align: 'center',
    },
    {
      prop: 'response',
      label: '响应数据',
      width: 88,
      align: 'center',
    },
    {
      prop: 'status',
      label: '响应状态',
      width: 96,
      align: 'center',
      component: { name: 'vm-status-tag', props: { preset: 'http' } },
    },
    {
      prop: 'duration',
      label: '响应时间',
      width: 100,
      formatter: (_row, v) => formatDuration(v),
    },
    { prop: 'ip', label: 'IP', width: 140 },
    { prop: 'createTime', label: '请求时间', width: 170 },
  ],
})

async function loadKeepDays() {
  try {
    const n = await service.base.log.getKeep()
    const days = Number(n)
    if (Number.isFinite(days) && days >= 0) keepDays.value = days
  } catch (e) {
    console.error(e)
  }
}

async function saveKeepDays() {
  if (keepSaving.value) return
  const days = Math.max(0, Math.floor(Number(keepDays.value) || 0))
  keepDays.value = days
  keepSaving.value = true
  try {
    await service.base.log.setKeep({ value: days })
    toast.success('已保存保留天数')
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    keepSaving.value = false
  }
}

async function clearLogs() {
  if (clearing.value) return
  const ok = await vmConfirm({
    title: '清空日志',
    message: '确定清空全部请求日志？此操作不可恢复。',
    confirmText: '清空',
    cancelText: '取消',
  })
  if (!ok) return
  clearing.value = true
  try {
    await service.base.log.clear({ all: true })
    toast.success('已清空')
    Crud.value?.refresh()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '清空失败')
  } finally {
    clearing.value = false
  }
}

const Crud = useCrud(
  {
    service: service.base.log,
    permission: {
      add: false,
      update: false,
      delete: true,
      info: true,
      page: true,
      list: true,
    },
  },
  (app) => {
    void loadKeepDays()
    void loadScope()
    app.refresh()
  },
)
</script>

<style lang="scss" scoped>
.vm-log-page__scope {
  display: inline-flex;
  height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 4px 0 8px;
  color: var(--muted-foreground);
  font-size: 13px;
}

.vm-log-page__scope-trigger {
  display: inline-flex;
  max-width: 200px;
  height: 32px;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
  border-radius: 10px;
  background: var(--card);
  color: var(--foreground);
  font-size: 13px;
  outline: none;
  cursor: pointer;

  &:hover {
    border-color: color-mix(in srgb, var(--brand) 40%, transparent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 16px;
    color: var(--muted-foreground);
  }
}

.vm-log-page__scope-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vm-log-page__scope-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.vm-log-page__scope-check {
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1;
  color: var(--brand);
}

.vm-log-page__scope-item :deep(i.ri-checkbox-blank-line) {
  color: var(--muted-foreground);
}

.vm-log-page__keep {
  display: inline-flex;
  height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 4px 0 8px;
  color: var(--muted-foreground);
  font-size: 13px;
}

.vm-log-page__keep-input {
  width: 72px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
  border-radius: 10px;
  background: var(--card);
  color: var(--foreground);
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: var(--brand);
  }

  &:disabled {
    opacity: 0.5;
  }
}

.vm-log-page__empty {
  color: var(--muted-foreground);
}

.vm-log-json {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  align-self: stretch;
  min-height: 0;
  padding: 16px 22px;
  box-sizing: border-box;
}

.vm-log-json__frame {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--foreground) 10%, transparent);
  border-radius: 14px;
  background: var(--card);
  box-sizing: border-box;

  :deep(.vm-json-code) {
    border-radius: 0;
    background: var(--muted);
  }
}

.vm-log-json__foot {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  gap: 8px;
}
</style>
