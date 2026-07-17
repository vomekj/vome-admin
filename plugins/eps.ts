import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

type EpsApi = {
  method?: string
  path?: string
  summary?: string
  perms?: string[]
}

type EpsColumn = {
  propertyName?: string
  type?: string
  comment?: string
  nullable?: boolean
}

type EpsEntity = {
  module?: string
  prefix?: string
  name?: string
  api?: EpsApi[]
  columns?: EpsColumn[]
  pageColumns?: EpsColumn[]
}

function toCamel(str: string) {
  return str.replace(/([^-])(?:-+([^-]))/g, (_m, a, b) => a + String(b).toUpperCase())
}

function toPascal(str: string) {
  const c = toCamel(str)
  return c ? c[0]!.toUpperCase() + c.slice(1) : 'Entity'
}

function methodName(p: string) {
  return p.replace(/^\//, '').replace(/[:,\s/-]/g, '')
}

function tsType(col: EpsColumn) {
  const t = String(col.type || 'string').toLowerCase()
  if (['int', 'integer', 'bigint', 'number', 'float', 'double', 'decimal'].some((x) => t.includes(x)))
    return 'number'
  if (['bool', 'boolean'].some((x) => t.includes(x))) return 'boolean'
  if (t.includes('json') || t.includes('array')) return 'any'
  return 'string'
}

function buildDts(map: Record<string, EpsEntity[]>) {
  const list = Object.values(map).flat().filter((e) => e.prefix)
  const entityBlocks: string[] = []
  const serviceBlocks: string[] = []
  const tree: Record<string, unknown> = {}

  for (const e of list) {
    const prefix = e.prefix!.replace(/^\//, '')
    const parts = prefix.replace(/^admin\/?/, '').split('/').filter(Boolean)
    const leaf = parts[parts.length - 1] || 'index'
    const entityName =
      e.name && e.name.endsWith('Entity')
        ? e.name
        : `${toPascal(parts.join('_') || leaf)}Entity`
    const serviceName = toPascal(parts.join('_') || leaf)

    const cols = [...(e.columns || []), ...(e.pageColumns || [])]
    const seen = new Set<string>()
    const fields = cols
      .filter((c) => c.propertyName && !seen.has(c.propertyName) && seen.add(c.propertyName!))
      .map((c) => {
        const comment = c.comment ? `\t\t/** ${c.comment} */\n` : ''
        return `${comment}\t\t${c.propertyName}?: ${tsType(c)};`
      })
      .join('\n\n')

    entityBlocks.push(`\tinterface ${entityName} {
${fields || '\t\tid?: number;'}

\t\t[key: string]: any;
\t}`)

    const apis = e.api || []
    const methods = new Map<string, string>()
    for (const a of apis) {
      const n = methodName(a.path || '')
      if (!n || /[-:]/.test(n)) continue
      const sum = a.summary ? `\t\t/** ${a.summary} */\n` : ''
      if (n === 'page') {
        methods.set(
          n,
          `${sum}\t\tpage(data?: any): Promise<{ list: ${entityName}[]; pagination: { page: number; size: number; total: number } }>;`,
        )
      } else if (n === 'list') {
        methods.set(n, `${sum}\t\tlist(data?: any): Promise<${entityName}[]>;`)
      } else if (n === 'info') {
        methods.set(n, `${sum}\t\tinfo(data?: { id: number | string }): Promise<${entityName}>;`)
      } else {
        methods.set(n, `${sum}\t\t${n}(data?: any): Promise<any>;`)
      }
    }
    for (const n of ['page', 'list', 'info', 'add', 'update', 'delete', 'restore']) {
      if (methods.has(n)) continue
      if (n === 'page')
        methods.set(
          n,
          `\t\tpage(data?: any): Promise<{ list: ${entityName}[]; pagination: { page: number; size: number; total: number } }>;`,
        )
      else if (n === 'list') methods.set(n, `\t\tlist(data?: any): Promise<${entityName}[]>;`)
      else if (n === 'info')
        methods.set(n, `\t\tinfo(data?: { id: number | string }): Promise<${entityName}>;`)
      else methods.set(n, `\t\t${n}(data?: any): Promise<any>;`)
    }

    const permKeys = [...methods.keys()]
    serviceBlocks.push(`\tinterface ${serviceName} {
${[...methods.values()].join('\n\n')}

\t\tnamespace: string;
\t\tpermission: { ${permKeys.map((k) => `${k}: string`).join('; ')} };
\t\t_permission: { ${permKeys.map((k) => `${k}: boolean`).join('; ')} };
\t\trequest: Eps.Request;
\t}`)

    // tree
    let node = tree
    for (let i = 0; i < parts.length; i++) {
      const key = toCamel(parts[i]!)
      if (i === parts.length - 1) {
        node[key] = serviceName
      } else {
        if (!node[key] || typeof node[key] === 'string') node[key] = {}
        node = node[key] as Record<string, unknown>
      }
    }
  }

  function renderTree(n: Record<string, unknown>, indent = 2): string {
    const pad = '\t'.repeat(indent)
    return Object.entries(n)
      .map(([k, v]) => {
        if (typeof v === 'string') return `${pad}${k}: ${v};`
        return `${pad}${k}: {\n${renderTree(v as Record<string, unknown>, indent + 1)}\n${pad}};`
      })
      .join('\n')
  }

  return `declare namespace Eps {
\ttype RequestOptions = {
\t\turl?: string;
\t\tmethod?: string;
\t\tdata?: any;
\t\tparams?: any;
\t\t[key: string]: any;
\t};

\ttype Request = (options?: RequestOptions) => Promise<any>;

${entityBlocks.join('\n\n')}

${serviceBlocks.join('\n\n')}

\ttype Service = {
\t\trequest: Request;
${renderTree(tree)}
\t};
}
`
}

async function fetchEps(apiUrl: string): Promise<Record<string, EpsEntity[]> | null> {
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) })
    const json = (await res.json()) as {
      code?: number
      data?: Record<string, EpsEntity[]>
    }
    if (json?.code === 1000 && json.data && Object.keys(json.data).length) {
      return json.data
    }
  } catch {
    // backend not ready
  }
  return null
}

type EpsBundle = {
  admin: Record<string, EpsEntity[]>
  app: Record<string, EpsEntity[]>
}

function resolveEpsBase(api?: string) {
  const raw = api?.trim()
  if (!raw) {
    throw new Error(
      '[eps] api is required (pass proxy target from admin src/config/proxy)',
    )
  }
  return raw
    .replace(/\/admin\/base\/open\/eps\/?$/, '')
    .replace(/\/$/, '')
}

function readBundleFromJson(raw: unknown): EpsBundle | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (obj.admin && typeof obj.admin === 'object') {
    return {
      admin: (obj.admin as Record<string, EpsEntity[]>) || {},
      app: (obj.app as Record<string, EpsEntity[]>) || {},
    }
  }
  return { admin: obj as Record<string, EpsEntity[]>, app: {} }
}

function bundleHasData(bundle: EpsBundle) {
  return Object.keys(bundle.admin).length > 0 || Object.keys(bundle.app).length > 0
}

export type EpsPluginOptions = {
  /** 后端根 URL（必填，与 proxy target 一致） */
  api: string
  /** 输出目录（相对 admin 根） */
  dist?: string
}

const SKIP_HOT_FRAGMENTS = [
  'eps.json',
  'eps.d.ts',
  'node_modules',
  '/dist/',
  '\\dist\\',
  '/build/',
  '\\build\\',
]

function shouldSkipHotFile(file: string) {
  const f = file.replace(/\\/g, '/')
  return SKIP_HOT_FRAGMENTS.some((x) => f.includes(x.replace(/\\/g, '/')))
}

/** Vite 插件：拉取 EPS → 写 typings/eps.d.ts + build/eps.json；保存源码时热同步 */
export function epsPlugin(options: EpsPluginOptions): Plugin {
  const base = resolveEpsBase(options.api)
  let root = ''
  /** 启动/重试是否已成功写过（失败仍可重试；热更新走 refresh） */
  let bootOk = false
  let bootTried = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let running: Promise<{ changed: boolean }> | null = null

  async function generate(
    reason: 'start' | 'retry' | 'hot' = 'start',
  ): Promise<{ changed: boolean }> {
    if (!root) return { changed: false }
    // buildStart 只跑一次引导；hot/retry 可重复
    if (bootTried && reason === 'start') return { changed: false }

    const distDir = path.resolve(root, options.dist || 'build')
    const dtsPath = path.resolve(root, 'typings/eps.d.ts')
    const jsonPath = path.join(distDir, 'eps.json')

    const [adminMap, appMap] = await Promise.all([
      fetchEps(`${base}/admin/base/open/eps`),
      fetchEps(`${base}/app/base/open/eps`),
    ])

    let bundle: EpsBundle | null = null
    if (adminMap || appMap) {
      bundle = { admin: adminMap || {}, app: appMap || {} }
    } else if (reason !== 'hot') {
      // 热更新时后端短暂不可用则跳过，勿用旧 json 覆盖「已变」的误判
      try {
        bundle = readBundleFromJson(JSON.parse(fs.readFileSync(jsonPath, 'utf8')))
      } catch {
        bundle = null
      }
    }

    if (!bundle || !bundleHasData(bundle)) {
      if (reason === 'start') {
        console.warn('[vome-eps] skip generate (no data), will retry once')
      } else if (reason === 'retry') {
        console.warn('[vome-eps] skip generate (no data)')
      }
      if (reason === 'start' || reason === 'retry') bootTried = true
      return { changed: false }
    }

    const dts = buildDts(bundle.admin)
    const json = JSON.stringify(bundle, null, 2)
    fs.mkdirSync(distDir, { recursive: true })
    fs.mkdirSync(path.dirname(dtsPath), { recursive: true })

    let changed = true
    try {
      changed =
        fs.readFileSync(dtsPath, 'utf8') !== dts ||
        fs.readFileSync(jsonPath, 'utf8') !== json
    } catch {
      changed = true
    }

    if (changed) {
      fs.writeFileSync(jsonPath, json)
      fs.writeFileSync(dtsPath, dts)
      console.log('[vome-eps] updated typings/eps.d.ts')
    }

    bootOk = true
    bootTried = true
    return { changed }
  }

  function scheduleHot(
    send: (payload: { type: 'custom'; event: string; data?: unknown }) => void,
  ) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const run = (running ??= generate('hot').finally(() => {
        running = null
      }))
      void run.then(({ changed }) => {
        if (!changed) return
        send({ type: 'custom', event: 'eps-update', data: { changed: true } })
      })
    }, 400)
  }

  return {
    name: 'vome-eps',
    configResolved(cfg) {
      root = cfg.root
    },
    async buildStart() {
      await generate('start')
    },
    async configureServer(server) {
      if (!bootOk) {
        setTimeout(() => void generate('retry'), 3000)
      }
      // 页面刷新时顺带再拉一次（后端可能刚重启）
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/@vite/client') {
          scheduleHot((payload) => {
            ;(server.hot || server.ws).send(payload)
          })
        }
        next()
      })
    },
    handleHotUpdate({ file, server }) {
      if (shouldSkipHotFile(file)) return
      scheduleHot((payload) => {
        ;(server.hot || server.ws).send(payload)
      })
    },
  }
}
