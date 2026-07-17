import { proxy } from './proxy'
import dev from './dev'
import prod from './prod'

export const isDev = import.meta.env.DEV

const env = isDev ? dev : prod

/** 统一配置 */
export const config = {
  app: {
    name: 'VOMEADMIN',
    desc: '高性能快速开发平台',
    menu: {
      isGroup: true,
    },
    router: {
      mode: 'history' as const,
    },
  },
  ignore: {
    /** 不弹 toast 的路径片段 */
    toast: ['/base/open/eps'],
    /** 无需登录 */
    token: ['/login'],
  },
  test: {
    eps: isDev,
  },
  host: env.host,
  baseUrl: env.baseUrl,
}

export { proxy }
export type ProxyMap = typeof proxy
export default config
