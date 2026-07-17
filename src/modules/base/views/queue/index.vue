<template>
  <vm-split-layout aside-width="260px" class="vm-queue-page">
      <template #toolbar>
        <div class="vm-queue-page__actions">
          <vm-action-btn
            icon="ri-refresh-line"
            label="刷新"
            :loading="queuesLoading"
            @click="loadQueues"
          />
          <vm-action-btn
            variant="primary"
            icon="ri-send-plane-line"
            :label="enqueueing ? '投递中…' : '投递'"
            :loading="enqueueing"
            @click="openEnqueue"
          />
        </div>
        <div v-if="selected" class="vm-queue-page__actions">
          <vm-action-btn :label="selected.paused ? '恢复' : '暂停'" :disabled="acting" @click="togglePause" />
          <vm-action-btn label="清理已完成" :disabled="acting" @click="clean('completed')" />
          <vm-action-btn variant="danger" label="清理失败" :disabled="acting" @click="clean('failed')" />
          <vm-action-btn variant="danger" label="删除队列" :disabled="acting" @click="obliterateQueue" />
          <vm-action-btn label="刷新任务" :disabled="Crud?.loading.value" @click="refreshJobs" />
        </div>
      </template>

      <template #aside>
        <div class="vm-queue-page__aside-inner vm-scroll">
          <h3 class="vm-queue-page__title">队列</h3>
          <p v-if="queuesLoading" class="vm-queue-page__hint">加载中…</p>
          <p v-else-if="!queues.length" class="vm-queue-page__hint">暂无队列</p>
          <vm-aside-list-item
            v-for="q in queues"
            :key="q.name"
            :active="selectedName === q.name"
            :show-arrow="false"
            @click="selectQueue(q)"
          >
            {{ q.name }}
            <template #subtitle>
              等{{ q.waiting }} / 活{{ q.active }} / 败{{ q.failed }}
              <template v-if="q.paused"> · 暂停</template>
            </template>
          </vm-aside-list-item>
        </div>
      </template>

      <vm-crud ref="Crud">
        <vm-row>
          <vm-table ref="Table">
            <template #cell-data="{ value }">
              <vm-text-link
                v-if="hasJsonContent(value)"
                label="查看"
                @click="openJson(value)"
              />
              <span v-else class="vm-queue-page__empty">—</span>
            </template>
          </vm-table>
        </vm-row>
        <vm-upsert
          ref="Upsert"
          :title="upsertTitle"
          :items="upsertItems"
          :confirm="upsertConfirm"
          :height="upsertHeight"
          :layout="upsertLayout"
          :close-text="upsertScene === 'json' ? '关闭' : '取消'"
        >
          <template v-if="upsertScene === 'json'" #default>
            <div class="vm-queue-json">
              <div class="vm-queue-json__frame">
                <vm-json-code :model-value="jsonBody" />
              </div>
            </div>
          </template>
          <template v-if="upsertScene === 'json'" #footer="{ close }">
            <div class="vm-queue-json__foot">
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
  </vm-split-layout>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import { hasJsonContent, prettyJson } from '/@/lib/json'

defineOptions({ name: 'base-queue' })

const { service } = useVome()

type QueueRow = {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: boolean
}

type JobRow = {
  id?: string
  data?: unknown
  attemptsMade?: number
  processedOn?: number
  finishedOn?: number
  failedReason?: string
  delay?: number
}

const queues = ref<QueueRow[]>([])
const queuesLoading = ref(false)
const selected = ref<QueueRow | null>(null)
const selectedName = computed(() => selected.value?.name ?? '')
const acting = ref(false)

const enqueueing = ref(false)

const upsertScene = ref<'enqueue' | 'json'>('enqueue')
const upsertConfirm = computed(() => upsertScene.value === 'enqueue')
const upsertHeight = computed(() =>
  upsertScene.value === 'json' ? 800 : undefined,
)
const upsertLayout = computed(() =>
  upsertScene.value === 'json' ? 'fill' : 'form',
)
const upsertTitle = computed(() =>
  upsertScene.value === 'json' ? '任务数据' : '投递到队列',
)
const upsertItems = computed(() =>
  upsertScene.value === 'enqueue' ? enqueueItems : [],
)

const jsonBody = ref<unknown>(null)
const jsonText = computed(() => prettyJson(jsonBody.value))

const enqueueItems: CrudFormItem[] = [
  { prop: 'name', label: '队列名', required: true, span: 12, placeholder: '队列名' },
  {
    prop: 'delay',
    label: '延迟(ms)',
    span: 12,
    placeholder: '0',
    value: 0,
  },
  {
    prop: 'data',
    label: 'JSON 数据',
    span: 12,
    value: {},
    component: { name: 'vm-json-editor' },
  },
]

function jobStatus(j: JobRow) {
  if (j.finishedOn && j.failedReason) return { statusKey: 'failed', statusLabel: '失败' }
  if (j.finishedOn) return { statusKey: 'completed', statusLabel: '完成' }
  if (j.processedOn) return { statusKey: 'active', statusLabel: '执行中' }
  if (j.delay) return { statusKey: 'delayed', statusLabel: '延迟' }
  return { statusKey: 'waiting', statusLabel: '等待' }
}

function mapJobs(rows: JobRow[]) {
  return rows.map((j) => ({
    ...j,
    id: String(j.id ?? ''),
    attemptsMade: j.attemptsMade ?? 0,
    ...jobStatus(j),
  })) as Record<string, unknown>[]
}

async function fetchJobs(): Promise<Record<string, unknown>[]> {
  if (!selected.value) return []
  const rows = (await service.base.queue.jobs({
    name: selected.value.name,
    start: 0,
    end: 99,
  })) as JobRow[]
  return mapJobs(Array.isArray(rows) ? rows : [])
}

useTable({
  rowKey: 'id',
  columns: [
    { prop: 'id', label: 'ID', width: 120 },
    {
      prop: 'statusKey',
      label: '状态',
      width: 88,
      component: {
        name: 'vm-status-tag',
        props: { preset: 'queue', labelProp: 'statusLabel' },
      },
    },
    { prop: 'attemptsMade', label: '尝试', width: 72 },
    {
      prop: 'data',
      label: '数据',
      width: 88,
      align: 'center',
    },
    {
      prop: 'failedReason',
      label: '失败原因',
      minWidth: 160,
      component: { name: 'vm-ellipsis-text' },
    },
    {
      type: 'op',
      width: 160,
      buttons: (row) => {
        const btns: Array<{
          label: string
          variant?: 'softPrimary' | 'softDestructive' | 'ghost'
          hidden?: boolean
          onClick: (r: Record<string, unknown>) => void
        }> = []
        if (row.failedReason) {
          btns.push({
            label: '重试',
            variant: 'softPrimary',
            onClick: (r) => void retryJob(String(r.id)),
          })
        }
        btns.push({
          label: '删除',
          variant: 'softDestructive',
          onClick: (r) => void removeJob(String(r.id)),
        })
        return btns
      },
    },
  ],
})

const Crud = useCrud(
  {
    service: {
      async list() {
        return []
      },
    },
    permission: {
      add: true,
      delete: false,
      update: false,
      info: true,
      page: true,
      list: true,
    },
    async onRefresh(_params, { render }) {
      try {
        render(await fetchJobs())
      } catch (e) {
        console.error(e)
        render([])
      }
    },
  },
  (app) => {
    void app.refresh()
  },
)

useUpsert({
  sync: true,
  async onSubmit(data, { close }) {
    if (upsertScene.value !== 'enqueue') return
    if (enqueueing.value) return
    enqueueing.value = true
    try {
      const delay = Number(data.delay) || 0
      await service.base.queue.enqueue({
        name: String(data.name || '').trim(),
        data: data.data ?? {},
        delay: delay > 0 ? delay : undefined,
      })
      close()
      toast.success('已投递')
      await loadQueues()
      if (selected.value?.name === String(data.name || '').trim()) {
        refreshJobs()
      }
    } catch (e) {
      console.error(e)
      const err = e as Error & { toasted?: boolean }
      if (!err.toasted) toast.error(e instanceof Error ? e.message : '投递失败')
    } finally {
      enqueueing.value = false
    }
  },
})

function refreshJobs() {
  void Crud.value?.refresh()
}

function openJson(value: unknown) {
  upsertScene.value = 'json'
  jsonBody.value = value
  Crud.value?.openUpsert({}, 'info')
}

function openEnqueue() {
  upsertScene.value = 'enqueue'
  Crud.value?.openUpsert(
    {
      name: selected.value?.name || '',
      delay: 0,
      data: {},
    },
    'add',
  )
}

async function loadQueues() {
  if (queuesLoading.value) return
  queuesLoading.value = true
  try {
    const rows = (await service.base.queue.queues()) as QueueRow[]
    queues.value = Array.isArray(rows) ? rows : []
    if (selected.value) {
      const hit = queues.value.find((q) => q.name === selected.value!.name)
      selected.value = hit ?? null
    }
    refreshJobs()
  } catch (e) {
    console.error(e)
  } finally {
    queuesLoading.value = false
  }
}

function selectQueue(q: QueueRow) {
  selected.value = q
  refreshJobs()
}

async function togglePause() {
  if (!selected.value || acting.value) return
  acting.value = true
  try {
    if (selected.value.paused) {
      await service.base.queue.resume({ name: selected.value.name })
      toast.success('已恢复')
    } else {
      await service.base.queue.pause({ name: selected.value.name })
      toast.success('已暂停')
    }
    await loadQueues()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '操作失败')
  } finally {
    acting.value = false
  }
}

async function clean(status: 'completed' | 'failed') {
  if (!selected.value || acting.value) return
  acting.value = true
  try {
    await service.base.queue.clean({
      name: selected.value.name,
      status,
    })
    toast.success(status === 'completed' ? '已清理完成任务' : '已清理失败任务')
    await loadQueues()
    refreshJobs()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '清理失败')
  } finally {
    acting.value = false
  }
}

async function obliterateQueue() {
  if (!selected.value || acting.value) return
  const name = selected.value.name
  const ok = await vmConfirm({
    title: '删除队列',
    message: `确定删除整个队列「${name}」？将清空全部任务且不可恢复。`,
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!ok) return
  acting.value = true
  try {
    await service.base.queue.obliterate({ name })
    selected.value = null
    toast.success('已删除队列')
    await loadQueues()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    acting.value = false
  }
}

async function retryJob(jobId: string) {
  if (!selected.value || acting.value) return
  acting.value = true
  try {
    await service.base.queue.retry({
      name: selected.value.name,
      jobId,
    })
    toast.success('已重试')
    refreshJobs()
    await loadQueues()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '重试失败')
  } finally {
    acting.value = false
  }
}

async function removeJob(jobId: string) {
  if (!selected.value || acting.value) return
  const ok = await vmConfirm({
    title: '删除任务',
    message: `确定删除任务「${jobId}」？`,
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!ok) return
  acting.value = true
  try {
    await service.base.queue.remove({
      name: selected.value.name,
      jobId,
    })
    toast.success('已删除')
    refreshJobs()
    await loadQueues()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    acting.value = false
  }
}

onMounted(() => {
  void loadQueues()
})
</script>

<style lang="scss" scoped>
.vm-queue-page {
  flex: 1;
  min-height: 0;
}

.vm-queue-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.vm-queue-page__aside-inner {
  height: 100%;
  padding: 12px;
}

.vm-queue-page__title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
}

.vm-queue-page__hint {
  margin: 0;
  opacity: 0.65;
  font-size: 13px;
}

.vm-queue-page__empty {
  color: var(--muted-foreground);
}

.vm-queue-json {
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

.vm-queue-json__frame {
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

.vm-queue-json__foot {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.vm-split-layout__main .vm-crud) {
  background: transparent;
}
</style>
