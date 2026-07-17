import { proxy } from './proxy'

/** 开发环境配置 */
export default {
  host: proxy['/dev/'].target,
  /** 请求前缀，经 Vite 代理到 host */
  baseUrl: '/dev',
}
