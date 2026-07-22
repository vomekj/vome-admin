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
import { computed, ref } from 'vue'

defineOptions({ name: 'ai-provider' })

const { service } = useVome()
const { dict } = useDict()

useSearch({
  items: [
    {
      prop: 'keyWord',
      label: '关键字',
      placeholder: '名称 / 地址',
      type: 'input',
    },
    {
      prop: 'protocol',
      label: '协议',
      type: 'select',
      dict: 'base_ai_protocol',
    },
    {
      prop: 'vendor',
      label: '厂商',
      type: 'select',
      dict: 'base_ai_vendor',
    },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      dict: 'status',
    },
  ],
})

useUpsert({
  items: [
    { prop: 'name', label: '名称', required: true, span: 12 },
    {
      prop: 'vendor',
      label: '厂商',
      required: true,
      span: 12,
      type: 'select',
      options: computed(() => dict.stringOptions('base_ai_vendor')),
      value: 'custom',
    },
    {
      prop: 'protocol',
      label: '协议',
      required: true,
      span: 12,
      type: 'select',
      options: computed(() => dict.stringOptions('base_ai_protocol')),
      value: 'openai_compatible',
    },
    {
      prop: 'baseUrl',
      label: '接口地址',
      span: 12,
      placeholder: '可空，默认 https://api.openai.com',
    },
    {
      prop: 'apiKey',
      label: 'API 密钥',
      span: 12,
      type: 'input',
      component: { props: { type: 'password' } },
      placeholder: '新建必填；编辑留空或 ******** 表示不改',
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
    { prop: 'remark', label: '备注', type: 'textarea', span: 24 },
  ],
})

useTable({
  columns: [
    { type: 'selection' },
    { type: 'index', label: '#', width: 56 },
    { prop: 'name', label: '名称', minWidth: 140 },
    {
      prop: 'vendor',
      label: '厂商',
      width: 120,
      dict: dict.options('base_ai_vendor'),
    },
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

useCrud(
  { service: service.ai.provider },
  (app) => {
    void dict
      .refresh(['status', 'base_ai_protocol', 'base_ai_vendor'])
      .then(() => app.refresh())
  },
)
</script>
