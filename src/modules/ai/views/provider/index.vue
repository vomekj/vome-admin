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
defineOptions({ name: 'ai-provider' })

const { service } = useVome()
const { dict } = useDict()

useUpsert({
  items: [
    {
      prop: 'vendor',
      label: '厂商',
      required: true,
      span: 12,
      placeholder: '如 OpenAI / Anthropic / 自定义',
    },
    {
      prop: 'protocol',
      label: '协议',
      required: true,
      span: 12,
      type: 'select',
      options: dict.stringOptions('base_ai_protocol'),
      value: 'openai_compatible',
    },
    {
      prop: 'baseUrl',
      label: '接口地址',
      required: true,
      span: 12,
      placeholder: '如 https://api.example.com',
    },
    {
      prop: 'apiKey',
      label: 'API 密钥',
      required: true,
      span: 12,
      type: 'input',
      component: { props: { type: 'password' } },
      placeholder: '编辑填 ******** 表示不改',
    },
    {
      prop: 'status',
      label: '状态',
      span: 12,
      type: 'switch',
      value: 1,
      component: {
        props: { activeValue: 1, inactiveValue: 0 },
      },
    },
    { prop: 'remark', label: '备注', type: 'textarea', span: 12 },
  ],
})

useTable({
  columns: [
    { type: 'selection' },
    { prop: 'id', label: 'ID', width: 72 },
    { prop: 'vendor', label: '厂商', minWidth: 140 },
    {
      prop: 'protocol',
      label: '协议',
      minWidth: 140,
      dict: dict.options('base_ai_protocol'),
    },
    { prop: 'baseUrl', label: '接口地址', minWidth: 180 },
    {
      prop: 'status',
      label: '状态',
      width: 88,
      component: {
        name: 'vm-switch',
        props: { activeValue: 1, inactiveValue: 0 },
      },
    },
    { prop: 'remark', label: '备注', minWidth: 120 },
    { prop: 'createTime', label: '创建时间', width: 170 },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})

const Crud = useCrud(
  { service: service.ai.provider },
  (app) => {
    void dict.refresh(['status', 'base_ai_protocol']).then(() => app.refresh())
  },
)
</script>
