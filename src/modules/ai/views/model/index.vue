<template>
  <vm-crud ref="Crud">
    <vm-row>
      <vm-search />
    </vm-row>
    <vm-row>
      <vm-refresh-btn />
      <vm-toolbar />
    </vm-row>
    <vm-row>
      <vm-table>
        <template #cell-capabilities="{ row }">
          <vm-tag-list
            v-if="asList(row.capabilities).length"
            :model-value="capLabels(row.capabilities)"
          />
          <span v-else class="vm-ai-model__empty">—</span>
        </template>
        <template #cell-resultModes="{ row }">
          <vm-tag-list
            v-if="asList(row.resultModes).length"
            :model-value="modeLabels(row.resultModes)"
          />
          <span v-else class="vm-ai-model__empty">—</span>
        </template>
      </vm-table>
    </vm-row>
    <vm-row>
      <vm-flex />
    </vm-row>
    <vm-row>
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert">
      <template #footer-prepend="{ form }">
        <div class="vm-ai-model__preset-bar">
          <vm-action-btn
            label="chat 模板"
            :loading="schemaApplying === 'chat'"
            @click="applyTemplate(form, 'chat')"
          />
          <vm-action-btn
            label="image 模板"
            :loading="schemaApplying === 'image'"
            @click="applyTemplate(form, 'image')"
          />
          <vm-action-btn
            label="video 模板"
            :loading="schemaApplying === 'video'"
            @click="applyTemplate(form, 'video')"
          />
          <vm-action-btn
            label="audio 模板"
            :loading="schemaApplying === 'audio'"
            @click="applyTemplate(form, 'audio')"
          />
        </div>
        <div
          v-if="schemaHints(form).length"
          class="vm-ai-model__schema-hints"
        >
          <div class="vm-ai-model__schema-hints-title">参数提示预览</div>
          <ul>
            <li v-for="f in schemaHints(form)" :key="f.key">
              <code>{{ f.key }}</code>
              <span class="vm-ai-model__schema-type">{{ f.type }}</span>
              <span v-if="f.required" class="vm-ai-model__schema-req">必填</span>
              <span v-if="f.description" class="vm-ai-model__schema-desc">{{
                f.description
              }}</span>
            </li>
          </ul>
        </div>
      </template>
    </vm-upsert>
  </vm-crud>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'ai-model' })

type AiInputFieldHint = {
  key: string
  type: string
  required?: boolean
  description?: string
}

type AiModelCatalogItem = {
  code: string
  inputSchema?: { fields?: AiInputFieldHint[] } | null
  responseSpec?: Record<string, unknown> | null
}

const { service } = useVome()
const { dict } = useDict()

const providerOptions = ref<Array<{ label: string; value: number }>>([])
const schemaApplying = ref<string | null>(null)
const testingCode = ref<string | null>(null)
const modelCatalog = ref<AiModelCatalogItem[]>([])

async function invokeModelTest(payload: { code: string; capability?: string }) {
  const m = service.ai.model
  if (typeof m.test === 'function') {
    return m.test(payload)
  }
  return m.request({
    url: '/test',
    method: 'POST',
    data: payload,
    timeoutMs: 120_000,
  })
}

async function loadModelCatalog() {
  const m = service.ai.model
  if (typeof m.catalog === 'function') {
    modelCatalog.value = (await m.catalog()) as AiModelCatalogItem[]
    return
  }
  modelCatalog.value = (await m.list({ status: 1 })) as AiModelCatalogItem[]
}

function findInCatalog(code: string) {
  return modelCatalog.value.find((item) => item.code === code)
}

function schemaHints(form: Record<string, unknown>) {
  const raw = form.inputSchema as { fields?: AiInputFieldHint[] } | undefined
  return Array.isArray(raw?.fields) ? raw.fields : []
}

async function applyTemplate(form: Record<string, unknown>, key: string) {
  if (schemaApplying.value) return
  schemaApplying.value = key
  try {
    const res = (await service.ai.model.request({
      url: '/presets',
      method: 'POST',
      data: {},
    })) as {
      inputSchema?: Record<string, { fields?: Array<{ required?: boolean }> }>
      responseSpec?: Record<string, unknown>
    }
    const schema = res?.inputSchema?.[key]
    const spec = res?.responseSpec?.[key]
    if (schema) form.inputSchema = schema
    if (spec) form.responseSpec = spec
    if (!schema && !spec) {
      toast.error(`未找到 ${key} 模板`)
      return
    }
    toast.success(`已写入 ${key} 模板`)
  } catch (e) {
    if (!(e as { toasted?: boolean }).toasted) {
      toast.error(e instanceof Error ? e.message : '写入失败')
    }
  } finally {
    schemaApplying.value = null
  }
}

async function testModel(row: {
  code?: string
  capabilities?: unknown
  inputSchema?: { fields?: Array<{ key: string; description?: string }> }
  responseSpec?: { textPath?: string }
}) {
  const code = String(row.code ?? '').trim()
  if (!code) {
    toast.error('模型编码为空')
    return
  }
  if (testingCode.value) return
  const caps = asList(row.capabilities)
  const capability = caps[0]
  const catalogItem = findInCatalog(code)
  const inputSchema = catalogItem?.inputSchema ?? row.inputSchema
  testingCode.value = code
  try {
    const res = (await invokeModelTest({
      code,
      ...(capability ? { capability } : {}),
    })) as {
      reachable?: boolean
      ok?: boolean
      latencyMs?: number
      error?: string
      message?: string
      result?: { data?: { text?: string } }
    }
    if (res.reachable) {
      const text = res.result?.data?.text?.trim()
      const hint = inputSchema?.fields?.length
        ? ` · ${inputSchema.fields.length} 项参数提示`
        : ''
      toast.success(
        text
          ? `${code} 连通 (${res.latencyMs ?? '—'}ms)${hint}：${text.slice(0, 80)}`
          : `${code} 已接通 (${res.latencyMs ?? '—'}ms)${hint} · ${res.message ?? '上游已返回'}`,
      )
    } else {
      toast.error(res.error ?? res.message ?? `${code} 探测失败`)
    }
  } catch (e) {
    if (!(e as { toasted?: boolean }).toasted) {
      toast.error(e instanceof Error ? e.message : '探测失败')
    }
  } finally {
    testingCode.value = null
  }
}

async function loadProviders() {
  const list = (await service.ai.provider.list({ status: 1 })) as Array<{
    id: number
    vendor: string
  }>
  providerOptions.value = (list ?? []).map((p) => ({
    label: p.vendor,
    value: p.id,
  }))
}

function asList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  return []
}

function labelOf(dictKey: string, value: string) {
  const opts = dict.options(dictKey).value
  return opts.find((o) => String(o.value) === value)?.label ?? value
}

function capLabels(raw: unknown) {
  return asList(raw).map((v) => labelOf('base_ai_capability', v))
}

function modeLabels(raw: unknown) {
  return asList(raw).map((v) => labelOf('base_ai_result_mode', v))
}

function hasAsyncMode(form: Record<string, unknown>) {
  return asList(form.resultModes).includes('async')
}

const Crud = useCrud(
  { service: service.ai.model },
  (app) => {
    void Promise.all([
      loadProviders(),
      loadModelCatalog(),
      dict.refresh([
        'status',
        'base_http_method',
        'base_ai_content_type',
        'base_ai_capability',
        'base_ai_result_mode',
      ]),
    ]).then(() => app.refresh())
  },
)

useUpsert({
  items: [
    {
      prop: 'providerId',
      label: '连接',
      required: true,
      span: 12,
      type: 'select',
      options: computed(() => providerOptions.value),
    },
    {
      prop: 'code',
      label: '模型编码',
      required: true,
      span: 12,
      placeholder: '如 gpt-4o / agnes-2.5-flash',
    },
    {
      prop: 'path',
      label: '请求路径',
      required: true,
      span: 12,
      placeholder: '例:/v1/chat/completions',
    },
    {
      prop: 'method',
      label: '请求方法',
      required: true,
      span: 12,
      type: 'select',
      options: dict.stringOptions('base_http_method'),
      value: 'POST',
    },
    {
      prop: 'contentType',
      label: '请求体类型',
      required: true,
      span: 12,
      type: 'select',
      options: dict.stringOptions('base_ai_content_type'),
      value: 'json',
    },
    {
      prop: 'capabilities',
      label: '能力',
      required: true,
      span: 12,
      type: 'select',
      multiple: true,
      options: dict.stringOptions('base_ai_capability'),
      value: ['chat'],
    },
    {
      prop: 'resultModes',
      label: '结果形态',
      required: true,
      span: 12,
      type: 'select',
      multiple: true,
      options: dict.stringOptions('base_ai_result_mode'),
      value: ['stream'],
    },
    {
      prop: 'status',
      label: '状态',
      span: 12,
      type: 'switch',
      value: 1,
      component: {
        props: { activeValue: 1, inactiveValue: 0 },
      },
    },
    {
      prop: 'asyncSpec',
      label: '异步契约',
      span: 24,
      component: { name: 'vm-json-editor', props: { rows: 8 } },
      placeholder:
        '{"pollPath":"/agnesapi?video_id={id}","idFields":["video_id","task_id","id"],"resultUrlPath":"metadata.url"}',
      hidden: (form) => !hasAsyncMode(form),
    },
    {
      prop: 'inputSchema',
      label: '参数提示',
      span: 12,
      component: { name: 'vm-json-editor', props: { rows: 12 } },
      placeholder:
        '{"fields":[{"key":"messages","type":"array","required":true},{"key":"temperature","type":"number"}]}',
      value: { fields: [] },
    },
    {
      prop: 'responseSpec',
      label: '响应映射',
      span: 12,
      component: { name: 'vm-json-editor', props: { rows: 12 } },
      placeholder:
        '{"textPath":"choices.0.message.content","assetsPath":"data","resultUrlPath":"metadata.url"}',
    },
    { prop: 'remark', label: '备注', type: 'textarea', span: 12 },
  ],
})

useTable({
  columns: [
    { type: 'selection' },
    { prop: 'id', label: 'ID', width: 72 },
    { prop: 'code', label: '编码', minWidth: 120 },
    { prop: 'path', label: '请求路径', minWidth: 180 },
    {
      prop: 'method',
      label: '方法',
      width: 88,
      dict: dict.options('base_http_method'),
    },
    {
      prop: 'contentType',
      label: '请求体',
      width: 100,
      dict: dict.options('base_ai_content_type'),
    },
    {
      prop: 'capabilities',
      label: '能力',
      minWidth: 160,
      slot: 'cell-capabilities',
    },
    {
      prop: 'resultModes',
      label: '结果形态',
      minWidth: 140,
      slot: 'cell-resultModes',
    },
    {
      prop: 'status',
      label: '状态',
      width: 88,
      component: {
        name: 'vm-switch',
        props: { activeValue: 1, inactiveValue: 0 },
      },
    },
    { prop: 'createTime', label: '创建时间', width: 170 },
    {
      type: 'op',
      width: 200,
      buttons: (row) => {
        const code = String((row as { code?: string }).code ?? '')
        const busy = testingCode.value === code
        return [
          {
            label: busy ? '测试中…' : '测试',
            hidden: service.ai.model._permission?.test === false,
            disabled: busy,
            onClick: () => testModel(row as Parameters<typeof testModel>[0]),
          },
          'edit',
          'delete',
        ]
      },
    },
  ],
})
</script>

<style lang="scss" scoped>
.vm-ai-model__empty {
  color: var(--muted-foreground);
}

.vm-ai-model__preset-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-right: auto;
}

.vm-ai-model__schema-hints {
  flex: 1 1 100%;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
  background: color-mix(in srgb, var(--muted) 40%, transparent);
  font-size: 12px;
}

.vm-ai-model__schema-hints-title {
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--foreground);
}

.vm-ai-model__schema-hints ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vm-ai-model__schema-hints li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
}

.vm-ai-model__schema-type {
  color: var(--muted-foreground);
}

.vm-ai-model__schema-req {
  color: var(--destructive);
}

.vm-ai-model__schema-desc {
  color: var(--muted-foreground);
}

:deep(.vm-crud-upsert__field .vm-crud-upsert__json-field .vm-json-editor__input) {
  min-height: 260px;
}
</style>
