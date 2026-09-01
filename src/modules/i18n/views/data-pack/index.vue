<template>
  <vm-crud ref="Crud">
    <vm-row>
      <vm-search />
    </vm-row>
    <vm-row>
      <vm-refresh-btn />
      <vm-toolbar>
        <vm-action-btn
          icon="ri-translate-2"
          label="AI 翻译"
          :loading="translating"
          :disabled="translating"
          @click="openTranslate"
        />
      </vm-toolbar>
    </vm-row>
    <vm-row>
      <vm-table />
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert" />

    <vm-dialog v-model="translateOpen" title="业务表 AI 翻译" width="480px">
      <div class="vm-i18n-data-pack__form">
        <label class="vm-i18n-data-pack__field">
          <span>业务表</span>
          <vm-select
            v-model="translateForm.tableName"
            :options="tableOptions"
            placeholder="选择已配置字段的表"
            width="100%"
          />
        </label>
        <label class="vm-i18n-data-pack__field">
          <span>目标语种</span>
          <vm-select
            v-model="translateForm.langCode"
            :options="langOptions"
            placeholder="选择语种"
            width="100%"
          />
        </label>
        <label class="vm-i18n-data-pack__field">
          <span>模式</span>
          <vm-select
            v-model="translateForm.mode"
            :options="modeOptions"
            width="100%"
          />
        </label>
      </div>
      <template #footer>
        <vm-button @click="translateOpen = false">取消</vm-button>
        <vm-button
          type="primary"
          :loading="translating"
          :disabled="translating"
          @click="runTranslate"
        >
          开始翻译
        </vm-button>
      </template>
    </vm-dialog>
  </vm-crud>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import { isAiStreamResult } from '@core/admin/api/client'

defineOptions({ name: 'i18n-data-pack' })

const { service } = useVome()

const translating = ref(false)
const translateOpen = ref(false)
const tableOptions = ref<Array<{ label: string; value: string }>>([])
const langOptions = ref<Array<{ label: string; value: string }>>([])

const translateForm = reactive({
  tableName: '',
  langCode: 'en-US',
  mode: 'incremental',
})

const modeOptions = [
  { label: '增量翻译', value: 'incremental' },
  { label: '全量覆盖', value: 'full' },
]

const Crud = useCrud(
  { service: service.i18n.dataPack },
  (app) => {
    app.refresh()
    void loadTables()
    void loadLangs()
  },
)

useUpsert({
  items: [
    {
      prop: 'tableName',
      label: '业务表',
      required: true,
      span: 12,
    },
    {
      prop: 'langCode',
      label: '语种',
      required: true,
      span: 12,
    },
    {
      prop: 'packJson',
      label: '翻译包',
      span: 24,
      value: {},
      component: {
        name: 'vm-json-editor',
        props: { height: 360 },
      },
    },
    {
      prop: 'remark',
      label: '备注',
      span: 24,
      type: 'textarea',
    },
  ],
})

useTable({
  columns: [
    { prop: 'tableName', label: '业务表', minWidth: 140 },
    { prop: 'langCode', label: '语种', width: 100 },
    { prop: 'version', label: '版本', width: 80 },
    { prop: 'sourceHash', label: '源哈希', minWidth: 120 },
    { prop: 'remark', label: '备注', minWidth: 160 },
  ],
})

async function loadTables() {
  try {
    const list = (await service.i18n.dataPack.tables()) as string[]
    tableOptions.value = (list || []).map((t) => ({ label: t, value: t }))
    if (!translateForm.tableName && tableOptions.value[0]) {
      translateForm.tableName = tableOptions.value[0].value
    }
  } catch {
    tableOptions.value = []
  }
}

async function loadLangs() {
  try {
    const rows = (await service.i18n.lang.list({ status: 1 })) as Array<{
      code?: string
      name?: string
    }>
    langOptions.value = (rows || [])
      .filter((r) => r.code && r.code !== 'zh-CN')
      .map((r) => ({
        label: `${r.name || r.code} (${r.code})`,
        value: String(r.code),
      }))
  } catch {
    langOptions.value = [{ label: 'en-US', value: 'en-US' }]
  }
}

function openTranslate() {
  translateOpen.value = true
}

async function runTranslate() {
  if (!translateForm.tableName) {
    toast.error('请选择业务表')
    return
  }
  if (!translateForm.langCode || translateForm.langCode === 'zh-CN') {
    toast.error('请选择非中文目标语种')
    return
  }
  translating.value = true
  try {
    const langName =
      langOptions.value.find((o) => o.value === translateForm.langCode)
        ?.label || translateForm.langCode
    const out = await service.i18n.dataPack.translateTable({
      tableName: translateForm.tableName,
      langCode: translateForm.langCode,
      langName,
      mode: translateForm.mode as 'full' | 'incremental',
    })
    let skipped = false
    let message = ''
    let rowCount = 0
    if (isAiStreamResult(out)) {
      for await (const chunk of out.stream) {
        if (chunk.type === 'error') {
          throw new Error(chunk.error?.message || 'AI 翻译失败')
        }
        if (chunk.type === 'done') {
          skipped = Boolean(chunk.data?.skipped)
          message = String(chunk.data?.message || '')
          rowCount = Number(chunk.data?.rowCount ?? 0)
        }
      }
    } else {
      const res = out as {
        skipped?: boolean
        message?: string
        rowCount?: number
      }
      skipped = Boolean(res?.skipped)
      message = String(res?.message || '')
      rowCount = Number(res?.rowCount ?? 0)
    }
    if (skipped) {
      toast.message(message || '已跳过')
    } else {
      toast.success(`翻译完成，共 ${rowCount} 条`)
    }
    translateOpen.value = false
    Crud.value?.refresh()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : '翻译失败')
  } finally {
    translating.value = false
  }
}
</script>

<style scoped lang="scss">
.vm-i18n-data-pack__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vm-i18n-data-pack__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--vm-text-secondary);
}
</style>
