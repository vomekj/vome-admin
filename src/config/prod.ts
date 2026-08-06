/** 生产：同源 `/api` 网关（Nginx 去掉前缀转到 Service）；`/admin`、`/app` 仍为后端路径 */
export default {
  /** 同域部署可留空（Socket 等用页面 origin）；直连后端时再填公网地址 */
  host: '',
  baseUrl: '/api',
}
