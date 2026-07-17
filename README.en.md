# Vome Admin

[简体中文](./README.md) | English

A blue-themed admin console built with **Vue 3 + Vite**. It shares the same backend as [vome-service](https://gitee.com/vomekj/vome-service), calling **Admin-side** APIs (`/admin/...`) via EPS (`service.base.*`, etc.). CRUD UI, layout, and route guards come from [`vome-core`](https://www.npmjs.com/package/vome-core).

> Open-sourced by Vome / 微茫科技. Start Vome Service first (with `base` menus and the super-admin seed).

## Features

| Capability | Description |
| --- | --- |
| **Admin EPS** | Fetches API descriptors → typed `service.base.*` / `service.user.*` |
| **vm-crud suite** | Search, toolbar, table, pagination, upsert dialogs, recycle bin, import / export |
| **Dynamic menus** | Routes from Service `base_menu`; `viewPath` → `modules/**/views` |
| **Button-level ACL** | Aligned with Service Admin RBAC (`v-perm` / `_permission`) |
| **Themed styling** | `theme.css` for colors + core `base.css` for structure; light / dark |
| **App shell** | Sidebar, header, multi-tabs, collapse / mobile drawer |
| **Plugins** | wujie embeds plugin docs / micro-apps (`/vome` proxy) |
| **Dict / upload / Socket** | Host stores + framework components |
| **Auto-import** | unplugin for Vue APIs and components |

## Stack

- [Vue 3](https://vuejs.org) + [Vite](https://vitejs.dev) + [TypeScript](https://www.typescriptlang.org)
- [Pinia](https://pinia.vuejs.org) / [Vue Router](https://router.vuejs.org)
- [Tailwind CSS v4](https://tailwindcss.com) + Remix Icon
- [vome-core](https://www.npmjs.com/package/vome-core) (Admin CRUD & shell)
- [wujie](https://wujicode.cn) (plugin micro-apps)
- Package manager: [Bun](https://bun.sh) recommended

## Requirements

| Dependency | Notes |
| --- | --- |
| **Node / Bun** | Latest Bun stable recommended (npm / pnpm also fine) |
| **Vome Service** | Must be running (default `http://127.0.0.1:3000`) |

## Quick start

```bash
git clone https://gitee.com/vomekj/vome-admin.git
cd vome-admin
bun install
```

### 1. Proxy to Service

`src/config/proxy.ts` defaults to:

```ts
'/dev/': {
  target: 'http://127.0.0.1:3000',
  // …
}
```

Change `target` if Service is not on port `3000`. Micro-app assets use `/vome/` → the same Service.

### 2. Run

Start [vome-service](https://gitee.com/vomekj/vome-service) first, then:

```bash
bun run dev
```

| Item | Notes |
| --- | --- |
| URL | [http://localhost:9000](http://localhost:9000) |
| API prefix | `/dev` → Service |
| EPS | Auto-fetched in dev → `typings/eps.d.ts` |

### 3. Mapping to the backend

| Admin | Service |
| --- | --- |
| Login / captcha | `/admin/base/auth/*`, `/admin/base/open/*` |
| Menus / ACL | `base_menu`, `base_role_menu`, codes `{module}:{resource}:{action}` |
| Users / roles / depts | `/admin/base/user`, `role`, `department`… |
| Dict / tasks / queues / logs | `/admin/base/dict`, `task`, `queue`, `log`… |
| App user admin pages | `/admin/user/*` |
| EPS | `GET /admin/base/open/eps` (`@Public`) |
| Socket | Service Socket.IO (optional) |

### 4. Sign in

Default super admin from Service seed (`base/db.json`):

| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `123456` |

If the sidebar is empty, ensure Service imported `base/menu.json`.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Dev server on port **9000** |
| `bun run build` | Production build → `dist/` |
| `bun run preview` | Preview the production build |

## Port map

| App | Port |
| --- | --- |
| Service | 3000 |
| **Admin** | **9000** |
| Web | 9900 |
| UniApp H5 | 6600 |

## Project layout

```text
vome-admin/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── base/views/       # Users, roles, menus, dict, tasks, queues, logs, tenants…
│   │   ├── user/views/       # App users / roles
│   │   └── helper/views/     # Plugins, etc.
│   ├── components/
│   │   ├── layout/           # Shell
│   │   └── ui/               # shadcn-vue
│   ├── pages/                # login / layout / home / missing / micro…
│   ├── config/               # index / dev / prod / proxy (no .env)
│   ├── stores/
│   ├── styles/theme.css      # Colors (#4E5DFF)
│   ├── themes/
│   └── views-registry.ts
├── plugins/                  # eps, vome-resolve, unplugin
├── typings/
└── vite.config.ts
```

Aliases: `@` → `src/`; `/@` → `vome-core` Admin package.

## Adding a CRUD page (sketch)

1. Declare Entity + `@Controller` CRUD on Service (Admin routes)  
2. Add `src/modules/<m>/views/<page>/index.vue`  
3. Set menu `viewPath` (e.g. `modules/base/views/user/index`)  
4. Example:

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
    { prop: 'username', label: 'Username' },
    { type: 'op', buttons: ['edit', 'delete'] },
  ],
})
</script>
```

Forms: `vm-upsert` + `useUpsert`; confirms: `vmConfirm`.

## Theming

| Layer | File | Skinning |
| --- | --- | --- |
| Colors | `src/styles/theme.css` | ✅ |
| Structure | vome-core `base.css` | ❌ |

`main.ts`: `theme.css` first, then core `base.css`. Prefer scoped SCSS in pages.

## Built-in pages (partial)

| Module | Pages |
| --- | --- |
| base | Users, roles, menus, dict, tasks, queues, request logs, tenants… |
| user | App users, app roles |
| helper | Plugin manager (wujie) |

## Related projects

| Project | Role |
| --- | --- |
| [vome-service](https://gitee.com/vomekj/vome-service) | Bun + Elysia backend (required) |
| [vome-web](https://gitee.com/vomekj/vome-web) | Consumer Web (App side) |
| UniApp / Docs | Mobile & docs site |
| [vome-core](https://www.npmjs.com/package/vome-core) | Shared framework package |

## Contributing

1. Fork this repo  
2. Create `feat/xxx`  
3. Commit and push  
4. Open a Pull / Merge Request  

Issues and PRs in Chinese or English are welcome.

## License

[MIT](./LICENSE) © VomeShop / 微茫科技

---

If this project helps you, a Star ⭐ is appreciated.
