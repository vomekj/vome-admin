import { setCrudTranslator } from '/@/crud'
import { service } from '/@/service'
import { createLocaleStore } from 'vome-core/client'

export type { I18nLangItem } from 'vome-core/client'

/** admin 宿主语言包 store（逻辑在 vome-core） */
export const useLocaleStore = createLocaleStore({
  storageKey: 'vome_admin_locale',
  scopeKey: 'admin',
  langMode: 'admin',
  enableMenu: true,
  persist: {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
  },
  getPackApi: () =>
    (service as { i18n?: { pack?: any } }).i18n?.pack as
      | undefined,
  onPackLoaded: ({ t }) => {
    setCrudTranslator((key, fallback) => t(key, fallback))
  },
})
