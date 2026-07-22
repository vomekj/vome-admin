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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'ai-model' })

const { service } = useVome()
const { dict } = useDict()

const providerOptions = ref<Array<{ label: string; value: number }>>([])

async function loadProviders() {
  const list = (await service.ai.provider.list({ status: 1 })) as Array<{
    id: number
    name: string
  }>
  providerOptions.value = (list ?? []).map((p) => ({
    label: p.name,
    value: p.id,
  }))
}

function asList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  return []
}

function labelOf(dictKey: string, value: string) {
  const opts = dict.options(dictKey) as Array<{ label: string; value: string }>
  return opts.find((o) => String(o.value) === value)?.label ?? value
}

function capLabels(raw: unknown) {
  return asList(raw).map((v) => labelOf('base_ai_capability', v))
}

function modeLabels(raw: unknown) {
  return asList(raw).map((v) => labelOf('base_ai_result_mode', v))
}

useSearch({
  items: [
    {
      prop: 'keyWord',
      label: '关键字',
      placeholder: '编码 / 名称 / 上游ID',
      type: 'input',
    },
    {
      prop: 'providerId',
      label: '连接',
      type: 'select',
      options: computed(() => providerOptions.value),
    },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      dict: 'status',
    },
  ],
})

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
    { prop: 'code', label: '模型编码', required: true, span: 12, placeholder: '租户内唯一，如 gpt-4o' },
    { prop: 'name', label: '名称', required: true, span: 12 },
    {
      prop: 'upstreamId',
      label: '上游模型 ID',
      required: true,
      span: 12,
      placeholder: '调用上游时的 model 字段',
    },
    {
      prop: 'capabilities',
      label: '能力',
      required: true,
      span: 12,
      type: 'select',
      multiple: true,
      options: computed(() => dict.stringOptions('base_ai_capability')),
      value: ['chat'],
    },
    {
      prop: 'resultModes',
      label: '结果形态',
      required: true,
      span: 12,
      type: 'select',
      multiple: true,
      options: computed(() => dict.stringOptions('base_ai_result_mode')),
      value: ['sync', 'stream'],
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
      prop: 'paths',
      label: '路径覆盖',
      span: 24,
      placeholder:
        '可选。不配则用 OpenAI 默认。键：chat/image/audio_tts/audio_stt/embed/video/videoGet/videoContent；含 {id} 可替换',
      component: { name: 'vm-json-editor' },
    },
    {
      prop: 'defaults',
      label: '默认参数',
      span: 24,
      placeholder:
        '可选 JSON。如 temperature；timeoutMs 覆盖该模型上游超时（毫秒）',
      component: { name: 'vm-json-editor' },
    },
    { prop: 'remark', label: '备注', type: 'textarea', span: 24 },
  ],
})

useTable({
  columns: [
    { type: 'selection' },
    { type: 'index', label: '#', width: 56 },
    { prop: 'code', label: '编码', minWidth: 120 },
    { prop: 'name', label: '名称', minWidth: 120 },
    { prop: 'upstreamId', label: '上游ID', minWidth: 140 },
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
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})

useCrud(
  { service: service.ai.model },
  (app) => {
    void Promise.all([
      loadProviders(),
      dict.refresh([
        'status',
        'base_ai_capability',
        'base_ai_result_mode',
      ]),
    ]).then(() => app.refresh())
  },
)
</script>

<style lang="scss" scoped>
.vm-ai-model__empty {
  color: var(--muted-foreground);
}
</style>
