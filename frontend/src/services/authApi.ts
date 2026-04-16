import { apiJson } from '@/services/http'
import type { AuthUser } from '@/types/user'

export type AuthSuccessResponse = {
  token: string
  user: AuthUser
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
}

export function loginRequest(body: LoginPayload): Promise<AuthSuccessResponse> {
  return apiJson<AuthSuccessResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function registerRequest(body: RegisterPayload): Promise<AuthSuccessResponse> {
  return apiJson<AuthSuccessResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
