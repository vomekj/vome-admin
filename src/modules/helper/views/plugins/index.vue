<template>
  <div class="vm-plugin-page">
    <header class="vm-plugin-page__bar">
      <vm-page-tabs v-model="activeTab" :tabs="[...tabs]" />
      <vm-inline-search
        v-if="activeTab !== 'dev'"
        v-model="keyword"
        placeholder="搜索插件名称"
        @search="loadList()"
      />
    </header>

    <div
      v-if="activeTab === 'installed'"
      class="vm-plugin-page__body vm-scroll"
      @scroll.passive="onInstalledScroll"
    >
      <vm-empty
        v-if="!listReady"
        kind="暂无内容"
        class="vm-plugin-page__empty"
      />
      <vm-card-grid v-else class="vm-plugin-page__grid" gap="12px">
        <vm-card
          add
          bordered
          compact
          :disabled="installing"
          @click="pickFile"
        >
          <i class="ri-add-line" />
          <span>{{ installing ? '安装中…' : '安装插件' }}</span>
        </vm-card>

        <vm-card
          v-for="item in list"
          :key="item.id"
          bordered
          compact
        >
          <vm-card-head>
            <template #media>
              <vm-thumb :src="logoSrc(item) || undefined" icon="ri-plug-line" />
            </template>
            <template #tags>
              <vm-tag-list :tags="pluginTags(item)" />
            </template>
            <template #actions>
              <vm-icon-btn
                icon="ri-delete-bin-line"
                title="卸载"
                variant="danger"
                :disabled="deletingId === item.id"
                @click="onDelete(item)"
              />
              <vm-icon-btn
                icon="ri-settings-3-line"
                title="设置"
                @click="openEdit(item)"
              />
            </template>
          </vm-card-head>

          <vm-card-title :text="item.name">{{ item.name }}</vm-card-title>
          <vm-clamp-text :text="item.description || '暂无描述'" />
          <vm-card-meta :text="pluginMeta(item)" />

          <template #footer>
            <vm-toggle-switch
              :model-value="item.status"
              :loading="statusId === item.id"
              :disabled="statusId === item.id"
              @update:model-value="toggleStatus(item)"
            />
            <vm-action-btn
              size="sm"
              variant="outline"
              :label="readmeLoadingId === item.id ? '加载中…' : '文档'"
              :disabled="!item.hasReadme || readmeLoadingId === item.id"
              @click="openReadme(item)"
            />
          </template>
        </vm-card>
      </vm-card-grid>
    </div>

    <div v-else-if="activeTab === 'market'" class="vm-plugin-page__body vm-scroll">
      <vm-empty
        v-if="!filteredMarketList.length"
        kind="暂无内容"
        class="vm-plugin-page__empty"
      />
      <vm-card-grid v-else class="vm-plugin-page__grid" gap="12px">
        <vm-card
          v-for="item in filteredMarketList"
          :key="item.id ?? item.keyName"
          bordered
          compact
          footer-end
        >
          <vm-card-head>
            <template #media>
              <vm-thumb :src="logoSrc(item) || undefined" icon="ri-plug-line" />
            </template>
            <template #tags>
              <vm-tag-list :tags="pluginTags(item)" />
            </template>
          </vm-card-head>

          <vm-card-title :text="item.name">{{ item.name }}</vm-card-title>
          <vm-clamp-text :text="item.description || '暂无描述'" />
          <vm-card-meta :text="pluginMeta(item)" />

          <template #footer>
            <div class="vm-plugin-page__actions">
              <vm-action-btn
                size="sm"
                variant="success"
                label="预览"
                @click="onPreview(item)"
              />
              <vm-action-btn
                size="sm"
                variant="outline"
                label="文档"
                :disabled="!item.readme"
                @click="openReadme(item)"
              />
            </div>
          </template>
        </vm-card>
      </vm-card-grid>
    </div>

    <div v-else class="vm-plugin-page__body vm-scroll">
      <div class="vm-plugin-dev">
        <vm-card bordered compact class="vm-plugin-dev__intro">
          <h2 class="vm-plugin-dev__title">插件开发</h2>
          <p class="vm-plugin-dev__lead">
            下载对应脚手架后在本机真实环境中开发与打包；发布请使用官网上传。本页不提供在线编辑与一键发布。
          </p>
          <div class="vm-plugin-dev__links">
            <vm-action-btn
              size="sm"
              variant="outline"
              label="查看开发文档"
              @click="openExternal(pluginDev.docsUrl, '开发文档')"
            />
            <vm-action-btn
              size="sm"
              variant="success"
              label="官网上传"
              @click="openExternal(pluginDev.uploadUrl, '官网上传')"
            />
          </div>
        </vm-card>

        <vm-card-grid min-width="280px" gap="12px">
          <vm-card
            v-for="item in scaffoldList"
            :key="item.key"
            bordered
            compact
            footer-end
          >
            <vm-thumb :size="40" :icon="scaffoldIcon(item.key)" />
            <vm-card-title :text="item.title">{{ item.title }}</vm-card-title>
            <vm-clamp-text :lines="3" :text="item.desc" />
            <template #footer>
              <div class="vm-plugin-dev__dl">
                <vm-action-btn
                  size="sm"
                  variant="outline"
                  label="下载 Gitee"
                  @click="openExternal(item.downloadUrl, `${item.title}（Gitee）`)"
                />
                <vm-action-btn
                  size="sm"
                  variant="outline"
                  label="GitHub"
                  @click="
                    openExternal(
                      item.githubDownloadUrl,
                      `${item.title}（GitHub）`,
                    )
                  "
                />
              </div>
            </template>
          </vm-card>
        </vm-card-grid>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".vome,application/zip"
      class="vm-plugin-page__file"
      @change="onFileChange"
    />

    <vm-crud
      ref="HostCrud"
      class="vm-plugin-upsert-host"
      :service="service.base.plugin"
      :immediate="false"
    >
      <vm-upsert
        :title="upsertTitle"
        :items="upsertItems"
        :confirm="upsertConfirm"
        :height="upsertHeight"
        :layout="upsertLayout"
        :close-text="upsertScene === 'readme' ? '关闭' : '取消'"
      >
        <template #default="{ form }">
          <template v-if="upsertScene === 'config'">
            <div class="vm-crud-upsert__field" style="grid-column: span 12">
              <Label class="vm-crud-upsert__label">
                参数 <span class="vm-crud-upsert__req">*</span>
              </Label>
              <vm-json-editor
                :model-value="form.configText"
                :rows="16"
                @update:model-value="
                  HostCrud?.patchUpsertForm({
                    configText: prettyConfig($event),
                  })
                "
              />
            </div>
            <vm-form-hint style="grid-column: 1 / -1">
              密钥类字段以 ******** 回显；未改动直接保存会保留原密钥。保存后立即热注入服务。
            </vm-form-hint>
          </template>
          <div v-else class="vm-plugin-doc">
            <div class="vm-plugin-doc__meta">
              <span>作者: {{ readmeAuthor || '未知' }}</span>
              <span v-if="readmeTime">更新时间: {{ readmeTime }}</span>
            </div>
            <div class="vm-plugin-doc__frame">
              <vm-markdown :source="readmeText" />
            </div>
          </div>
        </template>
        <template #footer="{ close, submit, submitting }">
          <button
            v-if="upsertScene === 'config'"
            type="button"
            class="vm-crud-shell__btn is-ghost"
            :disabled="submitting || saving"
            @click="formatEditConfig"
          >
            格式化
          </button>
          <div class="vm-plugin-upsert-foot__right">
            <button
              type="button"
              class="vm-crud-shell__btn is-ghost"
              :disabled="submitting || saving"
              @click="close()"
            >
              {{ upsertScene === 'readme' ? '关闭' : '取消' }}
            </button>
            <button
              v-if="upsertScene === 'config'"
              type="button"
              class="vm-crud-shell__btn is-primary"
              :disabled="submitting || saving"
              @click="submit()"
            >
              {{ submitting || saving ? '保存中…' : '保存' }}
            </button>
            <vm-copy-btn
              v-if="upsertScene === 'readme'"
              :text="readmeText"
              @copied="toast.success('已复制文档内容')"
              @error="toast.error('复制失败')"
            />
          </div>
        </template>
      </vm-upsert>
    </vm-crud>
  </div>
</template>

<script setup lang="ts">

import { getAccessToken } from 'vome-core/admin/api/client'
import { pluginDev } from '/@'
import type { PluginScaffoldKey } from '/@'

defineOptions({ name: 'helper-plugins' })

const scaffoldList = Object.values(pluginDev.scaffolds)

function scaffoldIcon(key: PluginScaffoldKey | string) {
  if (key === 'full') return 'ri-stack-line'
  if (key === 'frontend') return 'ri-layout-4-line'
  return 'ri-server-line'
}

function openExternal(url: string, label: string) {
  const href = String(url || '').trim()
  if (!href) {
    toast.message(`${label}地址未配置`)
    return
  }
  window.open(href, '_blank', 'noopener,noreferrer')
}

type PluginRow = {
  id?: number
  name?: string
  description?: string
  keyName?: string
  hook?: string
  /** 列表不再回传；仅市场本地数据或 info 单条拉取 */
  readme?: string
  /** 列表轻量标记：是否有文档 */
  hasReadme?: boolean
  version?: string
  logo?: string
  author?: string
  status?: number
  createTime?: string | Date
}

const { service } = useVome()

const tabs = [
  { key: 'installed', label: '已安装' },
  { key: 'market', label: '全部插件' },
  { key: 'dev', label: '插件开发' },
] as const

const PAGE_SIZE = 30
const activeTab = ref<(typeof tabs)[number]['key']>('installed')
const keyword = ref('')
const list = ref<PluginRow[]>([])
/** 插件市场列表（暂无接口，空则显示缺省图） */
const marketList = ref<PluginRow[]>([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
/** 已装列表完成过至少一次加载；之后刷新不拆网格，避免卡片闪缩 */
const listReady = ref(false)
const installing = ref(false)
const deletingId = ref<number | null>(null)
const statusId = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const saving = ref(false)
const editId = ref(0)

const upsertScene = ref<'config' | 'readme'>('config')
const upsertTitle = ref('设置')
const upsertConfirm = computed(() => upsertScene.value === 'config')
const upsertHeight = computed(() =>
  upsertScene.value === 'readme' ? 800 : undefined,
)
const upsertLayout = computed(() =>
  upsertScene.value === 'readme' ? 'fill' : 'form',
)

const upsertItems = computed((): CrudFormItem[] => [])

const HostCrud = useCrud({
  service: service.base.plugin,
  permission: {
    add: true,
    update: true,
    delete: false,
    info: true,
    page: false,
    list: false,
  },
})

useUpsert({
  sync: true,
  async onSubmit(data, { close }) {
    if (upsertScene.value !== 'config') return
    if (saving.value || !editId.value) return
    let config: unknown
    try {
      config = JSON.parse(String(data.configText || '{}'))
    } catch {
      toast.error('参数必须是合法 JSON')
      return
    }
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      toast.error('参数须为 JSON 对象')
      return
    }
    saving.value = true
    try {
      await service.base.plugin.update({
        id: editId.value,
        config,
      })
      toast.success('参数已保存并注入服务')
      close()
    } catch (e) {
      console.error(e)
    } finally {
      saving.value = false
    }
  },
})

const readmeText = ref('')
const readmeAuthor = ref('')
const readmeTime = ref('')
const readmeLoadingId = ref<number | null>(null)

const hasMore = computed(() => list.value.length < total.value)

function filterByKeyword(rows: PluginRow[]) {
  const q = keyword.value.toLowerCase()
  if (!q) return rows
  return rows.filter((item) => {
    const name = String(item.name || '').toLowerCase()
    const key = String(item.keyName || '').toLowerCase()
    return name.includes(q) || key.includes(q)
  })
}

const filteredMarketList = computed(() => filterByKeyword(marketList.value))

function typeLabel(item: PluginRow) {
  return item.hook ? '后端' : '模块'
}

function pluginTags(item: PluginRow) {
  return [
    { label: String(item.keyName || '-'), variant: 'brand' as const },
    { label: `v${item.version || '-'}`, variant: 'outline' as const },
    { label: typeLabel(item), variant: 'muted' as const },
  ]
}

function pluginMeta(item: PluginRow) {
  const author = item.author || '未知作者'
  const time = item.createTime ? ` · ${formatTime(item.createTime)}` : ''
  return `${author}${time}`
}

function prettyConfig(v: unknown) {
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v ?? '')
  }
}

function logoSrc(item: PluginRow) {
  const logo = String(item.logo || '').trim()
  if (!logo) return ''
  if (logo.startsWith('http') || logo.startsWith('data:')) return logo
  return `data:image/png;base64,${logo}`
}

function formatTime(v: unknown) {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** reset=true 从第 1 页重拉；false 追加下一页 */
async function loadList(reset = true) {
  if (reset) {
    if (loading.value) return
    loading.value = true
  } else {
    if (!listReady.value || loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  }
  const nextPage = reset ? 1 : page.value + 1
  try {
    const res = await service.base.plugin.page({
      page: nextPage,
      size: PAGE_SIZE,
      keyWord: keyword.value || undefined,
    })
    const rows = Array.isArray(res?.list) ? (res.list as PluginRow[]) : []
    total.value = Number(res?.pagination?.total ?? 0)
    page.value = nextPage
    list.value = reset ? rows : [...list.value, ...rows]
  } catch (e) {
    console.error(e)
    if (reset) {
      list.value = []
      total.value = 0
      page.value = 1
    }
  } finally {
    loading.value = false
    loadingMore.value = false
    listReady.value = true
  }
}

function onInstalledScroll(ev: Event) {
  const el = ev.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight > 80) return
  void loadList(false)
}

function pickFile() {
  if (installing.value) return
  fileInput.value?.click()
}

async function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (installing.value) return
  installing.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(apiUrl('/admin/base/module/install'), {
      method: 'POST',
      headers: { authorization: `Bearer ${getAccessToken() || ''}` },
      body: fd,
    })
    const text = await res.text()
    if (!text?.trim()) {
      throw new Error('安装失败：服务无响应（请查看 service 日志）')
    }
    let json: { code?: number; message?: string }
    try {
      json = JSON.parse(text) as { code?: number; message?: string }
    } catch {
      throw new Error(
        res.ok
          ? '安装失败：服务返回非 JSON'
          : `安装失败：HTTP ${res.status}`,
      )
    }
    if (json.code !== 1000) {
      throw new Error(json.message || '安装失败')
    }
    toast.success('安装成功')
    await loadList()
  } catch (e) {
    console.error(e)
    const err = e as Error & { toasted?: boolean }
    if (!err.toasted) {
      toast.error(e instanceof Error && e.message ? e.message : '安装失败')
    }
  } finally {
    installing.value = false
  }
}

async function toggleStatus(item: PluginRow) {
  if (item.id == null || statusId.value === item.id) return
  const next = Number(item.status) === 1 ? 0 : 1
  statusId.value = item.id
  const prev = item.status
  item.status = next
  try {
    await service.base.plugin.update({ id: item.id, status: next })
  } catch (e) {
    item.status = prev
    console.error(e)
  } finally {
    statusId.value = null
  }
}

async function onDelete(item: PluginRow) {
  if (item.id == null || deletingId.value === item.id) return
  const ok = await vmConfirm({
    title: '卸载确认',
    message: `确定卸载插件「${item.name}」？`,
  })
  if (!ok) return
  deletingId.value = item.id
  try {
    // 优先按模块 key 卸载（含磁盘与钩子）；失败静默再删插件记录（避免双 toast）
    let removed = false
    if (item.keyName) {
      try {
        await request('/admin/base/module/delete', {
          method: 'POST',
          body: JSON.stringify({ key: String(item.keyName) }),
          toast: false,
        })
        removed = true
      } catch {
        /* 无落盘模块时退回删插件记录 */
      }
    }
    if (!removed) {
      await service.base.plugin.delete({ ids: [item.id] })
    }
    toast.success('已卸载')
    await loadList()
  } catch (e) {
    console.error(e)
  } finally {
    deletingId.value = null
  }
}

async function openEdit(item: PluginRow) {
  if (item.id == null) return
  editId.value = Number(item.id)
  upsertScene.value = 'config'
  upsertTitle.value = '设置'
  let configText = '{\n  "@local": {},\n  "@prod": {}\n}'
  try {
    const info = (await service.base.plugin.info({ id: item.id })) as {
      config?: unknown
    }
    const cfg = info?.config
    configText =
      cfg != null
        ? JSON.stringify(cfg, null, 2)
        : '{\n  "@local": {},\n  "@prod": {}\n}'
  } catch (e) {
    console.error(e)
    toast.error('加载插件参数失败')
    return
  }
  HostCrud.value?.openUpsert({ configText }, 'update')
}

function formatEditConfig() {
  const form = HostCrud.value?.getUpsertForm?.() || {}
  try {
    const parsed = JSON.parse(String(form.configText || '{}'))
    HostCrud.value?.patchUpsertForm({
      configText: JSON.stringify(parsed, null, 2),
    })
  } catch {
    toast.error('JSON 格式错误, 无法格式化')
  }
}

function showReadme(opts: {
  title: string
  text: string
  author?: string
  time?: string
}) {
  upsertScene.value = 'readme'
  upsertTitle.value = opts.title
  readmeText.value = opts.text
  readmeAuthor.value = opts.author || ''
  readmeTime.value = opts.time || ''
  HostCrud.value?.openUpsert({}, 'info')
}

async function openReadme(item: PluginRow) {
  // 市场本地数据仍可能自带 readme
  if (item.readme) {
    showReadme({
      title: String(item.name || '插件文档'),
      text: String(item.readme),
      author: String(item.author || ''),
      time: item.createTime ? formatTime(item.createTime) : '',
    })
    return
  }
  if (item.id == null || !item.hasReadme) return
  if (readmeLoadingId.value === item.id) return
  readmeLoadingId.value = item.id
  try {
    const info = (await service.base.plugin.info({ id: item.id })) as {
      readme?: string
      author?: string
      createTime?: string | Date
      name?: string
    }
    const text = String(info?.readme || '').trim()
    if (!text) {
      toast.message('暂无文档')
      return
    }
    showReadme({
      title: String(info?.name || item.name || '插件文档'),
      text,
      author: String(info?.author || item.author || ''),
      time: info?.createTime
        ? formatTime(info.createTime)
        : item.createTime
          ? formatTime(item.createTime)
          : '',
    })
  } catch (e) {
    console.error(e)
    toast.error('加载文档失败')
  } finally {
    readmeLoadingId.value = null
  }
}

function onPreview(item: PluginRow) {
  toast.message(`「${item.name || item.keyName || '插件'}」预览暂未接入`)
}

onMounted(() => {
  void loadList()
})
</script>

<style lang="scss" scoped>
.vm-plugin-page {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 4px;
}

.vm-plugin-page__bar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.vm-plugin-page__body {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  overflow: auto;
}

:deep(.vm-plugin-page__grid) {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (max-width: 1400px) {
  :deep(.vm-plugin-page__grid) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  :deep(.vm-plugin-page__grid) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {
  :deep(.vm-plugin-page__grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  :deep(.vm-plugin-page__grid) {
    grid-template-columns: 1fr;
  }
}

.vm-plugin-page__empty {
  flex: 1;
  justify-content: flex-start;
  padding-top: 72px;
}

.vm-plugin-page__actions {
  display: flex;
  gap: 8px;
}

.vm-plugin-page__file {
  display: none;
}

.vm-plugin-dev {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}

.vm-plugin-dev__intro :deep(.vm-card__inner) {
  padding: 18px 20px;
}

.vm-plugin-dev__title {
  margin: 0 0 8px;
  color: var(--foreground);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.vm-plugin-dev__lead {
  margin: 0 0 14px;
  max-width: 720px;
  color: var(--muted-foreground);
  font-size: 13px;
  line-height: 1.6;
}

.vm-plugin-dev__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.vm-plugin-dev__dl {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.vm-plugin-dev :deep(.vm-thumb) {
  margin-bottom: 12px;
}

.vm-plugin-upsert-host {
  display: none !important;
}

:deep(.vm-crud-upsert__foot) {
  justify-content: space-between;
  align-items: center;
}

.vm-plugin-upsert-foot__right {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  gap: 8px;
}

.vm-plugin-doc {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  align-self: stretch;
  gap: 12px;
  min-height: 0;
  padding: 16px 22px;
  box-sizing: border-box;
}

.vm-plugin-doc__meta {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px 20px;
  color: var(--muted-foreground);
  font-size: 13px;
  line-height: 1.4;
}

.vm-plugin-doc__frame {
  display: block;
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--foreground) 10%, transparent);
  border-radius: 14px;
  background: var(--card);
  box-sizing: border-box;
}
</style>
