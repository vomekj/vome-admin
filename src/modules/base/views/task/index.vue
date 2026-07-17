<template>
  <div class="vm-task-page">
    <div class="vm-task-page__body vm-scroll">
      <div v-if="!listReady" class="vm-task-page__loading">加载中…</div>
      <vm-card-grid v-else min-width="240px" gap="12px">
        <vm-card add bordered @click="openCreate">
          <template #toolbar>
            <vm-icon-btn
              icon="ri-refresh-line"
              title="刷新"
              :loading="loading"
              :disabled="loading"
              @click.stop="loadList"
            />
          </template>
          <i class="ri-add-line" />
          <span>添加计划任务</span>
        </vm-card>

        <vm-card v-for="item in list" :key="item.id" bordered>
          <vm-card-title
            clickable
            :title="item.name"
            @click="openEdit(item)"
          >
            {{ item.name }}
          </vm-card-title>
          <vm-kv-row label="执行服务" :model-value="serviceLabel(item)" />
          <vm-kv-row label="定时规则" :model-value="ruleLabel(item)" />

          <template #footer>
            <div class="vm-task-page__ops">
              <vm-icon-btn
                icon="ri-play-line"
                title="立即执行"
                :disabled="busyId === item.id"
                @click="runOnce(item)"
              />
              <vm-icon-btn
                icon="ri-edit-line"
                title="编辑"
                :disabled="busyId === item.id"
                @click="openEdit(item)"
              />
            </div>

            <vm-status-tag
              preset="task"
              :model-value="item.status"
              clickable
              :disabled="busyId === item.id"
              @click="toggleStatus(item)"
            />

            <div class="vm-task-page__ops">
              <vm-icon-btn
                icon="ri-file-list-3-line"
                title="执行记录"
                :disabled="busyId === item.id"
                @click="openLogs(item)"
              />
              <vm-icon-btn
                icon="ri-delete-bin-line"
                title="删除"
                variant="danger"
                :disabled="busyId === item.id"
                @click="removeTask(item)"
              />
            </div>
          </template>
        </vm-card>
      </vm-card-grid>
    </div>

    <vm-crud
      ref="HostCrud"
      class="vm-task-upsert-host"
      :service="taskApi"
      :immediate="false"
    >
      <vm-upsert
        ref="Upsert"
        :title="upsertTitle"
        :items="upsertItems"
        :confirm="upsertConfirm"
        :height="upsertHeight"
        :layout="upsertLayout"
      >
        <template v-if="upsertScene === 'form'" #default="{ form }">
          <div
            v-if="form.taskType === 'once'"
            class="vm-crud-upsert__field"
            style="grid-column: span 12"
          >
            <Label class="vm-crud-upsert__label">
              开始时间 <span class="vm-crud-upsert__req">*</span>
            </Label>
            <vm-datetime-picker
              :model-value="String(form.startDateLocal ?? '')"
              width="100%"
              :refresh-on-change="false"
              @update:model-value="
                HostCrud?.patchUpsertForm({
                  startDateLocal: toPickerLocal($event),
                })
              "
            />
          </div>
        </template>
        <template v-else #default>
          <vm-crud
            ref="LogsCrud"
            class="vm-task-logs-crud"
            :service="logsService"
            :immediate="false"
          >
            <vm-row>
              <vm-refresh-btn />
              <span class="vm-task-logs__filter-label">状态</span>
              <vm-select
                v-model="logsStatusFilter"
                :options="logsStatusOptions"
                :refresh-on-change="false"
                width="120px"
                placeholder="全部"
                @change="onLogsStatusChange"
              />
            </vm-row>
            <vm-row>
              <vm-table ref="LogsTable" />
            </vm-row>
            <vm-row>
              <vm-flex />
              <vm-pagination />
            </vm-row>
          </vm-crud>
        </template>
      </vm-upsert>
    </vm-crud>
  </div>
</template>

<script setup lang="ts">

defineOptions({ name: 'base-task' })

type TaskRow = {
  id?: number
  name?: string
  service?: string
  method?: string
  params?: string | null
  taskType?: string
  cron?: string | null
  startDate?: string | null
  status?: number
  remark?: string | null
}

type TaskLogRow = {
  id?: number
  detail?: string | null
  status?: number
  createTime?: string | Date | null
}

const { service } = useVome()
const taskApi = service.base.task

const list = ref<TaskRow[]>([])
const listReady = ref(false)
const loading = ref(false)
const busyId = ref<number | null>(null)

const upsertScene = ref<'form' | 'logs'>('form')
const upsertTitle = ref('添加计划任务')
const upsertConfirm = computed(() => upsertScene.value === 'form')
const upsertHeight = computed(() =>
  upsertScene.value === 'logs' ? 800 : undefined,
)
const upsertLayout = computed(() =>
  upsertScene.value === 'logs' ? 'fill' : 'form',
)

const formItems: CrudFormItem[] = [
  { prop: 'name', label: '名称', required: true, span: 12, placeholder: '请输入名称' },
  {
    prop: 'taskType',
    label: '类型',
    type: 'radio',
    required: true,
    span: 12,
    value: 'cron',
    options: [
      { label: 'cron', value: 'cron' },
      { label: '定时一次', value: 'once' },
    ],
  },
  {
    prop: 'cron',
    label: 'cron',
    required: true,
    span: 12,
    placeholder: '* * * * * *',
    hidden: (f) => f.taskType !== 'cron',
  },
  {
    prop: 'service',
    label: '服务类',
    required: true,
    span: 12,
    placeholder: '服务类名',
  },
  {
    prop: 'method',
    label: '方法',
    required: true,
    span: 12,
    placeholder: '方法名',
  },
  {
    prop: 'params',
    label: '参数 JSON',
    component: { name: 'vm-json-editor', props: { rows: 6 } },
    span: 12,
    placeholder: '如 [1, 2] 或 {"a":1}',
  },
  {
    prop: 'remark',
    label: '备注',
    type: 'textarea',
    span: 12,
    placeholder: '请输入',
  },
]

const upsertItems = computed(() =>
  upsertScene.value === 'form' ? formItems : [],
)

const HostCrud = useCrud({
  service: taskApi,
  permission: {
    add: true,
    update: true,
    delete: false,
    info: true,
    page: false,
    list: false,
  },
})

useUpsert({
  sync: true,
  async onSubmit(data, { close }) {
    if (upsertScene.value !== 'form') return
    const taskType = data.taskType === 'once' ? 'once' : 'cron'
    if (taskType === 'once' && !String(data.startDateLocal || '').trim()) {
      toast.error('请选择开始时间')
      return
    }
    const paramsRaw = textOfTaskParams(data.params)
    if (paramsRaw) {
      try {
        JSON.parse(paramsRaw)
      } catch {
        toast.error('参数必须是合法 JSON')
        return
      }
    }
    const payload = {
      name: String(data.name || '').trim(),
      service: String(data.service || '').trim(),
      method: String(data.method || '').trim(),
      taskType,
      cron: taskType === 'cron' ? String(data.cron || '').trim() : null,
      startDate:
        taskType === 'once'
          ? fromLocalInput(String(data.startDateLocal || ''))
          : null,
      params: paramsRaw || null,
      remark: String(data.remark || '').trim() || null,
    }
    if (data.id != null) {
      await taskApi.update({ ...payload, id: data.id })
      toast.success('已保存')
    } else {
      await taskApi.add({ ...payload, status: 0 })
      toast.success('已添加')
    }
    close()
    await loadList()
  },
})

const logsTaskId = ref<number | null>(null)
const logsStatusFilter = ref<string | number>('all')

const logsStatusDict = [
  { label: '成功', value: 1, type: 'success' },
  { label: '失败', value: 0, type: 'danger' },
]

const logsStatusOptions = [
  { label: '全部', value: 'all' },
  ...logsStatusDict,
]

const LogsTable = useTable({
  autoHeight: false,
  columns: [
    { type: 'index', label: '#', width: 56 },
    { prop: 'detail', label: '描述', minWidth: 200, showOverflowTooltip: true },
    { prop: 'status', label: '执行状态', minWidth: 120, dict: logsStatusDict },
    { prop: 'createTime', label: '执行时间', minWidth: 170 },
  ],
})

async function fetchTaskLogs(data: Record<string, unknown> = {}) {
  if (logsTaskId.value == null) {
    return { list: [] as TaskLogRow[], pagination: { page: 1, size: 20, total: 0 } }
  }
  const params: Record<string, unknown> = {
    ...data,
    id: logsTaskId.value,
  }
  if (
    params.status === 'all' ||
    params.status === '' ||
    params.status === undefined ||
    params.status === null
  ) {
    delete params.status
  }
  const api = taskApi as typeof taskApi & {
    log?: (data?: Record<string, unknown>) => Promise<unknown>
  }
  return (await (typeof api.log === 'function'
    ? api.log(params)
    : taskApi.request({ url: '/log', method: 'GET', params }))) as {
    list: TaskLogRow[]
    pagination: { page: number; size: number; total: number }
  }
}

const logsService = {
  page: fetchTaskLogs,
}

const LogsCrud = ref<{ setParams: (p: Record<string, unknown>) => void }>()

function openLogs(item: TaskRow) {
  if (item.id == null) return
  logsTaskId.value = item.id
  upsertScene.value = 'logs'
  upsertTitle.value = `日志列表（${item.name || item.id}）`
  logsStatusFilter.value = 'all'
  HostCrud.value?.openUpsert({}, 'info')
  nextTick(() => {
    LogsCrud.value?.setParams({ status: undefined })
  })
}

function onLogsStatusChange(v: string | number | boolean) {
  const status = v === 'all' || v === '' ? undefined : Number(v)
  LogsCrud.value?.setParams({ status })
}

function serviceLabel(item: TaskRow) {
  const s = String(item.service || '')
  const m = String(item.method || '')
  if (!s && !m) return '—'
  return `${s}.${m}()`
}

function ruleLabel(item: TaskRow) {
  if (item.taskType === 'once') {
    return item.startDate ? `定时一次 · ${formatTime(item.startDate)}` : '定时一次（未设时间）'
  }
  return item.cron || '—'
}

function formatTime(v: string) {
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toPickerLocal(v: string) {
  if (!v) return ''
  if (v.includes('T')) return v.slice(0, 16)
  return v.replace(' ', 'T').slice(0, 16)
}

function textOfTaskParams(v: unknown) {
  if (v == null || v === '') return ''
  if (typeof v === 'string') return v.trim()
  try {
    return JSON.stringify(v)
  } catch {
    return String(v).trim()
  }
}

function fromLocalInput(local: string) {
  if (!local) return null
  const normalized = local.includes('T')
    ? local.slice(0, 16)
    : local.replace(' ', 'T').slice(0, 16)
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function openCreate() {
  upsertScene.value = 'form'
  upsertTitle.value = '添加计划任务'
  HostCrud.value?.openUpsert(
    {
      name: '',
      taskType: 'cron',
      cron: '',
      startDateLocal: '',
      service: '',
      method: '',
      params: '',
      remark: '',
    },
    'add',
  )
}

function parseTaskParams(raw: unknown) {
  if (raw == null || raw === '') return null
  if (typeof raw === 'object') return raw
  const s = String(raw).trim()
  if (!s) return null
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

function openEdit(item: TaskRow) {
  upsertScene.value = 'form'
  upsertTitle.value = '编辑计划任务'
  HostCrud.value?.openUpsert(
    {
      id: item.id,
      name: String(item.name || ''),
      taskType: item.taskType === 'once' ? 'once' : 'cron',
      cron: String(item.cron || ''),
      startDateLocal: toLocalInput(item.startDate),
      service: String(item.service || ''),
      method: String(item.method || ''),
      params: parseTaskParams(item.params),
      remark: item.remark == null ? '' : String(item.remark),
    },
    'update',
  )
}

async function loadList() {
  if (loading.value) return
  loading.value = true
  try {
    const rows = (await taskApi.list({})) as TaskRow[]
    list.value = Array.isArray(rows) ? rows : []
  } catch (e) {
    console.error(e)
    list.value = []
  } finally {
    loading.value = false
    listReady.value = true
  }
}

async function toggleStatus(item: TaskRow) {
  if (item.id == null || busyId.value === item.id) return
  busyId.value = item.id
  try {
    if (Number(item.status) === 1) {
      await taskApi.stop({ id: item.id })
      toast.success('已停止')
    } else {
      await taskApi.start({ id: item.id })
      toast.success('已启动')
    }
    await loadList()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '操作失败')
  } finally {
    busyId.value = null
  }
}

async function runOnce(item: TaskRow) {
  if (item.id == null || busyId.value === item.id) return
  busyId.value = item.id
  try {
    await taskApi.once({ id: item.id })
    toast.success('已触发执行')
    await loadList()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '执行失败')
  } finally {
    busyId.value = null
  }
}

async function removeTask(item: TaskRow) {
  if (item.id == null || busyId.value === item.id) return
  const ok = await vmConfirm({
    title: '删除任务',
    message: `确定删除「${item.name}」？`,
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!ok) return
  busyId.value = item.id
  try {
    await taskApi.delete({ ids: [item.id] })
    toast.success('已删除')
    await loadList()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    busyId.value = null
  }
}

onMounted(() => {
  void loadList()
})
</script>

<style lang="scss" scoped>
.vm-task-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 4px;
}

.vm-task-page__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.vm-task-page__loading {
  display: flex;
  min-height: 280px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: var(--card);
  box-shadow: var(--shadow-soft);
  color: var(--muted-foreground);
  font-size: 13px;
}

.vm-task-page__ops {
  display: inline-flex;
  gap: 2px;
}

.vm-task-upsert-host {
  display: none !important;
}

.vm-task-logs-crud {
  flex: 1 1 auto;
  min-height: 0;
  padding: 12px 16px !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.vm-task-logs__filter-label {
  color: var(--muted-foreground);
  font-size: 13px;
}
</style>
