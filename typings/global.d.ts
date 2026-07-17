/**
 * 业务常用类型全局可用（无需 import type）。
 * 框架类型来自 vome-core/typings；宿主扩展见 @typings/user。
 */
export {}

declare global {
  /* —— CRUD —— */
  type CrudService = import('vome-core/typings/comm/crud').CrudService
  type CrudPermission = import('vome-core/typings/comm/crud').CrudPermission
  type CrudDict = import('vome-core/typings/comm/crud').CrudDict
  type CrudFormComponent = import('vome-core/typings/comm/crud').CrudFormComponent
  type CrudSearchItem = import('vome-core/typings/comm/crud').CrudSearchItem
  type CrudOpButton = import('vome-core/typings/comm/crud').CrudOpButton
  type CrudColumn = import('vome-core/typings/comm/crud').CrudColumn
  type CrudFormItem = import('vome-core/typings/comm/crud').CrudFormItem
  type CrudTrashMode = import('vome-core/typings/comm/crud').CrudTrashMode
  type CrudRefreshHelpers = import('vome-core/typings/comm/crud').CrudRefreshHelpers
  type CrudDeleteHelpers = import('vome-core/typings/comm/crud').CrudDeleteHelpers
  type CrudOptions = import('vome-core/typings/comm/crud').CrudOptions
  type CrudUpsertOptions = import('vome-core/typings/comm/crud').CrudUpsertOptions
  type CrudTableOptions = import('vome-core/typings/comm/crud').CrudTableOptions
  type CrudSearchOptions = import('vome-core/typings/comm/crud').CrudSearchOptions
  type CrudContext = import('vome-core/typings/comm/crud').CrudContext
  type CtxMenuItem = import('vome-core/typings/comm/crud').CtxMenuItem
  type TreeSelectOption = import('vome-core/typings/comm/crud').TreeSelectOption
  type TablePlugin = import('vome-core/typings/comm/crud').TablePlugin
  type UploadItem = import('vome-core/typings/comm/upload').UploadItem
  type UploadFileType = import('vome-core/typings/comm/upload').UploadFileType

  /* —— EPS / 级联 —— */
  type EpsApiItem = import('vome-core/typings/comm/eps').EpsApiItem
  type EpsColumn = import('vome-core/typings/comm/eps').EpsColumn
  type EpsEntity = import('vome-core/typings/comm/eps').EpsEntity
  type EpsModuleMap = import('vome-core/typings/comm/eps').EpsModuleMap
  type EpsSide = import('/@/lib/eps').EpsSide
  type GroupCascaderNode = import('vome-core/typings/comm/cascader').GroupCascaderNode
  type CheckTreeNode = import('vome-core/typings/comm/check-tree').CheckTreeNode
  type AutoPermRow = import('vome-core/typings/comm/eps').AutoPermRow

  /* —— HTTP / Service —— */
  type ApiResult<T = unknown> = import('vome-core/typings/comm/request').ApiResult<T>
  type RequestOptions = import('vome-core/typings/comm/request').RequestOptions
  type ServiceRequestOptions = import('vome-core/typings/comm/service').ServiceRequestOptions
  type ServiceLeaf = import('vome-core/typings/comm/service').ServiceLeaf
  type ServiceTree = import('vome-core/typings/comm/service').ServiceTree

  /* —— 权限 / 认证 —— */
  type MenuTreeNode = import('vome-core/typings/base/permission').MenuTreeNode
  type TokenPair = import('vome-core/typings/base/auth').TokenPair
  type AuthMe = import('vome-core/typings/base/auth').AuthMe
  type AuthPerms = import('vome-core/typings/base/auth').AuthPerms

  /* —— 宿主用户 —— */
  type AppUserRow = import('@typings/user/info').AppUserRow

  /* —— 壳层 —— */
  type BrowserScreen = import('vome-core/typings/vome/browser').BrowserScreen
  type BrowserInfo = import('vome-core/typings/vome/browser').BrowserInfo
  type TagItem = import('vome-core/typings/vome/tags').TagItem
  type ViewLoader = import('vome-core/typings/vome/module').ViewLoader
  type ViewsTreeNode = import('vome-core/typings/vome/module').ViewsTreeNode
  type ThemeTokens = import('@typings/theme').ThemeTokens
  type ThemeDefinition = import('@typings/theme').ThemeDefinition
}
