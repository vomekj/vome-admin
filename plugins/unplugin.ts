import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

/**
 * 组件 / API 自动引入
 *
 * 根因：unplugin 默认 exclude 整个 node_modules。
 * vome-core 以 npm 包安装后，包内 SFC 不会注入 vue API / 宿主 UI 组件。
 * 必须放行 node_modules/vome-core。
 */
export function autoImportPlugins(root: string) {
  const r = (...segs: string[]) => path.resolve(root, ...segs)
  const coreAdmin = 'node_modules/vome-core/dist/admin'
  const coreAdminAbs = path.resolve(root, coreAdmin)

  const toCoreAlias = (id: string) => {
    const norm = id.replace(/\\/g, '/')
    const marker = '/node_modules/vome-core/dist/admin/'
    const i = norm.indexOf(marker)
    if (i !== -1) return `/@/${norm.slice(i + marker.length)}`
    return id
  }

  const exclude = [
    /[\\/]node_modules[\\/](?!vome-core(?:[\\/]|$))/,
    /[\\/]\.git[\\/]/,
  ]

  return [
    AutoImport({
      exclude,
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          'vue-sonner': ['toast'],
          'vue-router': ['RouterLink', 'RouterView'],
          '/@/lib/cn': ['cn'],
          '/@/service': ['service'],
          '/@/api/client': ['api', 'request', 'apiUrl', 'setTokens'],
          '/@/hooks/useVome': ['useVome'],
          '/@/hooks/useBrowser': ['useBrowser'],
          '/@/crud/useCrud': [
            'useCrud',
            'useTable',
            'useUpsert',
            'useSearch',
            'useCore',
          ],
          '/@/crud/plugins': ['Plugins', 'toTree'],
          '/@/crud/confirm': ['vmConfirm'],
          '/@/crud/style': [
            'setCrudConfig',
            'getCrudConfig',
            'getCrudStyle',
          ],
          '/@/crud/registry': [
            'resolveCrudComponent',
            'registerCrudComponent',
          ],
          '/@/lib/tree': ['deepTree', 'flattenTree'],
          '/@/lib/eps': [
            'loadEps',
            'loadAllEps',
            'getEps',
            'findEpsEntity',
          ],
        },
      ],
      dirs: [
        path.resolve(coreAdminAbs, 'stores'),
        r('src/stores'),
      ],
      dts: r('typings/auto-imports.d.ts'),
      vueTemplate: true,
      eslintrc: { enabled: false },
    }),
    Components({
      exclude,
      globs: [
        'src/components/ui/**/*.vue',
        'src/components/layout/vm-*.vue',
        'src/modules/*/components/vm-*.vue',
        `${coreAdmin}/components/vm-*.vue`,
        `${coreAdmin}/crud/vm-*.vue`,
        `${coreAdmin}/crud/components/vm-*.vue`,
      ],
      extensions: ['vue'],
      dts: r('typings/components.d.ts'),
      directoryAsNamespace: false,
      collapseSamePrefixes: true,
      importPathTransform: toCoreAlias,
    }),
  ]
}
