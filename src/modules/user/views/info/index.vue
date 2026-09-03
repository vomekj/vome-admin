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

/** 角色映射键 = 业务自增 userId */
function roleNameOf(row: Record<string, unknown>) {
  const uid = row.userId
  if (uid == null || uid === '') return '—'
  return roleNameMap.value[String(uid)] || '—'
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

async function loadUserRoles(serialUserId: number) {
  const ids = (await service.user.info.roles({
    userId: serialUserId,
  })) as number[]
  checkedRoleIds.value = (ids || []).map(Number)
}

useUpsert({
  ignoreFields: ['userId'],
  items: [
    {
      prop: 'tenantId',
      label: '租户',
      type: 'number',
      component: {
        props: {
          type: 'number',
          precision: 0,
          controls: false,
        },
      },
    },
    {
      prop: 'password',
      label: '密码',
      required: (form) => form.id == null || form.id === '',
      placeholder: '新增必填 / 编辑留空不改',
    },
    {
      prop: 'image',
      label: '头像',
      component: {
        name: 'vm-upload',
        props: {
          type: 'image',
          text: '上传头像',
          size: 96,
          limitSize: 5,
          prefixPath: 'app/public/user',
        },
      },
    },
  ],
  onOpen() {
    checkedRoleIds.value = []
  },
  async onOpened(form) {
    const serial = Number(form.userId)
    if (Number.isFinite(serial) && serial > 0) await loadUserRoles(serial)
  },
  async onSubmit(data, { close }) {
    const name = String(data.name ?? '').trim()
    const email = String(data.email ?? '').trim()
    const phone = String(data.phone ?? '').trim()
    if (!name) {
      toast.error('名称不能为空')
      return
    }

    const isAdd = data.id == null || data.id === ''
    if (isAdd && !String(data.password ?? '').trim()) {
      toast.error('新增用户请填写密码')
      return
    }

    const payload: Record<string, unknown> = {
      name,
      email: email || null,
      phone: phone || null,
      image: data.image ? String(data.image) : null,
      tenantId:
        data.tenantId === '' || data.tenantId == null
          ? null
          : Number(data.tenantId),
      remark: data.remark != null ? String(data.remark).trim() || null : null,
      emailVerified: email ? Boolean(data.emailVerified ?? false) : false,
      phoneVerified: phone ? Boolean(data.phoneVerified ?? false) : false,
      status: Number(data.status ?? 1),
    }
    if (String(data.password ?? '').trim()) {
      payload.password = String(data.password)
    }

    let baId = data.id != null && data.id !== '' ? String(data.id) : ''
    let serialUserId =
      data.userId != null && data.userId !== '' ? Number(data.userId) : 0
    try {
      if (baId) {
        await service.user.info.update({ ...payload, id: baId })
      } else {
        const row = (await service.user.info.add(payload)) as {
          id?: string
          userId?: number
        }
        baId = String(row?.id ?? '')
        serialUserId = Number(row?.userId ?? 0)
      }
      if (!baId) throw new Error('未返回用户 id')
      if (!Number.isFinite(serialUserId) || serialUserId <= 0) {
        throw new Error('未返回业务 userId')
      }

      await service.user.info.setRoles({
        userId: serialUserId,
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
  ignoreFields: ['password', 'unionid', 'id'],
  columns: [
    { prop: 'userId', width: 88 },
    { prop: 'image', width: 120, slot: 'cell-image' },
    { prop: 'roleNames', label: '角色', width: 100, slot: 'cell-roleNames' },
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
