import { proxy } from './proxy'

/** 生产环境配置 */
export default {
  host: proxy['/prod/'].target,
  /** 请求前缀，经代理/网关转发到 host */
  baseUrl: '/prod',
}
