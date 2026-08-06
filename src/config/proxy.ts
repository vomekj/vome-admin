/** 环境代理：开发 `/dev`；生产网关 `/api`。`/vome/` 由 ensureMicroAppProxy 补齐。 */
export const proxy = {
  '/dev/': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    xfwd: true,
    rewrite: (path: string) => path.replace(/^\/dev/, ''),
  },
  '/api/': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    xfwd: true,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
} as const
