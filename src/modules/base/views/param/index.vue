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
        <template #cell-data="{ row, value }">
          <span
            v-if="Number(row.type) === 2 && value"
            class="base-param-data-file"
            :title="String(value)"
          >
            {{ fileName(value) }}
          </span>
          <span
            v-else
            class="base-param-data-text"
            :title="plainData(value)"
          >
            {{ plainData(value) || '—' }}
          </span>
        </template>
      </vm-table>
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert">
      <template #default="{ form }">
        <div class="vm-crud-upsert__field" style="grid-column: span 24">
          <div class="base-param-data-label">
            <Label class="vm-crud-upsert__label">
              数据
              <span class="vm-crud-upsert__req">*</span>
            </Label>
            <button
              v-if="Number(form.type) === 3"
              type="button"
              class="base-param-json-add"
              title="新增键值对"
              @click="addJsonRoot"
            >
              <i class="ri-add-line" aria-hidden="true" />
              新增键值对
            </button>
          </div>
          <textarea
            v-if="Number(form.type) === 0"
            class="vm-crud-upsert__textarea"
            :value="String(form.data ?? '')"
            placeholder="请输入"
            @input="
              Crud?.patchUpsertForm({
                data: ($event.target as HTMLTextAreaElement).value,
              })
            "
          />
          <vm-richtext
            v-else-if="Number(form.type) === 1"
            class="base-param-richtext"
            :model-value="String(form.data ?? '')"
            placeholder="请输入富文本"
            :height="300"
            upload-prefix-path="app/public/param"
            @update:model-value="(v) => Crud?.patchUpsertForm({ data: v })"
          />
          <vm-upload
            v-else-if="Number(form.type) === 2"
            class="vm-crud-upsert__upload-field"
            :model-value="String(form.data ?? '')"
            type="image"
            text="上传文件"
            :size="96"
            :limit="1"
            :limit-size="20"
            prefix-path="app/public/param"
            @update:model-value="(v) => Crud?.patchUpsertForm({ data: v })"
          />
          <vm-json-kv-editor
            v-else-if="Number(form.type) === 3"
            :model-value="jsonNodes"
            :kind-options="dict.options('base_json_value_kind').value"
            @update:model-value="onJsonNodesChange"
          />
        </div>
      </template>
    </vm-upsert>
  </vm-crud>
</template>

<script setup lang="ts">
import type { JsonKvNode } from 'vome-core/admin/crud'

defineOptions({ name: 'base-param' })

const { service } = useVome()
const { dict } = useDict()

const jsonNodes = ref<JsonKvNode[]>([createEmptyNode()])

function newUid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function createEmptyNode(): JsonKvNode {
  return {
    uid: newUid(),
    key: '',
    valueKind: 'string',
    stringValue: '',
    openToApp: false,
    children: [],
  }
}

function parseOpenPathSet(raw: unknown): Set<string> {
  if (Array.isArray(raw)) {
    return new Set(raw.map((v) => String(v ?? '').trim()).filter(Boolean))
  }
  const text = String(raw ?? '').trim()
  if (!text) return new Set()
  try {
    const parsed = JSON.parse(text) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((v) => String(v ?? '').trim()).filter(Boolean))
  } catch {
    return new Set()
  }
}

function parseJsonNodes(raw: unknown, openRaw?: unknown): JsonKvNode[] {
  const openPaths = parseOpenPathSet(openRaw)
  const text = String(raw ?? '').trim()
  if (!text) return [createEmptyNode()]
  try {
    const parsed = JSON.parse(text) as unknown
    if (
      parsed == null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return [createEmptyNode()]
    }
    const entries = Object.entries(parsed as Record<string, unknown>)
    if (!entries.length) return [createEmptyNode()]
    return entries.map(([key, value]) => valueToNode(key, value, openPaths))
  } catch {
    return [createEmptyNode()]
  }
}

function valueToNode(
  key: string,
  value: unknown,
  openPaths: Set<string>,
  prefix = '',
): JsonKvNode {
  const path = prefix ? `${prefix}.${key}` : key
  const openToApp = openPaths.has(path)
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    const children = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => valueToNode(k, v, openPaths, path),
    )
    return {
      uid: newUid(),
      key,
      valueKind: 'object',
      stringValue: '',
      openToApp,
      children: children.length ? children : [createEmptyNode()],
    }
  }
  if (typeof value === 'number') {
    return {
      uid: newUid(),
      key,
      valueKind: 'number',
      stringValue: String(value),
      openToApp,
      children: [],
    }
  }
  if (typeof value === 'boolean') {
    return {
      uid: newUid(),
      key,
      valueKind: 'boolean',
      stringValue: value ? 'true' : 'false',
      openToApp,
      children: [],
    }
  }
  const text = value == null ? '' : String(value)
  if (
    typeof value === 'string' &&
    /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text.trim())
  ) {
    return {
      uid: newUid(),
      key,
      valueKind: 'number',
      stringValue: text.trim(),
      openToApp,
      children: [],
    }
  }
  return {
    uid: newUid(),
    key,
    valueKind: 'string',
    stringValue: text,
    openToApp,
    children: [],
  }
}

function leafValue(node: JsonKvNode): unknown {
  if (node.valueKind === 'number') {
    const n = Number(String(node.stringValue).trim())
    return Number.isFinite(n) ? n : 0
  }
  if (node.valueKind === 'boolean') {
    return node.stringValue === 'true' || node.stringValue === '1'
  }
  return node.stringValue
}

function nodesToObject(nodes: JsonKvNode[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const node of nodes) {
    const key = node.key.trim()
    if (!key) continue
    if (node.valueKind === 'object') {
      out[key] = nodesToObject(node.children)
    } else {
      out[key] = leafValue(node)
    }
  }
  return out
}

function collectOpenPaths(nodes: JsonKvNode[], prefix = ''): string[] {
  const out: string[] = []
  for (const node of nodes) {
    const key = node.key.trim()
    if (!key) continue
    const path = prefix ? `${prefix}.${key}` : key
    if (node.openToApp) out.push(path)
    if (node.valueKind === 'object') {
      out.push(...collectOpenPaths(node.children, path))
    }
  }
  return out
}

function syncJsonForm(nodes: JsonKvNode[]) {
  jsonNodes.value = nodes
  Crud.value?.patchUpsertForm({
    data: JSON.stringify(nodesToObject(nodes)),
    appOpenPaths: JSON.stringify(collectOpenPaths(nodes)),
  })
}

function onJsonNodesChange(nodes: JsonKvNode[]) {
  syncJsonForm(nodes)
}

function addJsonRoot() {
  const next = [...jsonNodes.value, createEmptyNode()]
  syncJsonForm(next)
}

function plainData(raw: unknown) {
  const s = String(raw ?? '')
  if (!s.trim()) return ''
  if (!/[<>]/.test(s)) return s.replace(/\s+/g, ' ').trim()
  const doc = new DOMParser().parseFromString(s, 'text/html')
  doc.querySelectorAll('img, picture, video, source').forEach((el) => el.remove())
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}

function fileName(raw: unknown) {
  const s = String(raw ?? '').trim()
  if (!s) return '—'
  try {
    const path = s.split('?')[0] || s
    const name = path.split('/').pop() || path
    return decodeURIComponent(name)
  } catch {
    return s
  }
}

useUpsert({
  ignoreFields: ['data', 'appOpenPaths'],
  items: [
    {
      prop: 'type',
      label: '类型',
      required: true,
      type: 'radio',
      value: 0,
      options: dict.options('base_param_type'),
    },
    {
      prop: 'remark',
      label: '备注',
      span: 24,
    },
  ],
  onOpened(form: Record<string, unknown>) {
    if (form.openToApp == null) form.openToApp = 0
    if (Number(form.type) === 3) {
      jsonNodes.value = parseJsonNodes(form.data, form.appOpenPaths)
      form.data = JSON.stringify(nodesToObject(jsonNodes.value))
      form.appOpenPaths = JSON.stringify(collectOpenPaths(jsonNodes.value))
    } else {
      jsonNodes.value = [createEmptyNode()]
      form.appOpenPaths = null
    }
  },
  async onSubmit(data: Record<string, unknown>, { next }) {
    data.openToApp = Number(data.openToApp) === 1 ? 1 : 0
    data.type = Number(data.type)
    if (Number(data.type) === 3) {
      data.data = JSON.stringify(nodesToObject(jsonNodes.value))
      data.appOpenPaths = JSON.stringify(collectOpenPaths(jsonNodes.value))
    } else {
      data.appOpenPaths = null
    }
    if (!String(data.data ?? '').trim()) {
      toast.error('请填写数据')
      return
    }
    await next(data)
  },
})

useTable({
  ignoreFields: ['appOpenPaths'],
  columns: [
    {
      prop: 'type',
      width: 100,
      dict: dict.options('base_param_type'),
      component: { name: 'vm-dict-tag' },
    },
    { prop: 'data', minWidth: 200, slot: 'cell-data' },
    {
      prop: 'openToApp',
      width: 110,
      fixed: 'right',
      component: {
        name: 'vm-switch',
        props: dict.get('yes_no_number'),
      },
    },
  ],
})

const Crud = useCrud(
  { service: service.base.param },
  (app) => {
    void dict
      .refresh(['base_param_type', 'base_json_value_kind', 'yes_no_number'])
      .then(() => app.refresh())
  },
)

watch(
  () => Number(Crud.value?.upsertForm?.value?.type),
  (type, prev) => {
    if (!Crud.value?.upsertVisible?.value) return
    if (type === 3 && prev !== 3) {
      const form = Crud.value.upsertForm.value
      const nodes = parseJsonNodes(form.data, form.appOpenPaths)
      syncJsonForm(nodes.length ? nodes : [createEmptyNode()])
    }
    if (type !== 3 && prev === 3) {
      Crud.value.patchUpsertForm({ appOpenPaths: null })
    }
  },
)
</script>

<style lang="scss" scoped>
.base-param-data-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.base-param-data-label .vm-crud-upsert__label {
  margin-bottom: 0;
}

.base-param-json-add {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--brand, #4e5dff);
  border-radius: 6px;
  background: color-mix(in srgb, var(--brand, #4e5dff) 12%, transparent);
  color: var(--brand, #4e5dff);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;

  i {
    font-size: 14px;
  }

  &:hover {
    background: color-mix(in srgb, var(--brand, #4e5dff) 20%, transparent);
  }
}

.base-param-richtext {
  width: 100%;
}

.base-param-data-text,
.base-param-data-file {
  display: block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
