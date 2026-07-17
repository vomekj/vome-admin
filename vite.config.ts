import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { proxy } from './src/config/proxy'
import { epsPlugin } from './plugins/eps'
import { autoImportPlugins } from './plugins/unplugin'
import { vomeHostEsbuildPlugin, vomePeerDepsPlugin, vomeResolvePlugin } from './plugins/vome-resolve'

const root = path.dirname(fileURLToPath(import.meta.url))
const hostSrc = path.resolve(root, './src')

export default defineConfig({
  plugins: [
    vomePeerDepsPlugin(root),
    vomeResolvePlugin(root, hostSrc),
    vue(),
    tailwindcss(),
    epsPlugin({ api: proxy['/dev/'].target }),
    ...autoImportPlugins(root),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(root, './src') },
      { find: '@config', replacement: path.resolve(root, './src/config') },
      { find: '@typings', replacement: path.resolve(root, './typings') },
      { find: '#vome-host', replacement: hostSrc },
    ],
    dedupe: [
      'vue',
      'vue-router',
      'pinia',
      '@vueuse/core',
      'reka-ui',
      'clsx',
      'tailwind-merge',
      '@lucide/vue',
      'lucide-vue-next',
    ],
  },
  // 包源码含 #vome-host / .vue，禁止进预构建；若仍被扫到，esbuild 插件补 #vome-host
  optimizeDeps: {
    include: ['dompurify', 'marked', 'vue-sonner'],
    exclude: ['vome-core'],
    esbuildOptions: {
      plugins: [vomeHostEsbuildPlugin(hostSrc)],
    },
  },
  server: {
    port: 9000,
    strictPort: true,
    cors: true,
    proxy,
    watch: {
      // 同步/覆盖 node_modules/vome-core 后需热更新；默认忽略整个 node_modules
      ignored: [
        '**/typings/eps.d.ts',
        '**/build/eps.json',
        '**/node_modules/**',
        '!**/node_modules/vome-core/**',
      ],
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
