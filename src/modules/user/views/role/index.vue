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
      <vm-table ref="Table">
        <template #cell-perms="{ row }">
          <vm-ellipsis-text :model-value="permsSummary(row.perms)" />
        </template>
      </vm-table>
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert">
      <template #default>
        <vm-perm-section title="功能权限">
          <vm-eps-perm-picker
            v-model="checkedPermsCsv"
            side="app"
            placeholder="请选择前端功能权限"
          />
        </vm-perm-section>
      </template>
    </vm-upsert>
  </vm-crud>
</template>

<script setup lang="ts">

defineOptions({ name: 'user-role' })

const { service } = useVome()
const { dict } = useDict()

const checkedPermsCsv = ref('')

function parsePerms(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  if (typeof raw !== 'string') return []
  const text = raw.trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

function permsToCsv(raw: unknown) {
  return parsePerms(raw).join(',')
}

function permsSummary(raw: unknown) {
  const list = parsePerms(raw)
  if (!list.length) return '—'
  if (list.length === 1) return list[0]!
  return `${list.length} 项`
}

useUpsert({
  items: [
    { prop: 'name', label: '名称', required: true, span: 12 },
    { prop: 'label', label: '标识', required: true, span: 12 },
    {
      prop: 'status',
      label: '状态',
      span: 12,
      type: 'switch',
      value: 1,
      component: {
        props: {
          activeValue: 1,
          inactiveValue: 0,
        },
      },
    },
    { prop: 'remark', label: '备注', type: 'textarea', span: 12 },
  ],
  onOpen() {
    checkedPermsCsv.value = ''
  },
  onOpened(form) {
    checkedPermsCsv.value = permsToCsv(form.perms)
  },
  async onSubmit(data, { close }) {
    const payload = {
      name: String(data.name ?? '').trim(),
      label: String(data.label ?? '').trim(),
      remark: data.remark ? String(data.remark) : null,
      status: Number(data.status ?? 1),
      perms: parsePerms(checkedPermsCsv.value),
    }

    const id = data.id != null && data.id !== '' ? Number(data.id) : 0
    try {
      if (id) {
        await service.user.role.update({ ...payload, id })
      } else {
        await service.user.role.add(payload)
      }
      toast.success('保存成功')
      close()
      await Crud.value?.refresh()
    } catch (e) {
      console.error(e)
      const err = e as Error & { toasted?: boolean }
      if (!err.toasted) {
        toast.error(e instanceof Error && e.message ? e.message : '保存失败')
      }
    }
  },
})

useTable({
  columns: [
    { type: 'selection' },
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'name', label: '名称', minWidth: 120 },
    { prop: 'label', label: '标识', minWidth: 120 },
    { prop: 'perms', label: '权限', minWidth: 160, slot: 'cell-perms' },
    {
      prop: 'status',
      label: '状态',
      width: 88,
      component: {
        name: 'vm-switch',
        props: { activeValue: 1, inactiveValue: 0 },
      },
    },
    { prop: 'remark', label: '备注', minWidth: 160 },
    { prop: 'createTime', label: '创建时间', minWidth: 160 },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})

const Crud = useCrud(
  { service: service.user.role },
  (app) => {
    void loadAllEps()
    void dict.refresh(['status']).then(() => app.refresh())
  },
)
</script>

<style lang="scss" scoped>
</style>
