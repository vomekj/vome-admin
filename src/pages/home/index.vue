<template>
  <div class="vm-home">
    <section class="vm-home__top">
      <div class="vm-home__hero">
        <div class="vm-home__hero-text">
          <p class="vm-home__eyebrow">Overview</p>
          <h2 class="vm-home__hello">你好，{{ user.username || '管理员' }}</h2>
          <p class="vm-home__desc">
            从左侧菜单进入业务页面。本地页按 viewPath 加载，插件微应用走 appKey +
            wujie。菜单与权限由服务端动态下发，无权限入口不会出现在侧栏；插件页与主壳共享登录态。
          </p>
        </div>
        <div class="vm-home__hero-art" aria-hidden="true" />
      </div>

      <aside class="vm-home__session">
        <div class="vm-home__session-head">
          <div class="vm-home__card-icon is-violet">
            <i class="ri-user-smile-line" />
          </div>
          <div>
            <p class="vm-home__session-label">会话摘要</p>
            <h3 class="vm-home__session-name">
              {{ user.username || '管理员' }}
            </h3>
          </div>
        </div>
        <ul class="vm-home__stats">
          <li>
            <span>可见菜单</span>
            <strong>{{ menuCount }}</strong>
          </li>
          <li>
            <span>权限码</span>
            <strong>{{ permCount }}</strong>
          </li>
          <li>
            <span>角色</span>
            <strong>{{ user.isSuper ? '超级管理员' : '普通管理员' }}</strong>
          </li>
        </ul>
      </aside>
    </section>

    <section class="vm-home__grid">
      <article class="vm-home__card">
        <div class="vm-home__card-icon is-blue">
          <i class="ri-apps-line" />
        </div>
        <h3>{{ config.app.name }}</h3>
        <p>当前后台工作台，菜单与权限由服务端动态下发。</p>
      </article>
      <article class="vm-home__card">
        <div class="vm-home__card-icon is-cyan">
          <i class="ri-route-line" />
        </div>
        <h3>动态路由</h3>
        <p>按权限树挂载页面；无权限入口不会出现在侧栏。</p>
      </article>
      <article class="vm-home__card">
        <div class="vm-home__card-icon is-peach">
          <i class="ri-plug-line" />
        </div>
        <h3>微应用</h3>
        <p>插件页通过 wujie 嵌入，与主壳共享登录态。</p>
      </article>
    </section>

    <section class="vm-home__bottom">
      <article class="vm-home__panel">
        <header class="vm-home__panel-head">
          <div class="vm-home__card-icon is-blue">
            <i class="ri-flashlight-line" />
          </div>
          <div>
            <h3>快捷入口</h3>
            <p>来自当前账号可见菜单</p>
          </div>
        </header>
        <div v-if="shortcuts.length" class="vm-home__shortcuts">
          <RouterLink
            v-for="item in shortcuts"
            :key="item.path"
            :to="item.path"
            class="vm-home__shortcut"
          >
            <i :class="item.icon" />
            <span>{{ item.name }}</span>
          </RouterLink>
        </div>
        <p v-else class="vm-home__empty">暂无可见菜单，请联系管理员分配权限。</p>
      </article>

      <article class="vm-home__panel">
        <header class="vm-home__panel-head">
          <div class="vm-home__card-icon is-mint">
            <i class="ri-stack-line" />
          </div>
          <div>
            <h3>框架能力</h3>
            <p>与本后台运行时对齐的能力清单</p>
          </div>
        </header>
        <ul class="vm-home__caps">
          <li v-for="cap in capabilities" :key="cap.title">
            <i :class="cap.icon" />
            <div>
              <strong>{{ cap.title }}</strong>
              <span>{{ cap.desc }}</span>
            </div>
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { config } from '@/config'

const user = useUserStore()

function walkMenus(nodes: MenuTreeNode[]): MenuTreeNode[] {
  const out: MenuTreeNode[] = []
  for (const n of nodes) {
    out.push(n)
    if (n.children?.length) out.push(...walkMenus(n.children))
  }
  return out
}

const flatMenus = computed(() => walkMenus(user.navMenus))

const menuCount = computed(() => flatMenus.value.length)

const permCount = computed(() =>
  user.isSuper ? '∞' : String(user.perms.length),
)

const shortcuts = computed(() => {
  const pages = flatMenus.value.filter(
    (m) => Number(m.type) === 1 && !!m.router,
  )
  return pages.slice(0, 8).map((m) => ({
    name: m.name,
    path: m.router!.startsWith('/') ? m.router! : `/${m.router}`,
    icon: m.icon || 'ri-file-list-3-line',
  }))
})

const capabilities = [
  {
    title: '双 RBAC',
    desc: 'Admin / App 两侧权限隔离，菜单与接口码统一下发',
    icon: 'ri-shield-keyhole-line',
  },
  {
    title: 'EPS 实体描述',
    desc: '前端按侧生成 service，表格列与接口契约同源',
    icon: 'ri-database-2-line',
  },
  {
    title: '声明式 CRUD',
    desc: 'vm-crud + useCrud，列表 / 回收站 / Upsert 开箱即用',
    icon: 'ri-table-line',
  },
  {
    title: '.vome 插件',
    desc: 'server / web 打包安装，钩子与微应用统一热加载',
    icon: 'ri-puzzle-2-line',
  },
  {
    title: 'wujie 微应用',
    desc: 'GET /vome/apps/:key/ 静态托管，与主壳共享登录态',
    icon: 'ri-window-line',
  },
  {
    title: 'Better Auth',
    desc: '会话与鉴权由框架托管，业务页只关心权限码',
    icon: 'ri-lock-password-line',
  },
] as const
</script>

<style lang="scss" scoped>
.vm-home {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.vm-home__top {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 1100px) {
    grid-template-columns: minmax(0, 1fr) 300px;
    align-items: stretch;
  }
}

.vm-home__hero {
  position: relative;
  display: flex;
  min-height: 124px;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  padding: 20px 26px;
  border-radius: 26px;
  background: linear-gradient(135deg, #4e5dff 0%, #6b7bff 55%, #8b9bff 100%);
  color: #fff;
  box-shadow: 0 14px 36px rgba(78, 93, 255, 0.26);
}

.vm-home__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.75;
}

.vm-home__hello {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.vm-home__desc {
  max-width: 560px;
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  opacity: 0.88;
}

.vm-home__hero-art {
  position: absolute;
  right: -56px;
  top: -72px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 68%);
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    right: 72px;
    bottom: -28px;
    width: 160px;
    height: 160px;
    border-radius: 40% 60% 55% 45%;
    background: rgba(255, 255, 255, 0.14);
  }

  &::before {
    content: '';
    position: absolute;
    right: 28px;
    top: 96px;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }
}

.vm-home__session {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 26px;
  background: var(--card);
  box-shadow: var(--shadow-soft);
}

.vm-home__session-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vm-home__session-label {
  margin: 0 0 2px;
  font-size: 12px;
  color: var(--muted-foreground);
  font-weight: 500;
}

.vm-home__session-name {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--foreground);
}

.vm-home__stats {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  gap: 7px;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 12px;
    border-radius: 14px;
    background: var(--background);

    span {
      font-size: 13px;
      color: var(--muted-foreground);
      font-weight: 500;
    }

    strong {
      font-size: 14px;
      font-weight: 700;
      color: var(--foreground);
    }
  }
}

.vm-home__grid {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 14px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.vm-home__card {
  padding: 16px 18px;
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow-soft);

  h3 {
    margin: 10px 0 5px;
    font-size: 15px;
    font-weight: 650;
    color: var(--foreground);
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted-foreground);
    font-weight: 500;
  }
}

.vm-home__bottom {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 1100px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }
}

.vm-home__panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 16px 18px;
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.vm-home__panel-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  h3 {
    margin: 0 0 2px;
    font-size: 15px;
    font-weight: 650;
    color: var(--foreground);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--muted-foreground);
    font-weight: 500;
  }
}

.vm-home__shortcuts {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-content: start;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (min-width: 900px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.vm-home__shortcut {
  display: flex;
  min-height: 58px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  padding: 12px;
  border-radius: 16px;
  background: var(--background);
  color: var(--foreground);
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;

  i {
    font-size: 17px;
    color: var(--brand);
  }

  span {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
  }

  &:hover {
    background: var(--brand-soft);
    color: var(--brand);
    transform: translateY(-1px);
  }
}

.vm-home__empty {
  margin: 0;
  padding: 16px 4px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--muted-foreground);
  font-weight: 500;
}

.vm-home__caps {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 7px;
  overflow: hidden;

  li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 9px 12px;
    border-radius: 14px;
    background: var(--background);

    > i {
      display: inline-flex;
      width: 26px;
      height: 26px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
      border-radius: 9px;
      background: #eef0ff;
      color: var(--brand);
      font-size: 14px;
    }

    strong {
      display: block;
      margin-bottom: 2px;
      font-size: 13px;
      font-weight: 650;
      color: var(--foreground);
    }

    span {
      font-size: 12px;
      line-height: 1.45;
      color: var(--muted-foreground);
      font-weight: 500;
    }
  }
}

.vm-home__card-icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  font-size: 17px;

  &.is-blue {
    background: #eef0ff;
    color: var(--brand);
  }

  &.is-cyan {
    background: #e6f8f7;
    color: #1aa6a0;
  }

  &.is-peach {
    background: #fff0e8;
    color: #e07a45;
  }

  &.is-violet {
    background: #f3eefc;
    color: #7b61c4;
  }

  &.is-mint {
    background: #e8f7ef;
    color: #2f9e6b;
  }
}
</style>
