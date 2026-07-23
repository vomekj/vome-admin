<template>
  <vm-crud ref="Crud">
    <vm-row>
      <vm-search />
    </vm-row>
    <vm-row>
      <vm-refresh-btn />
      <vm-action-btn
        variant="primary"
        icon="ri-add-line"
        :label="localeStore.t('crud.add', '新增')"
        @click="openEditor()"
      />
      <vm-toolbar :show-add="false">
        <vm-action-btn
          icon="ri-refresh-line"
          :label="
            syncingZh
              ? localeStore.t('i18n.syncing', '同步中…')
              : localeStore.t('i18n.syncPack', '同步语言包')
          "
          :loading="syncingZh"
          :disabled="syncingZh"
          @click="syncHostZh"
        />
      </vm-toolbar>
    </vm-row>
    <vm-row>
      <vm-table />
    </vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>

    <vm-upsert
      title="编辑语言包"
      :items="[]"
      :height="800"
      layout="fill"
      close-text="取消"
    >
      <template #title-extra>
        <div class="vm-i18n-pack__meta">
          <span>语言：{{ editorMeta.langLabel }}</span>
          <span>标识：{{ editorMeta.scopeKeyLabel }}</span>
          <span v-if="editorMeta.version">版本：v{{ editorMeta.version }}</span>
          <span v-else class="vm-i18n-pack__meta-hint">尚未保存</span>
        </div>
      </template>
      <template #default>
        <div class="vm-i18n-pack__body">
          <div class="vm-i18n-pack__toolbar">
            <label class="vm-i18n-pack__field">
              <span>语种</span>
              <vm-select
                v-model="editorForm.langCode"
                :options="langOptions"
                :refresh-on-change="false"
                width="160px"
                placeholder="请选择语种"
                @change="onLangChange"
              />
            </label>
            <label class="vm-i18n-pack__field">
              <span>AI 模型</span>
              <vm-select
                v-model="editorForm.model"
                :options="chatModelOptions"
                :refresh-on-change="false"
                width="180px"
                placeholder="请选择模型"
              />
            </label>
            <vm-action-btn
              variant="primary"
              icon="ri-magic-line"
              :label="translating ? '翻译中…' : 'AI 翻译'"
              :loading="translating"
              :disabled="translating || editorForm.langCode === 'zh-CN'"
              @click="runTranslate"
            />
            <vm-action-btn
              :label="reloading ? '加载中…' : '重新加载'"
              :loading="reloading"
              :disabled="reloading || translating"
              @click="reloadEditor"
            />
            <vm-action-btn
              label="格式化"
              :disabled="translating"
              @click="formatJson"
            />
          </div>
          <div class="vm-i18n-pack__editor">
            <vm-json-editor
              ref="JsonEditor"
              v-model="editorJson"
              fill
              :disabled="translating"
              :format-on-blur="!translating"
            />
          </div>
        </div>
      </template>
    </vm-upsert>
  </vm-crud>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { isAiStreamResult } from '/@/api/client'
import { useLocaleStore } from '@/stores/locale'

defineOptions({ name: 'i18n-pack' })

const { service } = useVome()
const { dict } = useDict()
const localeStore = useLocaleStore()

const syncingZh = ref(false)
const editorJson = ref<Record<string, unknown>>({})
const editorId = ref<number | null>(null)
const translating = ref(false)
const reloading = ref(false)
const loadingLang = ref(false)
const chatModels = ref<Array<{ code: string }>>([])
const langOptions = ref<Array<{ label: string; value: string }>>([])
const langNameMap = ref<Record<string, string>>({})
const JsonEditor = ref<{
  setText: (v: unknown) => void
  beginStream: () => void
  endStream: () => void
} | null>(null)

const chatModelOptions = computed(() =>
  chatModels.value.map((m) => ({ label: m.code, value: m.code })),
)

const editorForm = reactive({
  langCode: 'en-US',
  scopeKey: 'admin',
  model: '',
  version: 0,
})

function inferScopeType(scopeKey: string): 'host' | 'plugin' {
  const key = String(scopeKey || '').trim()
  return key === 'admin' || key === 'web' || key === 'uniapp' ? 'host' : 'plugin'
}

const editorMeta = computed(() => {
  const langLabel =
    langOptions.value.find((o) => o.value === editorForm.langCode)?.label ||
    editorForm.langCode
  return {
    langLabel: `${langLabel} (${editorForm.langCode})`,
    scopeKeyLabel: editorForm.scopeKey || '—',
    version: editorForm.version,
  }
})

const Crud = useCrud(
  { service: service.i18n.pack },
  (app) => {
    void Promise.all([
      dict.refresh(['status']),
      loadLangOptions(),
      loadChatModels(),
    ]).then(() => app.refresh())
  },
)

useUpsert({
  async onOpen(data) {
    await loadLangOptions()
    await loadChatModels()
    const id = data.id != null ? Number(data.id) : null
    editorId.value = Number.isFinite(id) && id! > 0 ? id : null
    editorForm.langCode = String(
      data.langCode ||
        langOptions.value.find((o) => o.value !== 'zh-CN')?.value ||
        langOptions.value[0]?.value ||
        'zh-CN',
    )
    editorForm.scopeKey = String(data.scopeKey || 'admin')
    editorForm.version = Number(data.version || 0)
    editorForm.model = chatModels.value[0]?.code || ''
    if (data.packJson && typeof data.packJson === 'object') {
      editorJson.value = data.packJson as Record<string, unknown>
    } else {
      editorJson.value = {}
    }
    // 保证当前语种在选项中（Select 否则显示占位）
    if (
      editorForm.langCode &&
      !langOptions.value.some((o) => o.value === editorForm.langCode)
    ) {
      langOptions.value = [
        ...langOptions.value,
        { label: editorForm.langCode, value: editorForm.langCode },
      ]
    }
    // 列表编辑已带包内容；新增打开时按语种拉取是否已有包
    if (!editorId.value) {
      void loadPackByLang(editorForm.langCode)
    }
  },
  async onSubmit(_data, { close }) {
    const packJson = asPackObject(editorJson.value)
    const scopeKey = editorForm.scopeKey.trim()
    if (!scopeKey) {
      toast.error('标识无效')
      return
    }
    const payload = {
      langCode: editorForm.langCode,
      scopeType: inferScopeType(scopeKey),
      scopeKey,
      packJson,
    }
    if (editorId.value) {
      await service.i18n.pack.update({ id: editorId.value, ...payload })
      toast.success('已更新语言包')
    } else {
      const created = (await service.i18n.pack.add(payload)) as { id?: number }
      editorId.value = created?.id ?? null
      toast.success('已新增语言包')
    }
    close()
    Crud.value?.refresh()
    void localeStore.loadLangs()
  },
})

async function loadLangOptions() {
  const toOpts = (
    raw: unknown,
  ): Array<{ label: string; value: string; id: number }> => {
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { list?: unknown })?.list)
        ? ((raw as { list: unknown[] }).list ?? [])
        : []
    return arr
      .map((l) => {
        const row = l as {
          id?: number
          name?: string
          code?: string
          label?: string
          value?: string
        }
        const value = String(row.code || row.value || '').trim()
        const label = String(row.name || row.label || value).trim()
        const id = Number(row.id)
        return value
          ? {
              label: label || value,
              value,
              id: Number.isFinite(id) ? id : Number.MAX_SAFE_INTEGER,
            }
          : null
      })
      .filter(
        (o): o is { label: string; value: string; id: number } => !!o,
      )
      .sort((a, b) => a.id - b.id)
  }

  let opts: Array<{ label: string; value: string; id: number }> = []
  try {
    opts = toOpts(await service.i18n.lang.list({}))
  } catch {
    /* ignore */
  }
  if (!opts.length) {
    try {
      opts = toOpts(await service.i18n.lang.enabled())
    } catch {
      /* ignore */
    }
  }
  if (!opts.length) {
    try {
      opts = toOpts(
        await service.i18n.lang.page({ page: 1, size: 200 }),
      )
    } catch {
      /* ignore */
    }
  }
  langOptions.value = opts.map(({ label, value }) => ({ label, value }))
  langNameMap.value = Object.fromEntries(
    opts.map(({ label, value }) => [value, label]),
  )
  const cur = String(editorForm.langCode || '').trim()
  if (cur && !langOptions.value.some((o) => o.value === cur)) {
    langOptions.value = [...langOptions.value, { label: cur, value: cur }]
  }
}

async function loadChatModels() {
  try {
    const list = (await service.i18n.pack.chatModels()) as Array<{
      code: string
    }>
    chatModels.value = list ?? []
  } catch {
    chatModels.value = []
  }
}

function asPackObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('语言包须为 JSON 对象')
  }
  return raw as Record<string, unknown>
}

async function syncHostZh() {
  if (syncingZh.value) return
  syncingZh.value = true
  try {
    const res = (await service.i18n.pack.ensureHostZh()) as {
      hosts?: Array<{ scopeKey: string }>
      hostSkipped?: Array<{ scopeKey: string; reason: string }>
    }
    const skipped = res?.hostSkipped ?? []
    if (skipped.length) {
      toast.warning(
        `已同步；跳过 ${skipped.map((s) => `${s.scopeKey}: ${s.reason}`).join('；')}`,
      )
    } else {
      toast.success('已同步语言包')
    }
    Crud.value?.refresh()
    void localeStore.loadLangs()
  } catch (e) {
    if (!(e as { toasted?: boolean }).toasted) {
      toast.error(e instanceof Error ? e.message : '同步失败')
    }
  } finally {
    syncingZh.value = false
  }
}

/** 按当前标识 + 语种加载已有包；无则进入新增态 */
async function loadPackByLang(langCode: string) {
  if (loadingLang.value) return
  loadingLang.value = true
  try {
    const scopeKey = editorForm.scopeKey.trim() || 'admin'
    const row = (await service.i18n.pack.active({
      langCode,
      scopeType: inferScopeType(scopeKey),
      scopeKey,
    })) as {
      id?: number
      packJson?: Record<string, unknown>
      version?: number
    } | null
    if (row?.id) {
      editorId.value = Number(row.id)
      editorJson.value = (row.packJson as Record<string, unknown>) ?? {}
      editorForm.version = Number(row.version || 0)
    } else {
      editorId.value = null
      editorJson.value = {}
      editorForm.version = 0
    }
  } catch (e) {
    editorId.value = null
    editorJson.value = {}
    editorForm.version = 0
    if (!(e as { toasted?: boolean }).toasted) {
      toast.error(e instanceof Error ? e.message : '加载语言包失败')
    }
  } finally {
    loadingLang.value = false
  }
}

function onLangChange(v: string | number | boolean) {
  const langCode = String(v || '').trim()
  if (!langCode) return
  editorForm.langCode = langCode
  void loadPackByLang(langCode)
}

async function openEditor() {
  await Promise.all([loadChatModels(), loadLangOptions()])
  const langCode =
    langOptions.value.find((o) => o.value !== 'zh-CN')?.value ||
    langOptions.value[0]?.value ||
    'en-US'
  Crud.value?.openUpsert(
    {
      langCode,
      scopeKey: 'admin',
      version: 0,
      packJson: {},
    },
    'add',
  )
}

async function reloadEditor() {
  if (reloading.value) return
  reloading.value = true
  try {
    await loadPackByLang(editorForm.langCode)
    toast.success(editorId.value ? '已重新加载' : '当前语种尚无语言包')
  } finally {
    reloading.value = false
  }
}

function formatJson() {
  try {
    editorJson.value = { ...asPackObject(editorJson.value) }
    toast.success('已格式化')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'JSON 无效')
  }
}

async function runTranslate() {
  if (translating.value) return
  if (!chatModels.value.length) {
    toast.error('请先配置 AI 能力')
    return
  }
  if (!editorForm.model) {
    toast.error('请选择 AI 模型')
    return
  }
  if (editorForm.langCode === 'zh-CN') {
    toast.error('请选择非中文目标语种')
    return
  }
  const scopeKey = editorForm.scopeKey.trim()
  if (!scopeKey) {
    toast.error('标识无效')
    return
  }
  translating.value = true
  JsonEditor.value?.beginStream()
  JsonEditor.value?.setText('')
  try {
    const langName =
      langOptions.value.find((o) => o.value === editorForm.langCode)?.label ||
      editorForm.langCode
    const out = await service.i18n.pack.translate({
      langCode: editorForm.langCode,
      langName,
      scopeType: inferScopeType(scopeKey),
      scopeKey,
      model: editorForm.model,
    })
    if (!isAiStreamResult(out)) {
      const row = out as { packJson?: Record<string, unknown> }
      editorJson.value = (row?.packJson as Record<string, unknown>) ?? {}
      toast.success(
        editorId.value
          ? 'AI 翻译完成，确认后将更新语言包'
          : 'AI 翻译完成，确认后将新增语言包',
      )
      return
    }
    let fullText = ''
    let gotPack = false
    for await (const chunk of out.stream) {
      if (chunk.type === 'error') {
        throw new Error(chunk.error?.message || 'AI 翻译失败')
      }
      if (chunk.type === 'delta') {
        const next =
          typeof chunk.data?.fullText === 'string'
            ? chunk.data.fullText
            : fullText + (chunk.text || '')
        fullText = next
        JsonEditor.value?.setText(fullText)
      }
      if (chunk.type === 'done') {
        const packJson = chunk.data?.packJson as
          | Record<string, unknown>
          | undefined
        if (packJson && typeof packJson === 'object') {
          gotPack = true
          JsonEditor.value?.endStream()
          editorJson.value = packJson
        } else if (typeof chunk.data?.fullText === 'string') {
          fullText = chunk.data.fullText
          JsonEditor.value?.setText(fullText)
        } else if (chunk.text) {
          fullText = chunk.text
          JsonEditor.value?.setText(fullText)
        }
      }
    }
    if (!gotPack && fullText.trim()) {
      try {
        editorJson.value = asPackObject(JSON.parse(fullText))
      } catch {
        /* 保留流式原文，确定前可再编辑 */
      }
    }
    toast.success(
      editorId.value
        ? 'AI 翻译完成，确认后将更新语言包'
        : 'AI 翻译完成，确认后将新增语言包',
    )
  } catch (e) {
    if (!(e as { toasted?: boolean }).toasted) {
      toast.error(e instanceof Error ? e.message : '翻译失败')
    }
  } finally {
    JsonEditor.value?.endStream()
    translating.value = false
  }
}

useTable({
  columns: [
    { type: 'selection', width: 48 },
    { prop: 'id', label: 'ID', width: 72 },
    { prop: 'langCode', label: '语种', width: 100 },
    {
      prop: 'langName',
      label: '语言名称',
      labelKey: 'i18n.langName',
      width: 120,
      formatter: (row: { langCode?: string }) =>
        langNameMap.value[String(row.langCode || '')] ||
        String(row.langCode || '—'),
    },
    { prop: 'scopeKey', label: '标识', width: 160 },
    { prop: 'version', label: '版本', width: 72 },
    { prop: 'updateTime', label: '更新时间', width: 170 },
    { type: 'op', width: 140, buttons: ['edit', 'delete'] },
  ],
})
</script>

<style lang="scss" scoped>
.vm-i18n-pack__body {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  align-self: stretch;
  min-height: 0;
  padding: 8px 22px 16px;
  box-sizing: border-box;
  gap: 10px;
}

.vm-i18n-pack__meta {
  display: inline-flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;
  min-width: 360px;
  max-width: 100%;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--muted);
  font-size: 12px;
  color: var(--muted-foreground);
}

.vm-i18n-pack__meta-hint {
  color: var(--brand);
}

.vm-i18n-pack__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  flex: 0 0 auto;
  gap: 10px;
}

.vm-i18n-pack__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--muted-foreground);
}

.vm-i18n-pack__editor {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
</style>
