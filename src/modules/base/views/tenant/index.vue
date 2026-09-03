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
    {
      prop: 'domains',
      label: '域名',
      type: 'textarea',
      placeholder: '商户访问域名，多个用逗号分隔，如 a.example.com, b.example.com',
    },
  ],
})

useTable({
  columns: [{ prop: 'domains', minWidth: 220, slot: 'cell-domains' }],
})

const Crud = useCrud(
  { service: service.base.tenant },
  (app) => {
    app.refresh()
  },
)
</script>

<style lang="scss" scoped>
.vm-tenant-page__empty {
  color: var(--muted-foreground);
}
</style>
