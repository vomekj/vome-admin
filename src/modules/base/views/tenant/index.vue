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
        <template #cell-domains="{ row }">
          <vm-tag-list
            v-if="domainList(row.domains).length"
            :model-value="domainList(row.domains)"
          />
          <span v-else class="vm-tenant-page__empty">—</span>
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

defineOptions({ name: 'base-tenant' })

const { service } = useVome()
const { dict } = useDict()

function domainList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((d) => String(d ?? '').trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

useUpsert({
  items: [
    { prop: 'name', label: '名称', required: true, span: 12 },
    {
      prop: 'code',
      label: '编码',
      required: true,
      span: 12,
      placeholder: '小写唯一编码，如 acme',
    },
    {
      prop: 'domains',
      label: '绑定域名',
      type: 'textarea',
      span: 12,
      placeholder: '商户访问域名，多个用逗号分隔，如 a.example.com, b.example.com',
    },
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
})

useTable({
  columns: [
    { type: 'selection' },
    { type: 'index', label: '#', width: 56 },
    { prop: 'name', label: '名称', minWidth: 140 },
    { prop: 'code', label: '编码', minWidth: 120 },
    {
      prop: 'domains',
      label: '绑定域名',
      minWidth: 220,
      slot: 'cell-domains',
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
    { prop: 'remark', label: '备注', minWidth: 140 },
    { prop: 'createTime', label: '创建时间', width: 170 },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})

const Crud = useCrud(
  { service: service.base.tenant },
  (app) => {
    void dict.refresh(['status']).then(() => app.refresh())
  },
)
</script>

<style lang="scss" scoped>
.vm-tenant-page__empty {
  color: var(--muted-foreground);
}
</style>
