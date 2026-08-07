import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { proxy } from './src/config/proxy'
import { epsPlugin } from './plugins/eps'
import {
  adminDedupe,
  adminDevProxy,
  adminWatchIgnored,
  createAdminAutoImportPlugins,
  createAdminOptimizeDepsPlugins,
  createAdminResolvePlugins,
} from 'vome-core/client/vite-admin'

const root = path.dirname(fileURLToPath(import.meta.url))
const hostSrc = path.resolve(root, './src')

export default defineConfig({
  plugins: [
    ...createAdminResolvePlugins({ root, hostSrc }),
    vue(),
    tailwindcss(),
    epsPlugin({ api: proxy['/dev/'].target }),
    ...createAdminAutoImportPlugins(root),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(root, './src') },
      { find: '@config', replacement: path.resolve(root, './src/config') },
      { find: '@typings', replacement: path.resolve(root, './typings') },
      { find: '#vome-host', replacement: hostSrc },
    ],
    dedupe: [...adminDedupe],
  },
  optimizeDeps: {
    include: ['dompurify', 'marked', 'vue-sonner'],
    exclude: ['vome-core'],
    esbuildOptions: {
      plugins: createAdminOptimizeDepsPlugins({ root, hostSrc }),
    },
  },
  server: {
    port: 9000,
    strictPort: true,
    cors: true,
    proxy: adminDevProxy(proxy),
    watch: {
      ignored: adminWatchIgnored,
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
