<template>
  <vm-crud ref="Crud">
    <vm-row>
      <vm-search />
    </vm-row>
    <vm-row>
      <vm-refresh-btn />
      <vm-toolbar :show-add="false" :show-delete="false" />
    </vm-row>
    <vm-row>
      <vm-table>
        <template #cell-capability="{ row }">
          <vm-tag-list
            v-if="row.capability"
            :model-value="[labelOf('base_ai_capability', String(row.capability))]"
          />
        </template>
        <template #cell-mode="{ row }">
          <vm-tag-list
            v-if="row.mode"
            :model-value="[labelOf('base_ai_result_mode', String(row.mode))]"
          />
        </template>
        <template #cell-status="{ row }">
          <vm-tag-list
            v-if="row.status"
            :model-value="[labelOf('base_ai_async_status', String(row.status))]"
          />
          <span v-else class="vm-ai-call-log__empty">—</span>
        </template>
        <template #cell-source="{ row }">
          <vm-tag-list
            v-if="row.source"
            :model-value="[labelOf('base_ai_invoke_source', String(row.source))]"
          />
        </template>
        <template #cell-ok="{ row }">
          {{ row.ok === 1 ? '是' : '否' }}
        </template>
        <template #cell-request="{ value }">
          <div v-if="hasJsonContent(value)" class="vm-ai-call-log__json-cell">
            <vm-text-link label="查看" @click="openJson('请求参数', value)" />
            <vm-copy-btn
              size="sm"
              label="复制"
              :text="prettyJson(value)"
              @copied="toast.success('已复制')"
              @error="toast.error('复制失败')"
            />
          </div>
          <span v-else class="vm-ai-call-log__empty">—</span>
        </template>
        <template #cell-result="{ value }">
          <div v-if="hasJsonContent(value)" class="vm-ai-call-log__json-cell">
            <vm-text-link label="查看" @click="openJson('响应结果', value)" />
            <vm-copy-btn
              size="sm"
              label="复制"
              :text="prettyJson(value)"
              @copied="toast.success('已复制')"
              @error="toast.error('复制失败')"
            />
          </div>
          <span v-else class="vm-ai-call-log__empty">—</span>
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
        <div class="vm-ai-call-log__json">
          <div class="vm-ai-call-log__json-frame">
            <vm-json-code :model-value="jsonBody" />
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <div class="vm-ai-call-log__json-foot">
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
import { computed, ref } from 'vue'
import { hasJsonContent, prettyJson } from '/@/lib/json'

defineOptions({ name: 'ai-call-log' })

const { service } = useVome()
const { dict } = useDict()

const jsonTitle = ref('JSON')
const jsonBody = ref<unknown>(null)
const jsonText = computed(() => prettyJson(jsonBody.value))

const Crud = useCrud(
  { service: service.ai.callLog },
  (app) => {
    void dict
      .refresh([
        'base_ai_capability',
        'base_ai_result_mode',
        'base_ai_async_status',
        'base_ai_invoke_source',
      ])
      .then(() => app.refresh())
  },
)

function labelOf(dictKey: string, value: string) {
  const opts = dict.options(dictKey).value
  return opts.find((o) => String(o.value) === value)?.label ?? value
}

function openJson(title: string, value: unknown) {
  jsonTitle.value = title
  jsonBody.value = value
  Crud.value?.openUpsert({}, 'info')
}

useTable({
  columns: [
    { prop: 'id', label: 'ID', width: 72 },
    { prop: 'recordKey', label: '任务号', minWidth: 168 },
    { prop: 'modelCode', label: '模型', minWidth: 120 },
    {
      prop: 'capability',
      label: '能力',
      width: 96,
      slot: 'cell-capability',
    },
    {
      prop: 'mode',
      label: '形态',
      width: 88,
      slot: 'cell-mode',
    },
    {
      prop: 'status',
      label: '任务状态',
      width: 104,
      slot: 'cell-status',
    },
    { prop: 'ok', label: '成功', width: 72, slot: 'cell-ok' },
    { prop: 'latencyMs', label: '耗时ms', width: 88 },
    { prop: 'totalTokens', label: 'Token', width: 88 },
    {
      prop: 'source',
      label: '来源',
      width: 96,
      slot: 'cell-source',
    },
    {
      prop: 'request',
      label: '请求参数',
      minWidth: 140,
      slot: 'cell-request',
    },
    {
      prop: 'result',
      label: '响应结果',
      minWidth: 140,
      slot: 'cell-result',
    },
    { prop: 'createTime', label: '时间', width: 170 },
  ],
})
</script>

<style lang="scss" scoped>
.vm-ai-call-log__empty {
  color: var(--muted-foreground);
}

.vm-ai-call-log__json-cell {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.vm-ai-call-log__json {
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

.vm-ai-call-log__json-frame {
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

.vm-ai-call-log__json-foot {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  gap: 8px;
}
</style>
