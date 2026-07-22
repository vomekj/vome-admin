import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'
import type { Plugin as EsbuildPlugin } from 'esbuild'

function resolveFile(base: string): string | null {
  const candidates = [
    base,
    `${base}.js`,
    `${base}.ts`,
    `${base}.vue`,
    `${base}.css`,
    `${base}.json`,
    path.join(base, 'index.js'),
    path.join(base, 'index.ts'),
    path.join(base, 'index.vue'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  }
  return null
}

function stripQuery(id: string) {
  return id.split('?')[0]!.split('#')[0]!
}

/** `/@/xxx` → `vome-core/admin/xxx`（短写框架 admin 包） */
function normalizeVomeAdminId(id: string): string {
  if (id === '/@' || id === '/@/') return 'vome-core/admin'
  if (id.startsWith('/@/')) return `vome-core/admin/${id.slice('/@/'.length)}`
  return id
}

/**
 * 直链 / link vome-core 时，Vite 会把 optional peer 解析为虚拟模块且无 default export。
 * 将 __vite-optional-peer-dep:* 指回宿主 node_modules 中的真实包。
 */
export function vomePeerDepsPlugin(appRoot: string): Plugin {
  const require = createRequire(path.join(appRoot, 'package.json'))
  const nm = path.join(appRoot, 'node_modules')
  const pinned: Record<string, string> = {
    clsx: path.join(nm, 'clsx/dist/clsx.mjs'),
    'tailwind-merge': path.join(nm, 'tailwind-merge/dist/bundle-mjs.mjs'),
    dompurify: path.join(nm, 'dompurify/dist/purify.es.mjs'),
    marked: path.join(nm, 'marked/lib/marked.esm.js'),
    'vue-sonner': path.join(nm, 'vue-sonner/lib/index.js'),
  }

  function resolvePeerPkg(pkg: string) {
    const file = pinned[pkg]
    if (file && fs.existsSync(file)) return file
    try {
      return require.resolve(pkg)
    } catch {
      return undefined
    }
  }

  function isCoreImporter(importer?: string) {
    if (!importer) return false
    const norm = importer.replace(/\\/g, '/')
    return norm.includes('/packages/vome-core/') || norm.includes('/vome-core/dist/')
  }

  return {
    name: 'vome-peer-deps',
    enforce: 'pre',
    resolveId(source, importer) {
      const normalized = source.replace(/^\0/, '')
      if (normalized.startsWith('__vite-optional-peer-dep:')) {
        const pkg = normalized
          .slice('__vite-optional-peer-dep:'.length)
          .replace(/:vome-core$/, '')
        return resolvePeerPkg(pkg)
      }
      if (isCoreImporter(importer) && pinned[source]) {
        return resolvePeerPkg(source)
      }
      return undefined
    },
  }
}

/**
 * 解析 vome-core/admin/*（及别名 /@/*）→ dist/admin/*
 * + #vome-host/* → 宿主 src
 */
export function vomeResolvePlugin(root: string, hostSrc: string): Plugin {
  const localCoreAdmin = path.resolve(root, '../packages/vome-core/dist/admin')
  const coreAdmin = fs.existsSync(localCoreAdmin)
    ? localCoreAdmin
    : path.resolve(root, 'node_modules/vome-core/dist/admin')
  const serviceEntry = path.resolve(coreAdmin, 'service/index.js')

  function resolveServiceId(id: string, importer?: string): string | undefined {
    const clean = normalizeVomeAdminId(stripQuery(id))
    if (
      clean === 'vome-core/admin/service' ||
      clean === 'vome-core/admin/service/index' ||
      clean === 'vome-core/admin/service/index.js'
    ) {
      return serviceEntry
    }
    const norm = path.normalize(clean)
    if (norm === path.normalize(serviceEntry)) return serviceEntry

    if (importer) {
      const impDir = path.dirname(stripQuery(importer))
      if (/vome-core[/\\]dist[/\\]admin/.test(impDir)) {
        const abs = path.normalize(path.resolve(impDir, clean))
        if (
          abs === path.normalize(serviceEntry) ||
          abs === path.normalize(path.join(coreAdmin, 'service')) ||
          abs === path.normalize(path.join(coreAdmin, 'service/index')) ||
          abs === path.normalize(path.join(coreAdmin, 'service/index.js'))
        ) {
          return serviceEntry
        }
      }
    }
    return undefined
  }

  return {
    name: 'vome-resolve',
    enforce: 'pre',
    resolveId(id, importer) {
      const serviceId = resolveServiceId(id, importer)
      if (serviceId) return serviceId

      if (id === '#vome-host' || id.startsWith('#vome-host/')) {
        const sub = id === '#vome-host' ? '' : id.slice('#vome-host/'.length)
        return resolveFile(path.resolve(hostSrc, sub)) ?? undefined
      }
      const adminId = normalizeVomeAdminId(id)
      if (adminId === 'vome-core/admin' || adminId.startsWith('vome-core/admin/')) {
        const sub =
          adminId === 'vome-core/admin'
            ? ''
            : adminId.slice('vome-core/admin/'.length)
        return resolveFile(path.resolve(coreAdmin, sub)) ?? undefined
      }
    },
  }
}

/**
 * optimizeDeps 的 esbuild 不读 Vite alias，需单独解析 #vome-host
 */
export function vomeHostEsbuildPlugin(hostSrc: string): EsbuildPlugin {
  return {
    name: 'vome-host-esbuild',
    setup(build) {
      build.onResolve({ filter: /^#vome-host(\/|$)/ }, (args) => {
        const sub =
          args.path === '#vome-host'
            ? ''
            : args.path.slice('#vome-host/'.length)
        const resolved = resolveFile(path.resolve(hostSrc, sub))
        if (!resolved) return undefined
        return { path: resolved }
      })
    },
  }
}
