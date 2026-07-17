/** 环境代理（dev / prod 前缀经 Vite 或网关转发到 target） */
export const proxy = {
  '/dev/': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    xfwd: true,
    rewrite: (path: string) => path.replace(/^\/dev/, ''),
  },
  '/prod/': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    xfwd: true,
    rewrite: (path: string) => path.replace(/^\/prod/, ''),
  },
  /** 微应用静态资源（子应用内绝对路径 /vome/apps/...） */
  '/vome/': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    xfwd: true,
  },
} as const
