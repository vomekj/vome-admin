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
      <vm-table ref="Table" />
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert">
      <template #default="{ form }">
        <vm-perm-section title="功能权限">
          <vm-check-tree
            v-model="checkedMenuIds"
            :nodes="menuTree"
            filterable
            cascade
            :height="260"
            :default-expand-level="1"
          />
        </vm-perm-section>
        <vm-perm-section v-if="Number(form.dataScope) === 1" title="数据权限">
          <template #extra>
            <span>是否关联上下级</span>
            <vm-switch
              :model-value="Boolean(form.relevance)"
              @update:model-value="(v) => patchForm('relevance', v)"
            />
          </template>
          <vm-check-tree
            v-model="checkedDeptIds"
            :nodes="deptTree"
            filterable
            :cascade="Boolean(form.relevance)"
            :height="260"
            :default-expand-level="2"
          />
        </vm-perm-section>
      </template>
    </vm-upsert>
  </vm-crud>
</template>

<script setup lang="ts">

defineOptions({ name: 'base-role' })

const { service } = useVome()
const { dict } = useDict()

const menuTree = ref<CheckTreeNode[]>([])
const deptTree = ref<CheckTreeNode[]>([])
const checkedMenuIds = ref<number[]>([])
const checkedDeptIds = ref<number[]>([])

function patchForm(prop: string, value: unknown) {
  Crud.value?.patchUpsertForm({ [prop]: value })
}

type MenuRow = {
  id: number
  parentId: number | null
  orderNum: number
  name: string
  type: number
  perms: string
  children?: MenuRow[]
}

type DeptRow = {
  id: number
  parentId: number | null
  orderNum: number
  name: string
  children?: DeptRow[]
}

function toMenuNodes(list: Array<Record<string, unknown>>): CheckTreeNode[] {
  const rows = list.filter((m) => m.id != null && !Number.isNaN(Number(m.id)))
  const tree = deepTree(
    rows.map((m) => ({
      id: Number(m.id),
      parentId: m.parentId == null ? null : Number(m.parentId),
      orderNum: Number(m.orderNum ?? 0),
      name: String(m.name ?? ''),
      type: Number(m.type ?? 0),
      perms: m.perms ? String(m.perms) : '',
    })),
  ) as MenuRow[]
  const walk = (n: MenuRow): CheckTreeNode => ({
    id: n.id,
    label: String(n.name),
    meta: Number(n.type) === 2 ? String(n.perms || '') : undefined,
    children: n.children?.length ? n.children.map(walk) : undefined,
  })
  return tree.map(walk)
}

function toDeptNodes(list: Array<Record<string, unknown>>): CheckTreeNode[] {
  const rows = list.filter((d) => d.id != null && !Number.isNaN(Number(d.id)))
  const tree = deepTree(
    rows.map((d) => ({
      id: Number(d.id),
      parentId: d.parentId == null ? null : Number(d.parentId),
      orderNum: Number(d.orderNum ?? 0),
      name: String(d.name ?? ''),
    })),
  ) as DeptRow[]
  const walk = (n: DeptRow): CheckTreeNode => ({
    id: n.id,
    label: String(n.name),
    children: n.children?.length ? n.children.map(walk) : undefined,
  })
  return tree.map(walk)
}

async function fetchDeptTree() {
  return service.base.department.tree() as Promise<Array<Record<string, unknown>>>
}

async function fetchRoleDepartments(roleId: number) {
  return service.base.role.departments({ roleId }) as Promise<number[]>
}

async function saveRoleDepartments(roleId: number, departmentIds: number[]) {
  return service.base.role.setDepartments({ roleId, departmentIds })
}

async function loadTrees() {
  try {
    const menus = (await service.base.menu.tree()) as Array<Record<string, unknown>>
    menuTree.value = toMenuNodes(Array.isArray(menus) ? menus : [])
  } catch (e) {
    console.error('[role] load menu tree failed', e)
    menuTree.value = []
    toast.error('加载功能权限树失败')
  }
  try {
    const depts = await fetchDeptTree()
    deptTree.value = toDeptNodes(Array.isArray(depts) ? depts : [])
  } catch (e) {
    console.error('[role] load dept tree failed', e)
    deptTree.value = []
    toast.error('加载数据权限树失败')
  }
}

async function loadRoleRelations(roleId: number) {
  const [menuIds, deptIds] = await Promise.all([
    service.base.role.menus({ roleId }) as Promise<number[]>,
    fetchRoleDepartments(roleId),
  ])
  checkedMenuIds.value = (menuIds || []).map(Number)
  checkedDeptIds.value = (deptIds || []).map(Number)
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
    {
      prop: 'dataScope',
      label: '数据范围',
      type: 'radio',
      span: 12,
      value: '0',
      options: dict.stringOptions('base_data_scope'),
    },
    { prop: 'remark', label: '备注', type: 'textarea', span: 12 },
  ],
  onOpen() {
    checkedMenuIds.value = []
    checkedDeptIds.value = []
  },
  async onOpened(form) {
    await loadTrees()
    const id = form.id != null && form.id !== '' ? Number(form.id) : 0
    if (id) await loadRoleRelations(id)
  },
  async onSubmit(data, { close }) {
    const payload = {
      name: String(data.name ?? '').trim(),
      label: String(data.label ?? '').trim(),
      remark: data.remark ? String(data.remark) : null,
      status: Number(data.status ?? 1),
      dataScope: Number(data.dataScope ?? 0),
      relevance: Number(data.dataScope) === 1 ? Boolean(data.relevance) : false,
    }

    let roleId = data.id != null && data.id !== '' ? Number(data.id) : 0
    try {
      if (roleId) {
        await service.base.role.update({ ...payload, id: roleId })
      } else {
        const row = (await service.base.role.add(payload)) as { id?: number }
        roleId = Number(row?.id)
      }
      if (!roleId) throw new Error('未返回角色 id')

      await service.base.role.setMenus({
        roleId,
        menuIds: checkedMenuIds.value,
      })

      await saveRoleDepartments(
        roleId,
        payload.dataScope === 1 ? checkedDeptIds.value : [],
      )

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
    {
      prop: 'dataScope',
      label: '数据范围',
      width: 100,
      dict: dict.options('base_data_scope'),
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
    { prop: 'remark', label: '备注', minWidth: 160 },
    { prop: 'createTime', label: '创建时间', minWidth: 160 },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})

const Crud = useCrud(
  { service: service.base.role },
  (app) => {
    void loadTrees()
    void dict.refresh(['status', 'base_data_scope']).then(() => app.refresh())
  },
)
</script>
