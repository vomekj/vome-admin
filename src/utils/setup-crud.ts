import { Plugins, setCrudConfig } from '/@/crud'

/** 全局 Form / Search / Table 默认插件与样式 */
export function setupCrudDefaults() {
  setCrudConfig({
    style: {
      form: {
        labelPosition: 'top',
        labelWidth: '100px',
        span: 24,
        plugins: [Plugins.Form.setFocus(), Plugins.Form.setRules()],
      },
      search: {
        plugins: [Plugins.Search.setAuto()],
      },
      table: {
        border: false,
        highlightCurrentRow: true,
        autoHeight: true,
        contextMenu: [
          'refresh',
          'check',
          'edit',
          'delete',
          'order-asc',
          'order-desc',
        ],
        column: { align: 'left', opWidth: 180 },
        plugins: [],
      },
    },
  })
}
