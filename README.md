# Vome Admin

[English](./README.en.md) | 简体中文

基于 **Vue 3 + Vite** 的蓝系管理后台脚手架。与 [vome-service](https://gitee.com/vomekj/vome-service) 共用同一后端，走 **Admin 侧** API（`/admin/...`）与 EPS（`service.base.*` 等）；CRUD / 布局 / 路由守卫来自 [`vome-core`](https://www.npmjs.com/package/vome-core)。

> 威迈科技开源项目。需先启动 Vome Service（含 `base` 菜单与超管种子）。

## 特性

| 能力 | 说明 |
| --- | --- |
| **Admin EPS** | 拉取后端接口描述，生成类型化 `service.base.*` / `service.user.*` |
| **vm-crud 全家桶** | 搜索 / 工具栏 / 表格 / 分页 / 新增编辑弹窗 / 回收站 / 导入导出 |
| **动态菜单路由** | 登录后按 Service `base_menu` 挂载；`viewPath` → `modules/**/views` |
| **按钮级权限** | 对齐 Service Admin RBAC（`v-perm` / `_permission`） |
| **蓝系主题分层** | `theme.css` 换色 + core `base.css` 锁结构；明暗主题 |
| **布局壳层** | 侧栏、顶栏、多标签页、折叠 / 移动端抽屉 |
| **插件页** | wujie 嵌入插件文档 / 微应用（代理 `/vome`） |
| **字典 / 上传 / Socket** | 宿主 stores + 框架组件开箱即用 |
| **自动引入** | unplugin 自动导入 Vue / 组件 |

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
| **Vome Service** | 必须先启动（默认 `http://127.0.0.1:3000`） |

## 快速开始

```bash
git clone https://gitee.com/vomekj/vome-admin.git
cd vome-admin
bun install
```

### 1. 确认后端代理

`src/config/proxy.ts` 默认：

```ts
'/dev/': {
  target: 'http://127.0.0.1:3000',
  // …
}
```

Service 端口不是 `3000` 时改 `target`。微应用静态资源走 `/vome/` → 同一 Service。

### 2. 启动

先启动 [vome-service](https://gitee.com/vomekj/vome-service)，再：

```bash
bun run dev
```

| 项 | 说明 |
| --- | --- |
| 地址 | [http://localhost:9000](http://localhost:9000) |
| API 前缀 | `/dev` → Service |
| EPS | 开发态自动拉取 → `typings/eps.d.ts` |

### 3. 与后端的对应关系

| Admin | Service |
| --- | --- |
| 登录 / 验证码 | `/admin/base/auth/*`、`/admin/base/open/*` |
| 菜单 / 权限 | `base_menu`、`base_role_menu`、权限码 `{module}:{resource}:{action}` |
| 系统用户 / 角色 / 部门 | `/admin/base/user`、`role`、`department`… |
| 字典 / 任务 / 队列 / 日志 | `/admin/base/dict`、`task`、`queue`、`log`… |
| C 端用户管理页 | `/admin/user/*`（管理 App 用户） |
| EPS | `GET /admin/base/open/eps`（`@Public`） |
| Socket | Service Socket.IO（可选） |

### 4. 登录

使用 Service 种子超管（`base/db.json`，首次初始化写入）：

| 字段 | 值 |
| --- | --- |
| 用户名 | `admin` |
| 密码 | `123456` |

侧栏为空时，检查 Service 是否已导入 `base/menu.json`。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `bun run dev` | 开发（端口 **9000**） |
| `bun run build` | 生产构建 → `dist/` |
| `bun run preview` | 预览构建产物 |

## 端口对照

| 端 | 端口 |
| --- | --- |
| Service | 3000 |
| **Admin** | **9000** |
| Web | 9900 |
| UniApp H5 | 6600 |

## 目录结构

```text
vome-admin/
├── src/
│   ├── modules/              # 业务模块
│   │   ├── base/views/       # 用户、角色、菜单、字典、任务、队列、日志、租户…
│   │   ├── user/views/       # C 端用户 / 角色管理
│   │   └── helper/views/     # 插件等
│   ├── components/
│   │   ├── layout/           # 壳层
│   │   └── ui/               # shadcn-vue
│   ├── pages/                # login / layout / home / missing / micro…
│   ├── config/               # index / dev / prod / proxy（禁止 .env）
│   ├── stores/
│   ├── styles/theme.css      # 换色（主色 #4E5DFF）
│   ├── themes/
│   └── views-registry.ts
├── plugins/                  # eps、vome-resolve、unplugin
├── typings/
└── vite.config.ts
```

路径别名：`@` → `src/`；`/@` → `vome-core` Admin 包。

## 写一个 CRUD 页（简述）

1. 在 Service 声明 Entity + `@Controller` CRUD（Admin 侧路由）  
2. Admin 新增 `src/modules/<m>/views/<page>/index.vue`  
3. Service 菜单 `viewPath` 指向该路径（如 `modules/base/views/user/index`）  
4. 页面示例：

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

表单用 `vm-upsert` + `useUpsert`；确认用 `vmConfirm`。

## 主题与样式

| 层 | 文件 | 可否换肤改 |
| --- | --- | --- |
| 主题色 | `src/styles/theme.css` | ✅ |
| 结构 | vome-core `base.css` | ❌ |

`main.ts`：先 `theme.css`，再 core `base.css`。业务页用 scoped SCSS。

## 内置业务页（部分）

| 模块 | 页面 |
| --- | --- |
| base | 用户、角色、菜单、字典、定时任务、队列、请求日志、租户… |
| user | 前端用户、前端角色 |
| helper | 插件管理（wujie） |

## 相关项目

| 项目 | 说明 |
| --- | --- |
| [vome-service](https://gitee.com/vomekj/vome-service) | Bun + Elysia 后端（必配） |
| [vome-web](https://gitee.com/vomekj/vome-web) | C 端 Web（App 侧） |
| UniApp / Docs | 移动端与文档站 |
| [vome-core](https://www.npmjs.com/package/vome-core) | 共享框架包 |

## 贡献

1. Fork 本仓库  
2. 新建分支 `feat/xxx`  
3. 提交并推送  
4. 发起 Pull Request / Merge Request  

Issue / PR 欢迎中英文。

## 许可证

[MIT](./LICENSE) © VomeShop / 威迈科技

---

若本仓库对你有帮助，欢迎 Star ⭐
