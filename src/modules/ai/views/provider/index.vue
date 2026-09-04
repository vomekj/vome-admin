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

useUpsert({
  ignoreFields: ['extra'],
  items: [
    {
      prop: 'protocol',
      label: '协议',
      value: 'openai_compatible',
    },
    {
      prop: 'apiKey',
      label: 'API密钥',
      required: true,
      component: { props: { type: 'password' } },
      placeholder: '编辑填 ******** 表示不改',
    },
  ],
})

useTable({
  ignoreFields: ['apiKey', 'extra'],
})

const Crud = useCrud(
  { service: service.ai.provider },
  (app) => {
    app.refresh()
  },
)
</script>
