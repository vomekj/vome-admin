<template>
  <vm-split-layout aside-width="240px">
    <template #aside>
      <vm-dept-tree
        ref="DeptTree"
        v-model="selectedDeptId"
        root-label="全部"
        :only-trashed="userTrashMode"
        @change="onDeptChange"
      />
    </template>

    <vm-crud ref="Crud">
        <vm-row>
          <vm-flex />
          <vm-search />
        </vm-row>
        <vm-row>
          <vm-refresh-btn />
          <vm-toolbar :add-data="addDefaults">
            <vm-action-btn
              v-if="canTransfer && !userTrashMode"
              variant="success"
              icon="ri-shuffle-line"
              :label="transferring ? '转让中…' : '转移'"
              :loading="transferring"
              :disabled="!selectedUsers.length"
              @click="transferSuper"
            />
            <vm-action-btn
              v-if="canMoveDept && !userTrashMode"
              variant="brand"
              icon="ri-organization-chart"
              label="转移部门"
              :disabled="!selectedUsers.length"
              @click="openMoveDept"
            />
          </vm-toolbar>
        </vm-row>
        <vm-row>
          <vm-table ref="Table">
            <template #cell-headImg="{ row }">
              <vm-avatar :model-value="String(row.headImg || '')" :name="avatarName(row)" />
            </template>
            <template #cell-departmentName="{ row }">
              {{ deptNameOf(row) }}
            </template>
            <template #cell-roleNames="{ row }">
              <vm-ellipsis-text :model-value="roleNameOf(row)" />
            </template>
          </vm-table>
        </vm-row>
        <vm-row>
          <vm-flex />
          <vm-pagination />
        </vm-row>
        <vm-upsert ref="Upsert" :title="upsertDialogTitle">
          <template #default="{ form }">
            <template v-if="upsertScene === 'moveDept'">
              <vm-form-hint style="grid-column: 1 / -1">
                已选 {{ selectedUsers.length }} 人，请选择目标部门
              </vm-form-hint>
              <div class="vm-crud-upsert__field" style="grid-column: span 12">
                <Label class="vm-crud-upsert__label">
                  部门 <span class="vm-crud-upsert__req">*</span>
                </Label>
                <vm-tree-select
                  class="vm-crud-upsert__control"
                  :model-value="deptValue(form.departmentId)"
                  :options="deptOptions"
                  placeholder="请选择部门"
                  @update:model-value="(v) => patchDept(v)"
                />
              </div>
            </template>
            <template v-else>
              <div class="vm-crud-upsert__field" style="grid-column: span 12">
                <Label class="vm-crud-upsert__label">部门</Label>
                <vm-tree-select
                  class="vm-crud-upsert__control"
                  :model-value="deptValue(form.departmentId)"
                  :options="deptOptions"
                  placeholder="请选择部门"
                  @update:model-value="(v) => patchDept(v)"
                />
              </div>
              <div class="vm-crud-upsert__field" style="grid-column: span 12">
                <Label class="vm-crud-upsert__label">角色（多选合并权限）</Label>
                <vm-role-picker v-model="checkedRoleIds" />
              </div>
            </template>
          </template>
        </vm-upsert>
      </vm-crud>
  </vm-split-layout>
</template>

<script setup lang="ts">

defineOptions({ name: 'base-user' })

const { service } = useVome()
const userStore = useUserStore()
const { dict } = useDict()

const selectedDeptId = ref<number | null>(null)
const deptFilterIds = ref<number[]>([])
const deptCaption = ref('')
const checkedRoleIds = ref<number[]>([])
const roleNameMap = ref<Record<string, string>>({})
const transferring = ref(false)
const upsertScene = ref<'user' | 'moveDept'>('user')
const deptOptions = ref<TreeSelectOption[]>([])
/** 与右侧 Crud 回收站联动：左侧显示软删部门 */
const userTrashMode = ref(false)

const upsertDialogTitle = computed(() =>
  upsertScene.value === 'moveDept' ? '转移部门' : '',
)

const DeptTree = ref<{ idNameMap: { value: Map<number, string> } } | null>(null)

const canTransfer = computed(
  () => userStore.isSuper && Boolean(service.base.user?._permission?.transferSuper),
)

const canMoveDept = computed(() => Boolean(service.base.user?._permission?.update))

/** 转移部门时隐藏用户表单字段 */
const hideUnlessUserUpsert = () => upsertScene.value !== 'user'

function openMoveDept() {
  if (!selectedUsers.value.length) {
    toast.warning('请先选择用户')
    return
  }
  upsertScene.value = 'moveDept'
  void syncDeptOptions()
  Crud.value?.openUpsert({ departmentId: null }, 'add')
}

function patchForm(prop: string, value: unknown) {
  Crud.value?.patchUpsertForm({ [prop]: value })
}

function deptNameOf(row: Record<string, unknown>) {
  const id = row.departmentId
  if (id == null || id === '') return '—'
  return DeptTree.value?.idNameMap?.value?.get(Number(id)) || '—'
}

function roleNameOf(row: Record<string, unknown>) {
  const id = row.id
  if (id == null) return '—'
  return roleNameMap.value[String(id)] || '—'
}

function avatarName(row: Record<string, unknown>) {
  return String(row.nickName || row.name || row.username || '?')
}

async function loadRoleNameMap() {
  try {
    roleNameMap.value =
      ((await service.base.user.roleMap()) as Record<string, string>) || {}
  } catch (e) {
    console.error('[user] roleMap failed', e)
    roleNameMap.value = {}
  }
}

type DeptNode = { id: number; parentId: number | null; name: string; children?: DeptNode[] }

function deptValue(id: unknown) {
  return id == null || id === '' ? '' : String(id)
}

function patchDept(v: string) {
  patchForm('departmentId', v ? Number(v) : null)
}

function toSelectOptions(nodes: DeptNode[]): TreeSelectOption[] {
  return nodes.map((n) => ({
    label: n.name,
    value: n.id,
    children: n.children?.length ? toSelectOptions(n.children) : undefined,
  }))
}

async function syncDeptOptions() {
  try {
    const list = (await service.base.department.tree()) as Array<Record<string, unknown>>
    const tree = deepTree(
      (Array.isArray(list) ? list : [])
        .filter((d) => d.id != null)
        .map((d) => ({
          id: Number(d.id),
          parentId: d.parentId == null ? null : Number(d.parentId),
          orderNum: Number(d.orderNum ?? 0),
          name: String(d.name ?? ''),
        })),
    ) as DeptNode[]
    deptOptions.value = toSelectOptions(tree)
  } catch {
    deptOptions.value = []
  }
}

function onDeptChange(_id: number | null, meta: { name: string; ids: number[] }) {
  deptCaption.value = meta.name === '全部' ? '' : meta.name
  deptFilterIds.value = meta.ids
  // 空数组表示不按部门筛（setParams 为 merge，不能靠 delete 清掉旧值）
  Crud.value?.setParams({ departmentIds: meta.ids })
}

/** 新增时带上左侧选中部门（给 vm-toolbar :add-data） */
const addDefaults = computed(() => {
  if (selectedDeptId.value == null) return {}
  return { departmentId: selectedDeptId.value }
})

async function loadUserRoles(userId: number) {
  const ids = (await service.base.user.roles({ userId })) as number[]
  checkedRoleIds.value = (ids || []).map(Number)
}

async function transferSuper() {
  const rows = selectedUsers.value
  if (rows.length !== 1) {
    toast.warning('请选择一名用户进行转让')
    return
  }
  const row = rows[0]!
  if (row.isSuper) {
    toast.warning('该用户已是超管')
    return
  }
  const ok = await vmConfirm({
    title: '转让超管',
    message: `确定将最高管理员转让给「${row.username}」？转让后你将失去超管身份。`,
    confirmText: '确定转让',
    cancelText: '取消',
  })
  if (!ok) return
  transferring.value = true
  try {
    await service.base.user.transferSuper({ userId: Number(row.id) })
    toast.success('转让成功，请重新登录')
    await userStore.logout()
    location.href = '/login'
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) toast.error(e instanceof Error ? e.message : '转让失败')
  } finally {
    transferring.value = false
  }
}

useUpsert({
  items: [
    { prop: 'username', label: '用户名', required: true, span: 12, hidden: hideUnlessUserUpsert },
    {
      prop: 'password',
      label: '密码',
      placeholder: '新增必填 / 编辑留空不改',
      span: 12,
      hidden: hideUnlessUserUpsert,
    },
    { prop: 'name', label: '姓名', span: 12, hidden: hideUnlessUserUpsert },
    { prop: 'nickName', label: '昵称', span: 12, hidden: hideUnlessUserUpsert },
    { prop: 'phone', label: '手机', span: 12, hidden: hideUnlessUserUpsert },
    { prop: 'email', label: '邮箱', span: 12, hidden: hideUnlessUserUpsert },
    {
      prop: 'headImg',
      label: '头像',
      span: 12,
      hidden: hideUnlessUserUpsert,
      component: {
        name: 'vm-upload',
        props: {
          type: 'image',
          text: '上传头像',
          size: 96,
          limitSize: 5,
          prefixPath: 'app/base',
        },
      },
    },
    {
      prop: 'status',
      label: '状态',
      span: 12,
      type: 'switch',
      hidden: hideUnlessUserUpsert,
      value: 1,
      component: {
        props: {
          activeValue: 1,
          inactiveValue: 0,
        },
      },
    },
    { prop: 'remark', label: '备注', type: 'textarea', span: 12, hidden: hideUnlessUserUpsert },
  ],
  onOpen() {
    if (upsertScene.value === 'moveDept') return
    checkedRoleIds.value = []
  },
  async onOpened(form) {
    if (upsertScene.value === 'moveDept') return
    const id = form.id != null && form.id !== '' ? Number(form.id) : 0
    if (id) await loadUserRoles(id)
  },
  onClose(_action, done) {
    upsertScene.value = 'user'
    done()
  },
  async onSubmit(data, { close }) {
    if (upsertScene.value === 'moveDept') {
      const departmentId = data.departmentId
      if (departmentId == null || departmentId === '') {
        toast.warning('请选择目标部门')
        return
      }
      const userIds = selectedUsers.value
        .map((r) => Number(r.id))
        .filter((id) => !Number.isNaN(id) && id > 0)
      if (!userIds.length) {
        toast.warning('请先选择用户')
        return
      }
      try {
        await service.base.user.moveDepartment({
          userIds,
          departmentId: Number(departmentId),
        })
        toast.success(`已转移 ${userIds.length} 人`)
        upsertScene.value = 'user'
        close()
        await Crud.value?.refresh()
      } catch (e) {
        console.error(e)
        const err = e as Error & { toasted?: boolean }
        if (!err.toasted) toast.error(e instanceof Error ? e.message : '转移失败')
      }
      return
    }

    const username = String(data.username ?? '').trim()
    if (!username) {
      toast.error('用户名不能为空')
      return
    }

    const isAdd = data.id == null || data.id === ''
    if (isAdd && !String(data.password ?? '').trim()) {
      toast.error('新增用户请填写密码')
      return
    }

    const payload: Record<string, unknown> = {
      username,
      name: data.name ? String(data.name) : null,
      nickName: data.nickName ? String(data.nickName) : null,
      phone: data.phone ? String(data.phone) : null,
      email: data.email ? String(data.email) : null,
      headImg: data.headImg ? String(data.headImg) : null,
      departmentId:
        data.departmentId === '' || data.departmentId == null
          ? null
          : Number(data.departmentId),
      status: Number(data.status ?? 1),
      remark: data.remark ? String(data.remark) : null,
    }
    if (String(data.password ?? '').trim()) {
      payload.password = String(data.password)
    }

    let userId = data.id != null && data.id !== '' ? Number(data.id) : 0
    try {
      if (userId) {
        await service.base.user.update({ ...payload, id: userId })
      } else {
        const row = (await service.base.user.add(payload)) as { id?: number }
        userId = Number(row?.id)
      }
      if (!userId) throw new Error('未返回用户 id')

      await service.base.user.setRoles({
        userId,
        roleIds: checkedRoleIds.value,
      })

      toast.success('保存成功')
      close()
      await loadRoleNameMap()
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
    { prop: 'headImg', label: '头像', width: 64 },
    { prop: 'username', label: '用户名', minWidth: 110 },
    { prop: 'name', label: '姓名', minWidth: 100 },
    { prop: 'nickName', label: '昵称', minWidth: 100 },
    { prop: 'departmentName', label: '部门名称', minWidth: 120 },
    { prop: 'roleNames', label: '角色', minWidth: 140 },
    {
      prop: 'status',
      label: '状态',
      width: 88,
      component: {
        name: 'vm-switch',
        props: { activeValue: 1, inactiveValue: 0 },
      },
    },
    { prop: 'phone', label: '手机号码', minWidth: 120 },
    { prop: 'createTime', label: '创建时间', minWidth: 160 },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})

const Crud = useCrud(
  {
    service: service.base.user,
    async onRefresh(params, { next }): Promise<void> {
      const nextTrash = params.onlyTrashed === true
      if (userTrashMode.value !== nextTrash) {
        userTrashMode.value = nextTrash
        selectedDeptId.value = null
        deptCaption.value = ''
        deptFilterIds.value = []
        delete params.departmentIds
        delete params.departmentId
      }
      await next(params)
    },
  },
  (app) => {
    void loadRoleNameMap()
    void syncDeptOptions()
    void dict.refresh(['status']).then(() => app.refresh())
  },
)

const selectedUsers = computed(() => {
  // template ref 会解包 expose 的 Ref；不能再 .value
  const sel = Crud.value?.selection as unknown
  const rows = unref(sel as never)
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []
})
</script>

<style lang="scss" scoped>
</style>
