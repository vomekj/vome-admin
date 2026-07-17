import { registerViews } from '/@'

const viewModules = import.meta.glob<{ default: import('vue').Component }>(
  './modules/*/views/**/*.vue',
)

/** 宿主业务视图：菜单 viewPath 解析依赖此 glob */
registerViews(viewModules)

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // glob 变更后需整模块重跑才能刷新；invalidate 触发再执行
    import.meta.hot!.invalidate()
  })
}
