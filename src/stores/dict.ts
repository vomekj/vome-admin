export type DictNode = {
  id: number
  name: string
  label: string
  typeId: number
  parentId: number | null
  orderNum: number
  value: unknown
  children?: DictNode[]
}

type DictData = Record<string, DictNode[]>

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
        label: parents.length ? [...parents, e.label || e.name].join(' / ') : e.label || e.name,
      }
    }
    if (e.children?.length) {
      const hit = deepFind(value, e.children, [...parents, e.label || e.name])
      if (hit) return hit
    }
  }
  return undefined
}

function walkByNames(list: DictNode[], names: string[]): DictNode | undefined {
  if (!names.length) return undefined
  const [head, ...rest] = names
  const node = list.find((e) => e.name === head)
  if (!node) return undefined
  if (!rest.length) return node
  return walkByNames(node.children ?? [], rest)
}

/**
 * 字典 store
 * - get(类型key) → 树
 * - find(类型key, value) → 节点
 * - pathValue / childValue → 直取子项 value
 */
export const useDictStore = defineStore('dict', () => {
  const data = reactive<DictData>({})

  function get(name: string) {
    return computed(() => data[name] || [])
  }

  function find(name: string, value: unknown | unknown[]) {
    const arr = Array.isArray(value) ? value : [value]
    return arr
      .filter((e) => e !== undefined)
      .map((v) => deepFind(v, get(name).value))
  }

  /** 名称路径直取 value：pathValue('state', ['正常', 'tagColor']) */
  function pathValue(typeKey: string, path: string[]) {
    const names = (path ?? []).map((n) => String(n ?? '').trim()).filter(Boolean)
    return walkByNames(get(typeKey).value, names)?.value
  }

  /** 父 value + 子名称：childValue('state', 0, 'tagColor') */
  function childValue(typeKey: string, parentValue: unknown, childName: string) {
    const parent = deepFind(parentValue, get(typeKey).value)
    const name = String(childName ?? '').trim()
    return parent?.children?.find((c) => c.name === name)?.value
  }

  /** 根项 → 下拉/标签 options（子项 name=color 作为标签色） */
  function options(typeKey: string) {
    return computed(() =>
      (get(typeKey).value || []).map((n) => {
        const colorChild = n.children?.find((c) => c.name === 'color')
        return {
          label: n.label || n.name,
          value: n.value as string | number,
          color:
            colorChild?.value != null && colorChild.value !== ''
              ? String(colorChild.value)
              : undefined,
        }
      }),
    )
  }

  /** 单选/radio 用字符串 value（upsert radio 惯例） */
  function stringOptions(typeKey: string) {
    return computed(() =>
      options(typeKey).value.map((o) => ({
        ...o,
        value: String(o.value),
      })),
    )
  }

  async function refresh(types?: string[] | string) {
    const list = typeof types === 'string' ? [types] : types
    const res = (await service.base.dict.info.data({
      types: list?.filter((e) => !isEmpty(e)) as string[] | undefined,
    })) as Record<string, DictNode[]>

    const next: DictData = {}
    for (const [key, arr] of Object.entries(res || {})) {
      const rows: DictNode[] = (arr || []).map((e) => {
        const value = isEmpty(e.value) ? e.id : e.value
        return {
          ...e,
          label: e.name,
          value,
        }
      })
      next[key] = deepTree(rows, 'asc')
    }
    Object.assign(data, next)
    return data
  }

  return {
    data,
    get,
    find,
    pathValue,
    childValue,
    options,
    stringOptions,
    refresh,
  }
})

/** const { dict } = useDict() */
export function useDict() {
  const dict = useDictStore()
  return { dict }
}
