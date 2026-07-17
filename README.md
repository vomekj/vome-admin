# Vome Admin

[English](./README.en.md) | 简体中文

基于 **Vue 3 + Vite** 的蓝系管理后台脚手架。CRUD、布局、路由守卫、EPS 客户端等来自 npm 包 [`vome-core`](https://www.npmjs.com/package/vome-core)；业务页面写在 `src/modules/`，菜单与权限由 **Vome Service** 动态下发。

> 微茫科技开源项目。需配合 [vome-service](https://gitee.com/vomekj/vome-service) 使用。

## 特性

| 能力 | 说明 |
| --- | --- |
| **vm-crud 全家桶** | 搜索 / 工具栏 / 表格 / 分页 / 新增编辑弹窗 / 回收站 / 导入导出 |
| **EPS 驱动** | 启动时拉取后端接口描述，自动生成类型化 `service.base.*` 调用 |
| **动态菜单路由** | 登录后按 `base_menu` 挂载页面；`viewPath` 对应 `modules/**/views` |
| **按钮级权限** | 与后端 RBAC 权限码对齐（`v-perm` / `_permission`） |
| **蓝系主题分层** | `theme.css` 换色 + core `base.css` 锁结构；支持明暗主题 |
| **布局壳层** | 侧栏、顶栏、多标签页、折叠 / 移动端抽屉 |
| **插件页** | wujie 微前端嵌入插件文档 / 扩展页 |
| **字典 / 上传 / Socket** | 宿主 stores + 框架组件开箱即用 |
| **自动引入** | unplugin 自动导入 Vue / 组件，业务页少写 import |

## 技术栈

- [Vue 3](https://vuejs.org) + [Vite](https://vitejs.dev) + [TypeScript](https://www.typescriptlang.org)
- [Pinia](https://pinia.vuejs.org) / [Vue Router](https://router.vuejs.org)
- [Tailwind CSS v4](https://tailwindcss.com) + Remix Icon
- [vome-core](https://www.npmjs.com/package/vome-core)（Admin CRUD 与壳层）
- [wujie](https://wujicode.cn)（插件微应用）
- 推荐包管理器：[Bun](https://bun.sh)

## 环境要求

| 依赖 | 说明 |
| --- | --- |
| **Node / Bun** | 建议 Bun 最新稳定版（也可用 npm / pnpm） |
| **Vome Service** | 后端必须先启动（默认 `http://127.0.0.1:3000`） |

## 快速开始

```bash
git clone https://gitee.com/vomekj/vome-admin.git
cd vome-admin
bun install
```

### 1. 确认后端代理

开发代理在 `src/config/proxy.ts`，默认指向本机 Service：

```ts
'/dev/': {
  target: 'http://127.0.0.1:3000',
  // …
}
```

若 Service 端口不是 `3000`，改这里的 `target`（以及 `dev.ts` 使用的同一配置）。

### 2. 启动

先启动 [vome-service](https://gitee.com/vomekj/vome-service)，再：

```bash
bun run dev
```

| 项 | 说明 |
| --- | --- |
| 地址 | [http://localhost:9000](http://localhost:9000) |
| 代理前缀 | `/dev` → Service |
| EPS | 开发态自动拉取并生成 `typings/eps.d.ts` |

### 3. 登录

使用 Service 种子超管（首次初始化 `base/db.json`）：

| 字段 | 值 |
| --- | --- |
| 用户名 | `admin` |
| 密码 | `123456` |

登录后侧栏菜单由后端下发；无菜单时请检查 Service 的 `menu.json` 是否已导入。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `bun run dev` | 开发（端口 **9000**） |
| `bun run build` | 生产构建 → `dist/` |
| `bun run preview` | 预览构建产物 |

## 目录结构

```text
vome-admin/
├── src/
│   ├── modules/              # 业务模块
│   │   ├── base/views/       # 系统：用户、角色、菜单、字典、任务、队列、日志、租户…
│   │   ├── user/views/       # C 端用户 / 角色管理页
│   │   └── helper/views/     # 插件等辅助页
│   ├── components/
│   │   ├── layout/           # 壳层：侧栏、顶栏、标签
│   │   └── ui/               # shadcn-vue 原子组件
│   ├── pages/                # login / layout / home / missing / micro…
│   ├── config/               # index / dev / prod / proxy（禁止 .env）
│   ├── stores/               # 主题、字典等宿主 store
│   ├── styles/theme.css      # 换色 token（主色 #4E5DFF）
│   ├── themes/               # light / dark 注册
│   └── views-registry.ts     # 业务视图 glob 注册
├── plugins/                  # eps、vome-resolve、unplugin
├── typings/                  # EPS、auto-import 类型
└── vite.config.ts
```

路径别名：

| 别名 | 指向 |
| --- | --- |
| `@` | `src/` |
| `@config` | `src/config/` |
| `/@` | `vome-core` Admin 包（CRUD、router、stores） |

## 写一个 CRUD 页（简述）

1. 在 Service 建好 Entity / Controller（声明式 CRUD）  
2. Admin 新增 `src/modules/<m>/views/<page>/index.vue`  
3. 后台菜单 `viewPath` 指向该路径（如 `modules/base/views/user/index`）  
4. 页面用 `vm-crud` 标准结构：

```vue
<template>
  <vm-crud ref="Crud">
    <vm-row><vm-search /></vm-row>
    <vm-row>
      <vm-refresh-btn />
      <vm-toolbar />
    </vm-row>
    <vm-row><vm-table ref="Table" /></vm-row>
    <vm-row>
      <vm-flex />
      <vm-pagination />
    </vm-row>
    <vm-upsert />
  </vm-crud>
</template>

<script setup lang="ts">
const { service } = useVome()

useCrud({ service: service.base.user })
useTable({
  columns: [
    { type: 'selection' },
    { prop: 'username', label: '用户名' },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})
</script>
```

弹窗表单用 `vm-upsert` + `useUpsert`；确认框用 `vmConfirm`；勿另起一套弹窗皮肤。

## 主题与样式

| 层 | 文件 | 可否换肤改 |
| --- | --- | --- |
| 主题色 | `src/styles/theme.css` | ✅ 改 CSS 变量 |
| 结构 | `vome-core` 的 `base.css` | ❌ 锁定布局 / 控件尺寸 |

`main.ts` 引入顺序：先 `theme.css`，再 core `base.css`。业务页样式用 `scoped` SCSS。

## 内置业务页（部分）

| 模块 | 页面 |
| --- | --- |
| base | 用户、角色、菜单、字典、定时任务、队列、请求日志、租户… |
| user | 前端用户、前端角色 |
| helper | 插件管理（wujie 文档嵌入） |

## 与 Service 的关系

- Admin **不内嵌**后端代码；HTTP 经 Vite 代理到 Service  
- 权限码、菜单、登录态与 Service Admin RBAC 一致  
- 升级 `vome-core` 后执行 `bun install`，按 changelog 调整用法  

配套后端：[vome-service](https://gitee.com/vomekj/vome-service)

## 相关项目

| 项目 | 说明 |
| --- | --- |
| [vome-service](https://gitee.com/vomekj/vome-service) | Bun + Elysia 业务后端 |
| Web / UniApp / Docs | C 端与文档站（同组织按需克隆） |
| [vome-core](https://www.npmjs.com/package/vome-core) | 前后端共享框架包 |

## 贡献

1. Fork 本仓库  
2. 新建分支 `feat/xxx`  
3. 提交并推送  
4. 发起 Pull Request / Merge Request  

Issue / PR 欢迎中英文。

## 许可证

[MIT](./LICENSE) © VomeShop / 微茫科技

---

若本仓库对你有帮助，欢迎 Star ⭐
