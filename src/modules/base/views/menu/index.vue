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
        <template #cell-isShow="{ row }">
          <vm-switch
            v-if="Number(row.type) !== 2"
            :model-value="row.isShow as boolean"
            :scope="row"
            :column="{ prop: 'isShow' }"
            @change="syncNav"
          />
          <span v-else>—</span>
        </template>
        <template #cell-icon="{ row }">
          <vm-thumb
            v-if="row.icon"
            :size="32"
            :icon="iconClass(String(row.icon))"
          />
        </template>
        <template #cell-keepAlive="{ row }">
          <vm-switch
            v-if="Number(row.type) === 1"
            :model-value="row.keepAlive as boolean"
            :scope="row"
            :column="{ prop: 'keepAlive' }"
            @change="syncNav"
          />
          <span v-else>—</span>
        </template>
        <template #cell-perms="{ row }">
          <vm-tag-list :model-value="row.perms ? String(row.perms) : ''" />
        </template>
      </vm-table>
    </vm-row>
    <vm-upsert ref="Upsert">
      <template #default="{ form }">
        <div v-if="Number(form.type) === 2" class="vm-menu-eps">
          <label class="vm-menu-eps__label">权限</label>
          <vm-eps-perm-picker
            class="vm-menu-eps__picker"
            :model-value="String(form.perms ?? '')"
            @update:model-value="(v) => patchForm('perms', v)"
          >
            <template v-if="epsEnabled" #suffix>
              <Button
                type="button"
                size="xs"
                variant="softPrimary"
                class="vm-menu-eps__auto"
                @click="openAutoPerm"
              >
                自动添加
              </Button>
            </template>
          </vm-eps-perm-picker>
        </div>
      </template>
    </vm-upsert>
    <vm-auto-perm-dialog
      v-model:open="autoOpen"
      :parent-id="autoParentId"
      :add="(data) => service.base.menu.add(data)"
      @done="onAutoDone"
    />
  </vm-crud>
</template>

<script setup lang="ts">
import { config } from '@/config/index.js'

import { syncMenuRoutes } from '/@/router/menu-routes'

defineOptions({ name: 'base-menu' })

const { service } = useVome()
const router = useRouter()
const user = useUserStore()
const { dict } = useDict()

/** 菜单变更后同步侧栏 + 动态路由 */
async function syncNav() {
  try {
    await user.reloadMenus()
    await syncMenuRoutes(router, user.menus)
  } catch (e) {
    console.error('[menu] syncNav failed', e)
  }
}
const epsEnabled = config.test.eps

/** 打开表单时的权限码快照（差分用） */
const baselinePerms = ref<string[]>([])
/** 同上级下已有 type=2 的权限码（防兄弟重复） */
const siblingPerms = ref<Set<string>>(new Set())

function iconClass(icon: string) {
  return icon.startsWith('ri-') ? icon : `ri-${icon}`
}

function splitPerms(raw: unknown): string[] {
  if (raw == null || raw === '') return []
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function getMenuList(): Record<string, unknown>[] {
  const raw = Crud.value?.list as unknown
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return ((raw as { value: Record<string, unknown>[] }).value ||
      []) as Record<string, unknown>[]
  }
  return []
}

/** 收集同 parentId 下已有权限码 */
function collectSiblingPerms(
  nodes: Record<string, unknown>[],
  parentId: number | null,
): Set<string> {
  const out = new Set<string>()
  const walk = (list: Record<string, unknown>[]) => {
    for (const n of list) {
      const pid =
        n.parentId === '' || n.parentId == null ? null : Number(n.parentId)
      if (pid === parentId && Number(n.type) === 2) {
        for (const p of splitPerms(n.perms)) out.add(p)
      }
      const kids = n.children as Record<string, unknown>[] | undefined
      if (kids?.length) walk(kids)
    }
  }
  walk(nodes)
  return out
}

function permOf(api: { perms?: string[]; method: string; path: string }) {
  return api.perms?.[0] || `${api.method}:${api.path}`
}

/** 权限码 → EPS summary 名称 */
function buildPermNameMap(eps: EpsModuleMap): Map<string, string> {
  const map = new Map<string, string>()
  for (const list of Object.values(eps)) {
    for (const ent of Array.isArray(list) ? list : []) {
      for (const api of ent.api || []) {
        const code = permOf(api)
        if (code && !map.has(code)) {
          map.set(code, api.summary || api.path || code)
        }
      }
    }
  }
  return map
}

function normalizeParentId(raw: unknown): number | null {
  if (raw === '' || raw == null || raw === '__root__') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

const UpsertItems = computed((): CrudFormItem[] => [
  {
    prop: 'type',
    label: '节点类型',
    type: 'radio',
    span: 12,
    value: 0,
    options: dict.stringOptions('base_menu_type'),
  },
  {
    prop: 'isShow',
    label: '是否显示',
    type: 'switch',
    span: 12,
    value: true,
    hidden: (f) => Number(f.type) === 2,
  },
  {
    prop: 'keepAlive',
    label: '路由缓存',
    type: 'switch',
    span: 12,
    value: true,
    hidden: (f) => Number(f.type) !== 1,
  },
  {
    prop: 'parentId',
    label: '上级节点',
    span: 12,
    placeholder: '顶级',
    component: { name: 'vm-tree-select' },
    options: [{ label: '顶级', value: '__root__' }],
  },
  { prop: 'name', label: '节点名称', required: true, span: 12 },
  {
    prop: 'router',
    label: '节点路由',
    span: 12,
    placeholder: '如: /base/menu',
    hidden: (f) => Number(f.type) !== 1,
  },
  {
    prop: 'viewPath',
    label: '文件路径',
    span: 12,
    component: { name: 'vm-view-path' },
    hidden: (f) => Number(f.type) !== 1,
  },
  {
    prop: 'icon',
    label: '图标',
    span: 12,
    component: { name: 'vm-icon-picker' },
    placeholder: '如 ri-home-fill',
    hidden: (f) => Number(f.type) === 2,
  },
  { prop: 'orderNum', label: '排序号', span: 12, placeholder: '数字越小越靠前' },
])

const Upsert = useUpsert({
  get items() {
    return UpsertItems.value
  },
  async onSubmit(data, { next, close }) {
    const parentId = normalizeParentId(data.parentId)
    const type = Number(data.type ?? 0)
    const orderNum = Number(data.orderNum ?? 0)
    const isShow =
      data.isShow !== false && data.isShow !== 'false' && data.isShow !== 0
    const keepAlive =
      data.keepAlive !== false &&
      data.keepAlive !== 'false' &&
      data.keepAlive !== 0

    const payloadBase = {
      parentId,
      type,
      orderNum,
      isShow,
      keepAlive,
      router: data.router ? String(data.router) : null,
      viewPath: data.viewPath ? String(data.viewPath) : null,
      icon: data.icon ? String(data.icon) : null,
    }

    // 非权限节点：原样更新/新增
    if (type !== 2) {
      return next({
        ...data,
        ...payloadBase,
        perms: data.perms ? String(data.perms) : null,
      })
    }

    const selected = splitPerms(data.perms)
    const baseline = new Set(baselinePerms.value)
    const siblings = siblingPerms.value
    const toAdd = selected.filter((p) => !baseline.has(p) && !siblings.has(p))

    const upsertModeRaw = Crud.value?.upsertMode as
      | { value?: string }
      | string
      | undefined
    const upsertMode =
      typeof upsertModeRaw === 'string'
        ? upsertModeRaw
        : upsertModeRaw?.value ||
          (data.id != null && data.id !== '' ? 'update' : 'add')

    if (toAdd.length) {
      try {
        let nameMap = new Map<string, string>()
        try {
          const eps = (await loadEps()) || {}
          nameMap = buildPermNameMap(eps)
        } catch {
          /* EPS 不可用时用表单名/权限码 */
        }
        const formName = String(data.name ?? '').trim()
        const rows = toAdd.map((perm) => ({
          type: 2,
          name: nameMap.get(perm) || formName || perm,
          perms: perm,
          parentId,
          orderNum: 0,
          router: null,
          viewPath: null,
          icon: null,
          isShow: true,
          keepAlive: true,
        }))
        await service.base.menu.add(rows)
        toast.success(`已新增 ${rows.length} 条权限`)
      } catch (e) {
        console.error(e)
        toast.error('新增权限失败')
        return
      }

      if (upsertMode === 'add') {
        close()
        await Crud.value?.refresh()
        return
      }

      // 编辑：新码已落兄弟行，当前节点 perms 保持打开时快照
      const kept =
        baselinePerms.value.length > 0
          ? baselinePerms.value.join(',')
          : null
      return next({
        ...data,
        ...payloadBase,
        perms: kept,
        name: data.name,
      })
    }

    // 无差分：正常更新当前节点
    return next({
      ...data,
      ...payloadBase,
      perms: data.perms ? String(data.perms) : null,
    })
  },
  onOpen(data) {
    const item = UpsertItems.value.find((i) => i.prop === 'parentId')
    type TreeOpt = {
      label: string
      value: string
      children?: TreeOpt[]
    }
    const toTree = (nodes: Record<string, unknown>[]): TreeOpt[] => {
      const out: TreeOpt[] = []
      for (const n of nodes) {
        if (Number(n.type) === 2) continue
        const kids = n.children as Record<string, unknown>[] | undefined
        const node: TreeOpt = {
          label: String(n.name ?? ''),
          value: String(n.id),
        }
        if (kids?.length) {
          const childOpts = toTree(kids)
          if (childOpts.length) node.children = childOpts
        }
        out.push(node)
      }
      return out
    }
    const list = getMenuList()
    if (item) {
      item.options = [
        { label: '顶级', value: '__root__' },
        ...toTree(list),
      ]
    }
    if (data.parentId == null || data.parentId === '') data.parentId = '__root__'
    else data.parentId = String(data.parentId)
    data.type = String(data.type ?? 0)

    // 权限差分快照
    baselinePerms.value = splitPerms(data.perms)
    siblingPerms.value = collectSiblingPerms(
      list,
      normalizeParentId(data.parentId),
    )
  },
})

function append(row: Record<string, unknown>) {
  const type = Number(row.type ?? 0)
  Crud.value?.rowAppend({
    parentId: String(row.id),
    type: String(Math.min(type + 1, 2)),
    isShow: true,
    keepAlive: true,
    orderNum: 0,
  })
}

useTable({
  defaultSort: { prop: 'orderNum', order: 'asc' },
  columns: [
    { type: 'selection' },
    { prop: 'name', label: '名称', minWidth: 200 },
    { prop: 'isShow', label: '显示', width: 88, slot: 'cell-isShow' },
    { prop: 'icon', label: '图标', width: 88, align: 'center', slot: 'cell-icon' },
    { prop: 'type', label: '类型', width: 88, dict: dict.options('base_menu_type') },
    { prop: 'router', label: '路由', minWidth: 160 },
    { prop: 'keepAlive', label: '缓存', width: 88, slot: 'cell-keepAlive' },
    { prop: 'viewPath', label: '视图', minWidth: 180 },
    { prop: 'perms', label: '权限', minWidth: 180, slot: 'cell-perms' },
    { prop: 'orderNum', label: '排序', width: 80, sortable: true },
    {
      type: 'op',
      width: 220,
      buttons: (row) => [
        {
          label: '新增',
          variant: 'softPrimary',
          hidden: Number(row.type) === 2 || !service.base.menu._permission?.add,
          onClick: () => append(row),
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
    service: service.base.menu,
    onRefresh(params, { render }) {
      return service.base.menu.list(params).then(async (res) => {
        render(res as unknown as Record<string, unknown>[])
        await syncNav()
      })
    },
  },
  (app) => {
    void dict.refresh(['base_menu_type']).then(() => app.refresh())
  },
)

const autoOpen = ref(false)
/** 一键添加挂载的上级：编辑菜单/页面用当前 id；权限表单用 parentId */
const autoParentId = ref<number | null>(null)

function openAutoPerm() {
  const form =
    Crud.value?.getUpsertForm?.() ??
    (Crud.value as { upsertForm?: Record<string, unknown> } | undefined)?.upsertForm
  if (!form || typeof form !== 'object') return
  // 若仍是 Ref（未解包）
  const data =
    'value' in form && form.value && typeof form.value === 'object'
      ? (form.value as Record<string, unknown>)
      : (form as Record<string, unknown>)
  const type = Number(data.type)
  autoParentId.value =
    type === 2 ? normalizeParentId(data.parentId) : normalizeParentId(data.id)
  if (autoParentId.value == null && type !== 2) {
    autoParentId.value = normalizeParentId(data.parentId)
  }
  autoOpen.value = true
}

function patchForm(prop: string, value: unknown) {
  if (Crud.value?.patchUpsertForm) {
    Crud.value.patchUpsertForm({ [prop]: value })
    return
  }
  // 直接改解包后的表单对象
  const form = Crud.value?.getUpsertForm?.()
  if (form) Object.assign(form, { [prop]: value })
}

async function onAutoDone() {
  Crud.value?.upsertClose()
  await Crud.value?.refresh()
}
</script>

<style lang="scss" scoped>
.vm-menu-eps {
  grid-column: span 24;
  display: grid;
  gap: 6px;

  @media (max-width: 768px) {
    grid-column: span 12;
  }
}

.vm-menu-eps__label {
  font-size: 12px;
  color: var(--muted-foreground);
}

.vm-menu-eps__picker {
  min-width: 0;
}

.vm-menu-eps__auto {
  height: var(--vm-control-height);
  padding: 0 var(--vm-control-padding-x);
  white-space: nowrap;
}
</style>
