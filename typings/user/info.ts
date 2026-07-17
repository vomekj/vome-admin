/** 前端用户（user_info 列表项） */
export type AppUserRow = {
  id: string
  name?: string | null
  email?: string | null
  emailVerified?: boolean
  image?: string | null
  tenantId?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}
