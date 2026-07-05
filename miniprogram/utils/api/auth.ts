import { request } from '../request'
import { unwrapList } from '../format'

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  realName: string
  phone: string
  idCard?: string
  gender?: string
}

export interface UserMeDto {
  userId: number
  username: string
  realName?: string
  userType?: string
  bizId?: number
  phone?: string
  roles?: string[]
}

export interface LoginResult extends UserMeDto {
  accessToken: string
  refreshToken: string
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  return request<LoginResult>({
    url: '/auth/login',
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
    skipToken: true,
  })
}

export async function register(payload: RegisterPayload): Promise<void> {
  await request({
    url: '/auth/register',
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
    skipToken: true,
  })
}

export async function fetchMe(options?: { silent?: boolean }): Promise<UserMeDto> {
  return request<UserMeDto>({ url: '/auth/me', method: 'GET', silent: options?.silent })
}

export async function logout(): Promise<void> {
  await request({ url: '/auth/logout', method: 'POST' })
}

export async function refreshToken(refreshToken: string): Promise<LoginResult> {
  return request<LoginResult>({
    url: '/auth/refresh',
    method: 'POST',
    data: { refreshToken },
    skipToken: true,
  })
}
