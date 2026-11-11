export interface AuthUser {
  id: number
  name: string
  email: string
  roles: string[]
  active?: boolean
  storeId?: number | null
  storeName?: string | null
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  userId: number
  name: string
  email: string
  roles: string[]
}
