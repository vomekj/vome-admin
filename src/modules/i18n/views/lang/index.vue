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

useUpsert({
  items: [
    {
      prop: 'flag',
      label: '国旗',
      span: 12,
      component: {
        name: 'vm-upload',
        props: {
          type: 'image',
          text: '上传图片',
          size: 96,
          limitSize: 10,
          prefixPath: 'app/public/i18n/lang',
        },
      },
    },
  ],
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
