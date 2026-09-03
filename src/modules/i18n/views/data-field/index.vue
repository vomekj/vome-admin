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
      <vm-table />
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>
    <vm-upsert ref="Upsert" />
  </vm-crud>
</template>

<script setup lang="ts">
defineOptions({ name: 'i18n-data-field' })

const { service } = useVome()

const modeOptions = [
  { label: '本表 direct', value: 'direct' },
  { label: '源表 ref', value: 'ref' },
]

const Crud = useCrud(
  { service: service.i18n.dataField },
  (app) => {
    app.refresh()
  },
)

useUpsert({
  items: [
    { prop: 'pkField', label: '主键列', value: 'id' },
    {
      prop: 'mode',
      label: '映射模式',
      value: 'direct',
      component: {
        name: 'vm-select',
        props: { options: modeOptions },
      },
    },
    { prop: 'sourcePkField', label: '源表主键', value: 'id' },
    { prop: 'remark', label: '备注', span: 24 },
  ],
})

useTable({
  ignoreFields: [
    'selection',
    'op',
    'id',
    'pkField',
    'sourceField',
    'sourceJoinField',
    'sourcePkField',
    'createTime',
  ],
})
</script>
