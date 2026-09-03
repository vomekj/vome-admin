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
        <template #cell-flag="{ value }">
          <span class="vm-i18n-lang__flag">{{ value || '🏳️' }}</span>
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
defineOptions({ name: 'i18n-lang' })

const { service } = useVome()

const Crud = useCrud(
  { service: service.i18n.lang },
  (app) => {
    app.refresh()
  },
)

useUpsert({
  items: [
    {
      prop: 'orderNum',
      label: '排序',
      value: 0,
    },
  ],
})

useTable({
  columns: [{ prop: 'flag', width: 72, slot: 'cell-flag' }],
})
</script>

<style lang="scss" scoped>
.vm-i18n-lang__flag {
  font-size: 20px;
  line-height: 1;
}
</style>
