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
        <template #cell-image="{ row }">
          <Avatar class="vm-app-user__avatar">
            <AvatarImage v-if="row.image" :src="String(row.image)" />
            <AvatarFallback>{{ avatarFallback(row) }}</AvatarFallback>
          </Avatar>
        </template>
        <template #cell-roleNames="{ row }">
          <span class="vm-app-user__roles">{{ roleNameOf(row) }}</span>
        </template>
      </vm-table>
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert">
      <template #default>
        <div class="vm-crud-upsert__field" style="grid-column: span 12">
          <Label class="vm-crud-upsert__label">角色（多选合并权限）</Label>
          <vm-role-picker v-model="checkedRoleIds" source="user" />
        </div>
      </template>
    </vm-upsert>
  </vm-crud>
</template>

<script setup lang="ts">
defineOptions({ name: 'user-info' })

const { service } = useVome()

const checkedRoleIds = ref<number[]>([])
const roleNameMap = ref<Record<string, string>>({})

function avatarFallback(row: Record<string, unknown>) {
  const name = String(row.name || row.email || '?')
  return name.slice(0, 1).toUpperCase()
}

function roleNameOf(row: Record<string, unknown>) {
  const id = row.id
  if (id == null) return '—'
  return roleNameMap.value[String(id)] || '—'
}

async function loadRoleNameMap() {
  try {
    roleNameMap.value =
      ((await service.user.info.roleMap()) as Record<string, string>) || {}
  } catch (e) {
    console.error('[user-info] roleMap failed', e)
    roleNameMap.value = {}
  }
}

async function loadUserRoles(userId: string) {
  const ids = (await service.user.info.roles({ userId })) as number[]
  checkedRoleIds.value = (ids || []).map(Number)
}

useUpsert({
  items: [
    { prop: 'name', label: '名称', required: true, span: 12 },
    { prop: 'email', label: '邮箱', required: true, span: 12 },
    {
      prop: 'password',
      label: '密码',
      placeholder: '新增必填 / 编辑留空不改',
      span: 12,
    },
    {
      prop: 'image',
      label: '头像',
      span: 12,
      component: {
        name: 'vm-upload',
        props: {
          type: 'image',
          text: '上传头像',
          size: 96,
          limitSize: 5,
          prefixPath: 'app/user',
        },
      },
    },
    { prop: 'tenantId', label: '租户', span: 12 },
    {
      prop: 'emailVerified',
      label: '邮箱已验证',
      span: 12,
      type: 'switch',
    },
  ],
  onOpen() {
    checkedRoleIds.value = []
  },
  async onOpened(form) {
    const id = form.id != null && form.id !== '' ? String(form.id) : ''
    if (id) await loadUserRoles(id)
  },
  async onSubmit(data, { close }) {
    const name = String(data.name ?? '').trim()
    const email = String(data.email ?? '').trim()
    if (!name) {
      toast.error('名称不能为空')
      return
    }
    if (!email) {
      toast.error('邮箱不能为空')
      return
    }

    const isAdd = data.id == null || data.id === ''
    if (isAdd && !String(data.password ?? '').trim()) {
      toast.error('新增用户请填写密码')
      return
    }

    const payload: Record<string, unknown> = {
      name,
      email,
      image: data.image ? String(data.image) : null,
      tenantId:
        data.tenantId === '' || data.tenantId == null
          ? null
          : Number(data.tenantId),
      emailVerified: Boolean(data.emailVerified ?? false),
    }
    if (String(data.password ?? '').trim()) {
      payload.password = String(data.password)
    }

    let userId = data.id != null && data.id !== '' ? String(data.id) : ''
    try {
      if (userId) {
        await service.user.info.update({ ...payload, id: userId })
      } else {
        const row = (await service.user.info.add(payload)) as { id?: string }
        userId = String(row?.id ?? '')
      }
      if (!userId) throw new Error('未返回用户 id')

      await service.user.info.setRoles({
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
    { prop: 'id', label: 'ID', width: 160 },
    { prop: 'image', label: '头像', width: 120 },
    { prop: 'name', label: '名称', width: 160 },
    { prop: 'email', label: '邮箱', width: 120 },
    { prop: 'roleNames', label: '角色', width: 100 },
    {
      prop: 'emailVerified',
      label: '邮箱验证',
      width: 90,
      formatter: (_r, v) => (v ? '是' : '否'),
    },
    { prop: 'tenantId', label: '租户', width: 80 },
    { prop: 'createdAt', label: '创建时间', minWidth: 160 },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})

const Crud = useCrud(
  { service: service.user.info },
  (app) => {
    void loadRoleNameMap()
    app.refresh()
  },
)
</script>

<style lang="scss" scoped>
.vm-app-user__avatar {
  width: 32px;
  height: 32px;
}

.vm-app-user__roles {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--muted-foreground);
}
</style>
