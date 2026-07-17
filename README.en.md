# Vome Admin

[简体中文](./README.md) | English

A blue-themed admin console scaffold built with **Vue 3 + Vite**. CRUD UI, layout shell, route guards, and the EPS client come from [`vome-core`](https://www.npmjs.com/package/vome-core); business pages live under `src/modules/`, while menus and permissions are loaded dynamically from **Vome Service**.

> Open-sourced by Vome / 微茫科技. Requires [vome-service](https://gitee.com/vomekj/vome-service).

## Features

| Capability | Description |
| --- | --- |
| **vm-crud suite** | Search, toolbar, table, pagination, upsert dialogs, recycle bin, import / export |
| **EPS-driven API** | Fetches backend descriptors and generates typed `service.base.*` clients |
| **Dynamic menus** | Routes from `base_menu`; `viewPath` maps to `modules/**/views` |
| **Button-level ACL** | Aligned with Service RBAC codes (`v-perm` / `_permission`) |
| **Themed styling** | `theme.css` for colors + core `base.css` for structure; light / dark |
| **App shell** | Sidebar, header, multi-tabs, collapse / mobile drawer |
| **Plugins** | wujie micro-frontend for plugin docs / extensions |
| **Dict / upload / Socket** | Host stores + framework components ready to use |
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
| **Vome Service** | Backend must be running (default `http://127.0.0.1:3000`) |

## Quick start

```bash
git clone https://gitee.com/vomekj/vome-admin.git
cd vome-admin
bun install
```

### 1. Proxy to Service

Dev proxy is in `src/config/proxy.ts` (defaults to local Service):

```ts
'/dev/': {
  target: 'http://127.0.0.1:3000',
  // …
}
```

Change `target` if Service is not on port `3000`.

### 2. Run

Start [vome-service](https://gitee.com/vomekj/vome-service) first, then:

```bash
bun run dev
```

| Item | Notes |
| --- | --- |
| URL | [http://localhost:9000](http://localhost:9000) |
| Proxy | `/dev` → Service |
| EPS | Auto-fetched in dev → `typings/eps.d.ts` |

### 3. Sign in

Default super admin from Service seed (`base/db.json`):

| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `123456` |

Menus come from the backend after login. If the sidebar is empty, ensure Service imported `menu.json`.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Dev server on port **9000** |
| `bun run build` | Production build → `dist/` |
| `bun run preview` | Preview the production build |

## Project layout

```text
vome-admin/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── base/views/       # Users, roles, menus, dict, tasks, queues, logs, tenants…
│   │   ├── user/views/       # App users / roles
│   │   └── helper/views/     # Plugins, etc.
│   ├── components/
│   │   ├── layout/           # Shell: sidebar, header, tabs
│   │   └── ui/               # shadcn-vue primitives
│   ├── pages/                # login / layout / home / missing / micro…
│   ├── config/               # index / dev / prod / proxy (no .env)
│   ├── stores/
│   ├── styles/theme.css      # Color tokens (#4E5DFF)
│   ├── themes/
│   └── views-registry.ts
├── plugins/                  # eps, vome-resolve, unplugin
├── typings/
└── vite.config.ts
```

Aliases:

| Alias | Points to |
| --- | --- |
| `@` | `src/` |
| `@config` | `src/config/` |
| `/@` | `vome-core` Admin package |

## Adding a CRUD page (sketch)

1. Create Entity / Controller on Service (declarative CRUD)  
2. Add `src/modules/<m>/views/<page>/index.vue`  
3. Set menu `viewPath` (e.g. `modules/base/views/user/index`)  
4. Use the standard `vm-crud` layout:

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

Forms use `vm-upsert` + `useUpsert`; confirms use `vmConfirm` — don’t invent a parallel dialog skin.

## Theming

| Layer | File | Skinning |
| --- | --- | --- |
| Colors | `src/styles/theme.css` | ✅ CSS variables |
| Structure | core `base.css` | ❌ layout / control sizes locked |

Import order in `main.ts`: `theme.css` first, then core `base.css`. Prefer scoped SCSS in pages.

## Built-in pages (partial)

| Module | Pages |
| --- | --- |
| base | Users, roles, menus, dict, tasks, queues, request logs, tenants… |
| user | App users, app roles |
| helper | Plugin manager (wujie docs) |

## Relationship to Service

- Admin does **not** embed backend code; HTTP goes through the Vite proxy  
- Permission codes, menus, and sessions match Service Admin RBAC  
- After upgrading `vome-core`, run `bun install` and follow the changelog  

Backend: [vome-service](https://gitee.com/vomekj/vome-service)

## Related projects

| Project | Role |
| --- | --- |
| [vome-service](https://gitee.com/vomekj/vome-service) | Bun + Elysia backend |
| Web / UniApp / Docs | Consumer apps & docs site |
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
