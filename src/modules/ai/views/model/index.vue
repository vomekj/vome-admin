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
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert" />
  </vm-crud>

  <Dialog :open="testing">
    <DialogContent
      :show-close-button="false"
      class="vm-ai-model__test-dialog"
      @pointer-down-outside.prevent
      @focus-outside.prevent
      @interact-outside.prevent
      @escape-key-down.prevent
    >
      <DialogTitle class="sr-only">正在测试中</DialogTitle>
      <div class="vm-ai-model__test-body" role="status" aria-live="polite">
        <i class="ri-loader-4-line is-spin" aria-hidden="true" />
        <p>正在测试中</p>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'ai-model' })

const { service } = useVome()
const { dict } = useDict()

const providerOptions = ref<Array<{ label: string; value: number }>>([])
const testing = ref(false)

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

async function testModel(row: { code?: string; capabilities?: unknown }) {
  const code = String(row.code ?? '').trim()
  if (!code) {
    toast.error('模型编码为空')
    return
  }
  if (testing.value) return
  const caps = asList(row.capabilities)
  const capability = caps[0]
  testing.value = true
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
      toast.success(
        text
          ? `${code} 连通 (${res.latencyMs ?? '—'}ms)：${text.slice(0, 80)}`
          : `${code} 已接通 (${res.latencyMs ?? '—'}ms) · ${res.message ?? '上游已返回'}`,
      )
    } else {
      toast.error(res.error ?? res.message ?? `${code} 探测失败`)
    }
  } catch (e) {
    if (!(e as { toasted?: boolean }).toasted) {
      toast.error(e instanceof Error ? e.message : '探测失败')
    }
  } finally {
    testing.value = false
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
      span: 12,
      component: { name: 'vm-json-editor', props: { rows: 10 } },
      placeholder:
        '{"pollPath":"/agnesapi?video_id={id}","idFields":["video_id","task_id","id"],"resultUrlPath":"metadata.url"}',
      hidden: (form) => !hasAsyncMode(form),
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
      buttons: (row) => [
        {
          label: '测试',
          hidden: service.ai.model._permission?.test === false,
          onClick: () => testModel(row as Parameters<typeof testModel>[0]),
        },
        'edit',
        'delete',
      ],
    },
  ],
})
</script>

<style lang="scss" scoped>
.vm-ai-model__empty {
  color: var(--muted-foreground);
}
</style>

<!-- Dialog 经 Portal 挂到 body，需非 scoped 才能命中 -->
<style lang="scss">
.vm-ai-model__test-dialog[data-slot='dialog-content'] {
  width: auto !important;
  max-width: none !important;
  min-width: 0 !important;
  padding: 24px 32px !important;
}

.vm-ai-model__test-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--foreground);

  p {
    margin: 0;
    font-size: 14px;
  }

  i {
    font-size: 28px;
    color: var(--primary);
  }

  i.is-spin {
    animation: vm-ai-model-spin 0.8s linear infinite;
  }
}

@keyframes vm-ai-model-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
