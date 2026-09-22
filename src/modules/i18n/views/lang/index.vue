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
defineOptions({ name: 'i18n-lang' })

const { service } = useVome()

// 国旗由服务端按语种编码自动拉取 Flagcdn 并转存，表单不手传
useUpsert({
  ignoreFields: ['flag'],
})

useTable({
  defaultSort: { prop: 'id', order: 'desc' },
  columns: [
    {
      prop: 'flag',
      label: '国旗',
      width: 88,
      component: {
        name: 'vm-preview-viewer',
        props: { size: 28 },
      },
    },
  ],
})

const Crud = useCrud({ service: service.i18n.lang }, (app) => {
  app.refresh()
})
</script>
