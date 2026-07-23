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
const { dict } = useDict()

const Crud = useCrud(
  { service: service.i18n.lang },
  (app) => {
    void dict.refresh(['status']).then(() => app.refresh())
  },
)

useUpsert({
  items: [
    {
      prop: 'code',
      label: '语种编码',
      required: true,
      span: 12,
      placeholder: '如 zh-CN / en-US',
    },
    {
      prop: 'name',
      label: '语言名称',
      required: true,
      span: 12,
      placeholder: '如 简体中文',
    },
    {
      prop: 'flag',
      label: '国旗',
      required: true,
      span: 12,
      placeholder: '如 🇨🇳',
    },
    {
      prop: 'orderNum',
      label: '排序',
      span: 12,
      type: 'number',
      value: 0,
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
  ],
})

useTable({
  columns: [
    { type: 'selection', width: 48 },
    { prop: 'id', label: 'ID', width: 72 },
    { prop: 'flag', label: '国旗', width: 72, slot: 'cell-flag' },
    { prop: 'code', label: '编码', width: 120 },
    { prop: 'name', label: '语言名称', width: 140 },
    { prop: 'orderNum', label: '排序', width: 88 },
    {
      prop: 'status',
      label: '状态',
      width: 88,
      component: {
        name: 'vm-switch',
        props: { activeValue: 1, inactiveValue: 0 },
      },
    },
    { prop: 'createTime', label: '创建时间', width: 170 },
    { type: 'op', width: 140, buttons: ['edit', 'delete'] },
  ],
})
</script>

<style lang="scss" scoped>
.vm-i18n-lang__flag {
  font-size: 20px;
  line-height: 1;
}
</style>
