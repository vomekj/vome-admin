/**
 * 插件开发入口（官网文档 / 上传 / 脚手架）
 * 域名与仓库地址；下载优先 Gitee，GitHub 为镜像。
 */
const ORG = 'vomekj'

/** docsUrl → 官网后端 origin（主机前加 service.） */
export function serviceUrlFromDocs(docsUrl: string): string {
  const u = new URL(docsUrl)
  const host = u.hostname.replace(/^www\./, '').replace(/^service\./, '')
  return `${u.protocol}//service.${host}`
}

/** 席位 API 根（occupy / heartbeat / release） */
export function seatApiBaseFromDocs(docsUrl: string): string {
  return `${serviceUrlFromDocs(docsUrl)}/app/pluginStore/seat`
}

/** 联网安装签发 license */
export function licenseIssueUrlFromDocs(docsUrl: string): string {
  return `${serviceUrlFromDocs(docsUrl)}/app/pluginStore/wallet/license/issue`
}

function giteeArchive(repo: string) {
  return `https://gitee.com/${ORG}/${repo}/repository/archive/master.zip`
}

function githubArchive(repo: string) {
  return `https://github.com/${ORG}/${repo}/archive/refs/heads/master.zip`
}

function giteeRepo(repo: string) {
  return `https://gitee.com/${ORG}/${repo}`
}

function githubRepo(repo: string) {
  return `https://github.com/${ORG}/${repo}`
}

const docsUrl = 'https://vomekj.com'

export const pluginDev = {
  docsUrl,
  serviceUrl: serviceUrlFromDocs(docsUrl),
  uploadUrl: `${docsUrl}/plugins/upload`,
  mirrors: {
    prefer: 'gitee' as const,
    giteeOrg: `https://gitee.com/${ORG}`,
    githubOrg: `https://github.com/${ORG}`,
  },
  scaffolds: {
    full: {
      key: 'full',
      title: '前端 + 后端',
      desc: '完整业务模块脚手架（.vome：含 server 与 web），本地开发打包后发布。',
      repo: 'vome-plugin-full',
      repoUrl: giteeRepo('vome-plugin-full'),
      githubRepoUrl: githubRepo('vome-plugin-full'),
      downloadUrl: giteeArchive('vome-plugin-full'),
      githubDownloadUrl: githubArchive('vome-plugin-full'),
    },
    backend: {
      key: 'backend',
      title: '纯后端',
      desc: '钩子 / 服务端插件脚手架（.vome：仅 server），适合上传、短信、支付等能力扩展。',
      repo: 'vome-plugin-service',
      repoUrl: giteeRepo('vome-plugin-service'),
      githubRepoUrl: githubRepo('vome-plugin-service'),
      downloadUrl: giteeArchive('vome-plugin-service'),
      githubDownloadUrl: githubArchive('vome-plugin-service'),
    },
    frontend: {
      key: 'frontend',
      title: '纯前端',
      desc: '后台微应用脚手架（.vome：含 web/），以 wujie 挂载独立前端页面。',
      repo: 'vome-plugin-front',
      repoUrl: giteeRepo('vome-plugin-front'),
      githubRepoUrl: githubRepo('vome-plugin-front'),
      downloadUrl: giteeArchive('vome-plugin-front'),
      githubDownloadUrl: githubArchive('vome-plugin-front'),
    },
  },
} as const

export type PluginDevConfig = typeof pluginDev
export type PluginScaffoldKey = keyof typeof pluginDev.scaffolds
