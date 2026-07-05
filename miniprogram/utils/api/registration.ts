import { request } from '../request'
import { unwrapList } from '../format'

export interface RegistrationDto {
  id?: number
  registrationId?: number
  registrationNo?: string
  patientId?: number
  scheduleId?: number
  doctorId?: number
  doctorName?: string
  departmentId?: number
  departmentName?: string
  visitDate?: string
  timeSlot?: string
  queueNo?: string
  feeAmount?: number
  status?: string
}

/** 快速挂号：仅传 scheduleId，patientId 由后端从 Token 解析 */
export interface QuickRegistrationPayload {
  scheduleId: number
}

export async function fetchMyRegistrations(): Promise<RegistrationDto[]> {
  const data = await request<RegistrationDto[] | { records: RegistrationDto[] }>({
    url: '/registrations/my',
    method: 'GET',
  })
  return unwrapList(data)
}

export async function fetchRegistration(id: number): Promise<RegistrationDto> {
  return request<RegistrationDto>({ url: `/registrations/${id}`, method: 'GET' })
}

export async function quickRegistration(payload: QuickRegistrationPayload): Promise<RegistrationDto> {
  return request<RegistrationDto>({
    url: '/registrations/quick',
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export async function cancelRegistration(id: number): Promise<void> {
  await request({ url: `/registrations/${id}/cancel`, method: 'POST' })
}

export async function checkInRegistration(id: number): Promise<void> {
  await request({ url: `/registrations/${id}/check-in`, method: 'POST' })
}

/** @deprecated 使用 quickRegistration */
export const createRegistration = quickRegistration
