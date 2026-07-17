<template>
  <vm-split-layout aside-width="260px">
    <template #aside>
      <vm-aside
        :title="typeTrashMode ? '类型回收站' : '类型'"
        search
        v-model:keyword="typeKeyword"
        :empty="typeEmptyText"
        :loading="typeLoading"
        :add="!typeTrashMode"
        :add-disabled="typeSaving"
        add-title="新增类型"
        @refresh="loadTypes()"
        @add="openTypeUpsert()"
      >
        <vm-aside-list-item
          v-for="item in filteredTypes"
          :key="item.id"
          :active="selectedTypeId === item.id"
          @click="selectType(item)"
        >
          {{ item.name }}
          <template #subtitle>{{ item.key }}</template>
          <template #ops>
            <template v-if="typeTrashMode">
              <vm-icon-btn
                icon="ri-arrow-go-back-line"
                title="恢复"
                size="sm"
                :disabled="typeTrashBusyId === item.id"
                @click="restoreType(item)"
              />
              <vm-icon-btn
                icon="ri-delete-bin-2-line"
                title="彻底删除"
                size="sm"
                variant="danger"
                :disabled="typeTrashBusyId === item.id"
                @click="forceDeleteType(item)"
              />
            </template>
            <template v-else>
              <vm-icon-btn
                icon="ri-edit-line"
                title="编辑"
                size="sm"
                :disabled="typeSaving"
                @click="openTypeUpsert(item)"
              />
              <vm-icon-btn
                icon="ri-delete-bin-line"
                title="删除"
                size="sm"
                variant="danger"
                :disabled="typeDeletingId === item.id"
                @click="removeType(item)"
              />
            </template>
          </template>
        </vm-aside-list-item>
      </vm-aside>
    </template>

    <vm-crud ref="Crud">
        <vm-row>
          <vm-search />
        </vm-row>
        <vm-row>
          <vm-refresh-btn />
          <vm-action-btn
            v-if="Crud?.getPermission('add') && !typeTrashMode"
            variant="primary"
            icon="ri-add-line"
            label="新增"
            :disabled="selectedTypeId == null"
            @click="openAdd"
          />
          <vm-toolbar :show-add="false" />
        </vm-row>
        <vm-row>
          <vm-table ref="Table" />
        </vm-row>
        <vm-upsert ref="Upsert" :title="upsertTitle" :items="upsertItems">
          <template v-if="upsertScene === 'type'" #default>
            <vm-form-hint style="grid-column: 1 / -1">
              base_ 为系统内置使用字典，会在列表中隐藏，但可以使用 dict 函数调用
            </vm-form-hint>
          </template>
        </vm-upsert>
      </vm-crud>
  </vm-split-layout>
</template>

<script setup lang="ts">

defineOptions({ name: 'base-dict' })

const { service } = useVome()
const dictStore = useDictStore()

type DictTypeRow = {
  id?: number
  name?: string
  key?: string
}

const types = ref<DictTypeRow[]>([])
const typeKeyword = ref('')
const typeLoading = ref(false)
const typeDeletingId = ref<number | null>(null)
const typeTrashBusyId = ref<number | null>(null)
/** 与右侧 Crud 回收站联动 */
const typeTrashMode = ref(false)
const selectedTypeId = ref<number | null>(null)
const selectedTypeName = ref('')
const selectedTypeKey = ref('')

const upsertScene = ref<'info' | 'type'>('info')
const upsertTitle = computed(() => {
  if (upsertScene.value !== 'type') return ''
  return typeEditingId.value != null ? '编辑类型' : '新增类型'
})
const typeEditingId = ref<number | undefined>()
const typeSaving = ref(false)

const typeItems = computed((): CrudFormItem[] => [
  {
    prop: 'name',
    label: '名称',
    required: true,
    span: 12,
    placeholder: '如: 状态',
  },
  {
    prop: 'key',
    label: '标识',
    required: true,
    span: 12,
    placeholder: '如: state',
    disabled: typeEditingId.value != null,
  },
])

const infoItems: CrudFormItem[] = [
  { prop: 'name', label: '名称', required: true, span: 12 },
  {
    prop: 'value',
    label: '值',
    span: 12,
    placeholder: '如 0 / true / JSON',
    type: 'textarea',
  },
  { prop: 'orderNum', label: '排序', span: 12 },
  { prop: 'remark', label: '备注', span: 12, type: 'textarea' },
]

const upsertItems = computed(() =>
  upsertScene.value === 'type' ? typeItems.value : infoItems,
)

/** 内部字典约定前缀：仅管理页侧栏隐藏，dict.refresh / get 仍可用 */
const INTERNAL_DICT_KEY_PREFIX = 'base_'

function isHiddenDictType(t: DictTypeRow) {
  return String(t.key ?? '')
    .trim()
    .startsWith(INTERNAL_DICT_KEY_PREFIX)
}

/** 管理页可见类型（隐藏 base_*） */
const visibleTypes = computed(() =>
  types.value.filter((t) => !isHiddenDictType(t)),
)

const filteredTypes = computed(() => {
  const list = visibleTypes.value
  const q = typeKeyword.value.toLowerCase()
  if (!q) return list
  return list.filter((t) => {
    const name = String(t.name || '').toLowerCase()
    const key = String(t.key || '').toLowerCase()
    return name.includes(q) || key.includes(q)
  })
})

const typeEmptyText = computed(() => {
  if (typeLoading.value || filteredTypes.value.length) return ''
  return typeTrashMode.value ? '回收站为空' : '暂无字典类型'
})

async function loadTypes(opts?: { skipRefresh?: boolean }) {
  if (typeLoading.value) return
  typeLoading.value = true
  try {
    const rows = (await service.base.dict.type.list({
      ...(typeTrashMode.value ? { onlyTrashed: true } : {}),
    })) as DictTypeRow[]
    types.value = Array.isArray(rows) ? rows : []
    const visible = visibleTypes.value
    if (
      selectedTypeId.value != null &&
      !visible.some((t) => t.id === selectedTypeId.value)
    ) {
      selectedTypeId.value = null
      selectedTypeName.value = ''
      selectedTypeKey.value = ''
    }
    if (selectedTypeId.value == null && visible[0]?.id != null) {
      const first = visible[0]!
      selectedTypeId.value = first.id ?? null
      selectedTypeName.value = String(first.name || '')
      selectedTypeKey.value = String(first.key || '')
      if (!opts?.skipRefresh) Crud.value?.refresh()
    } else if (selectedTypeId.value == null && !opts?.skipRefresh) {
      Crud.value?.refresh()
    }
  } catch (e) {
    console.error(e)
    types.value = []
  } finally {
    typeLoading.value = false
  }
}

function selectType(item: DictTypeRow) {
  if (item.id == null) return
  selectedTypeId.value = item.id
  selectedTypeName.value = String(item.name || '')
  selectedTypeKey.value = String(item.key || '')
  Crud.value?.refresh()
}

function openTypeUpsert(item?: DictTypeRow) {
  upsertScene.value = 'type'
  typeEditingId.value = item?.id
  Crud.value?.openUpsert(
    {
      id: item?.id,
      name: String(item?.name || ''),
      key: String(item?.key || ''),
    },
    item?.id != null ? 'update' : 'add',
  )
}

async function removeType(item: DictTypeRow) {
  if (item.id == null || typeDeletingId.value === item.id) return
  const ok = await vmConfirm({
    title: '删除类型',
    message: `确定删除类型 "${item.name}"? 需先清空其下全部条目.`,
    confirmText: '删除',
    cancelText: '取消',
  })
  if (!ok) return
  typeDeletingId.value = item.id
  try {
    await service.base.dict.type.delete({ ids: [item.id] })
    toast.success('已删除')
    await afterTypeGone(item.id)
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    typeDeletingId.value = null
  }
}

async function restoreType(item: DictTypeRow) {
  if (item.id == null || typeTrashBusyId.value === item.id) return
  const ok = await vmConfirm({
    title: '恢复类型',
    message: `确定恢复类型「${item.name}」？`,
    confirmText: '恢复',
    cancelText: '取消',
  })
  if (!ok) return
  typeTrashBusyId.value = item.id
  try {
    await service.base.dict.type.restore({ ids: [item.id] })
    toast.success('已恢复')
    await afterTypeGone(item.id)
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '恢复失败')
  } finally {
    typeTrashBusyId.value = null
  }
}

async function forceDeleteType(item: DictTypeRow) {
  if (item.id == null || typeTrashBusyId.value === item.id) return
  const ok = await vmConfirm({
    title: '彻底删除',
    message: `确定彻底删除类型「${item.name}」？此操作不可恢复。`,
    confirmText: '彻底删除',
    cancelText: '取消',
  })
  if (!ok) return
  typeTrashBusyId.value = item.id
  try {
    await service.base.dict.type.delete({ ids: [item.id], force: true })
    toast.success('已彻底删除')
    await afterTypeGone(item.id)
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '删除失败')
  } finally {
    typeTrashBusyId.value = null
  }
}

/** 侧栏类型被删/恢复后清选中并刷新 */
async function afterTypeGone(id: number) {
  if (selectedTypeId.value === id) {
    selectedTypeId.value = null
    selectedTypeName.value = ''
    selectedTypeKey.value = ''
  }
  await loadTypes()
}

function openAdd() {
  if (selectedTypeId.value == null) {
    toast.warning('请先选择左侧字典类型')
    return
  }
  upsertScene.value = 'info'
  Crud.value?.rowAdd({
    typeId: selectedTypeId.value,
    parentId: null,
    orderNum: 0,
  })
}

function formatValue(v: unknown) {
  if (v == null) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function parseValueInput(raw: unknown): unknown {
  if (raw == null) return null
  if (typeof raw !== 'string') return raw
  const s = raw.trim()
  if (!s) return null
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  if (s === 'true') return true
  if (s === 'false') return false
  if (
    (s.startsWith('{') && s.endsWith('}')) ||
    (s.startsWith('[') && s.endsWith(']')) ||
    (s.startsWith('"') && s.endsWith('"'))
  ) {
    try {
      return JSON.parse(s) as unknown
    } catch {
      return s
    }
  }
  return s
}

function valueToForm(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') return JSON.stringify(raw)
  return String(raw)
}

useUpsert({
  onOpen(data) {
    if (data.typeId != null || 'value' in data) {
      upsertScene.value = 'info'
    }
    if (upsertScene.value !== 'info') return
    if (data && typeof data === 'object' && 'value' in data) {
      data.value = valueToForm(data.value)
    }
    if (data.orderNum == null) data.orderNum = 0
  },
  async onSubmit(data, { next, close }) {
    if (upsertScene.value === 'type') {
      if (typeSaving.value) return
      typeSaving.value = true
      try {
        const name = String(data.name || '').trim()
        const key = String(data.key || '').trim()
        if (typeEditingId.value != null) {
          await service.base.dict.type.update({
            id: typeEditingId.value,
            name,
            key,
          })
        } else {
          await service.base.dict.type.add({ name, key })
        }
        toast.success('已保存')
        close()
        await loadTypes()
        if (selectedTypeKey.value) void dictStore.refresh([selectedTypeKey.value])
      } catch (e) {
        console.error(e)
        const err = e as Error & { toasted?: boolean }
        if (!err.toasted) toast.error(e instanceof Error ? e.message : '保存失败')
      } finally {
        typeSaving.value = false
      }
      return
    }
    const row = { ...data } as Record<string, unknown>
    row.typeId = selectedTypeId.value
    row.value = parseValueInput(row.value)
    if (row.parentId === '' || row.parentId == null) row.parentId = null
    if (row.orderNum == null || row.orderNum === '') row.orderNum = 0
    else row.orderNum = Number(row.orderNum)
    await next(row)
    if (selectedTypeKey.value) void dictStore.refresh([selectedTypeKey.value])
  },
})

useTable({
  columns: [
    { type: 'selection' },
    { prop: 'name', label: '名称', minWidth: 140 },
    {
      prop: 'value',
      label: '值',
      minWidth: 120,
      formatter: (_r, v) => formatValue(v),
    },
    { prop: 'remark', label: '备注', minWidth: 120 },
    { prop: 'orderNum', label: '排序', width: 80 },
    { prop: 'createTime', label: '创建时间', minWidth: 160 },
    {
      type: 'op',
      width: 200,
      buttons: (row) =>
        typeTrashMode.value
          ? ['delete']
          : [
              {
                label: '新增',
                variant: 'ghost',
                onClick: () => {
                  if (selectedTypeId.value == null) return
                  Crud.value?.rowAdd({
                    typeId: selectedTypeId.value,
                    parentId: row.id,
                    orderNum: 0,
                  })
                },
              },
              'edit',
              'delete',
            ],
    },
  ],
  plugins: [Plugins.Table.toTree()],
})

const Crud = useCrud(
  {
    service: service.base.dict.info,
    async onRefresh(params, { render }) {
      const nextTrash = params.onlyTrashed === true
      if (typeTrashMode.value !== nextTrash) {
        typeTrashMode.value = nextTrash
        selectedTypeId.value = null
        selectedTypeName.value = ''
        selectedTypeKey.value = ''
        await loadTypes({ skipRefresh: true })
      }
      if (selectedTypeId.value == null) {
        render([])
        return
      }
      const res = await service.base.dict.info.list({
        ...params,
        typeId: selectedTypeId.value,
      })
      render(res as unknown as Record<string, unknown>[])
    },
  },
  (app) => {
    void loadTypes().then(() => {
      if (selectedTypeId.value != null) app.refresh()
    })
  },
)
</script>

<style lang="scss" scoped>
</style>
