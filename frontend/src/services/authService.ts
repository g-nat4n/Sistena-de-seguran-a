import { api } from './api'
import { clearToken, getToken, setToken } from './tokenStorage'
import type { AuthUser, LoginResponse } from '../types/auth'

export { getToken, clearToken }

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  setToken(data.accessToken)
  return data
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me')
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    roles: data.roles,
    active: data.active,
    storeId: data.storeId,
    storeName: data.storeName,
  }
}

export async function fetchUsers(): Promise<AuthUser[]> {
  const { data } = await api.get<AuthUser[]>('/auth/users')
  return data
}

export function logout() {
  clearToken()
}
