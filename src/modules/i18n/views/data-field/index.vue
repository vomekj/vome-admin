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
const { dict } = useDict()

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
    {
      prop: 'tableName',
      label: '业务表',
      required: true,
      span: 12,
      placeholder: '如 game_skin / boxbattle_box_log',
    },
    {
      prop: 'fieldName',
      label: '字段名',
      required: true,
      span: 12,
      placeholder: '如 skinName',
    },
    {
      prop: 'pkField',
      label: '主键列',
      span: 12,
      value: 'id',
    },
    {
      prop: 'mode',
      label: '映射模式',
      span: 12,
      value: 'direct',
      component: {
        name: 'vm-select',
        props: { options: modeOptions },
      },
    },
    {
      prop: 'sourceTable',
      label: '源表',
      span: 12,
      placeholder: 'ref：如 game_skin',
    },
    {
      prop: 'sourceField',
      label: '源表字段',
      span: 12,
      placeholder: '默认同字段名',
    },
    {
      prop: 'joinField',
      label: '关联列',
      span: 12,
      placeholder: 'ref：本表列，如 steamId',
    },
    {
      prop: 'sourceJoinField',
      label: '源表关联列',
      span: 12,
      placeholder: '默认同关联列',
    },
    {
      prop: 'sourcePkField',
      label: '源表主键',
      span: 12,
      value: 'id',
    },
    {
      prop: 'status',
      label: '状态',
      span: 12,
      type: 'switch',
      value: 1,
      component: { props: dict.get('status') },
    },
    {
      prop: 'remark',
      label: '备注',
      span: 24,
      type: 'textarea',
    },
  ],
})

useTable({
  columns: [
    { prop: 'tableName', label: '业务表', minWidth: 140 },
    { prop: 'fieldName', label: '字段', minWidth: 120 },
    { prop: 'mode', label: '模式', width: 90 },
    { prop: 'sourceTable', label: '源表', minWidth: 120 },
    { prop: 'joinField', label: '关联列', minWidth: 100 },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      dict: dict.get('status'),
    },
    { prop: 'remark', label: '备注', minWidth: 160 },
  ],
})
</script>
