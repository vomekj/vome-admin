import {
  getDict,
  getDictOptions,
  hydrateDictFromEps,
  type EpsDictNode,
} from 'vome-core/client'

export type DictNode = EpsDictNode

function isEmpty(val: unknown) {
  return val === '' || val === null || val === undefined
}

function sameValue(a: unknown, b: unknown) {
  if (a === b) return true
  if (a == null || b == null) return false
  return String(a) === String(b)
}

/** 树上按 value 找节点 */
function deepFind(
  value: unknown,
  list: DictNode[],
  parents: string[] = [],
): DictNode | undefined {
  for (const e of list) {
    if (sameValue(e.value, value)) {
      return {
        ...e,
        label: parents.length
          ? [...parents, e.label || e.name].join(' / ')
          : e.label || e.name,
      }
    }
    if (e.children?.length) {
      const hit = deepFind(value, e.children, [
        ...parents,
        e.label || e.name,
      ])
      if (hit) return hit
    }
  }
  return undefined
}

function snapshot(keys?: string[]) {
  const out: Record<string, DictNode[]> = {}
  for (const k of keys || []) out[k] = getDict(k)
  return out
}

/**
 * 字典 store：读 EPS 灌入的本地缓存（createEps / loadEps）
 * - get：整棵树
 * - options：根项摊平 + color → 下拉 / 彩色标签 / vm-switch 取值
 * - 业务页勿 refresh；字典管理页改完后 refresh(key, true)
 */
export const useDictStore = defineStore('dict', () => {
  function get(name: string) {
    return computed(() => getDict(name))
  }

  function find(name: string, value: unknown | unknown[]) {
    const arr = Array.isArray(value) ? value : [value]
    return arr
      .filter((e) => e !== undefined)
      .map((v) => deepFind(v, get(name).value))
  }

  function options(typeKey: string) {
    return computed(() => getDictOptions(typeKey))
  }

  /**
   * 默认只读 EPS 本地缓存，不打网络。
   * 仅 force=true（字典管理改完后）才请求 /data。
   */
  async function refresh(
    types?: string[] | string,
    forceOrOpts: boolean | { force?: boolean } = false,
  ) {
    const force =
      typeof forceOrOpts === 'boolean'
        ? forceOrOpts
        : Boolean(forceOrOpts?.force)
    const list = typeof types === 'string' ? [types] : types
    const keys = list?.filter((e) => !isEmpty(e)) as string[] | undefined

    if (!force) return snapshot(keys)

    const res = (await service.base.dict.info.data({
      types: keys,
    })) as Record<string, unknown>
    hydrateDictFromEps(res as never)
    const outKeys = keys?.length ? keys : Object.keys(res || {})
    return snapshot(outKeys)
  }

  return {
    get,
    find,
    options,
    refresh,
  }
})

/** const { dict } = useDict() */
export function useDict() {
  const dict = useDictStore()
  return { dict }
}
