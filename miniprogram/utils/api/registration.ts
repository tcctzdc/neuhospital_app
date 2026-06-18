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

export interface CreateRegistrationPayload {
  patientId: number
  scheduleId: number
  visitDate: string
  timeSlot: string
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

export async function createRegistration(payload: CreateRegistrationPayload): Promise<RegistrationDto> {
  return request<RegistrationDto>({
    url: '/registrations',
    method: 'POST',
    data: payload as unknown as Record<string, unknown>,
  })
}

export async function cancelRegistration(id: number): Promise<void> {
  await request({ url: `/registrations/${id}/cancel`, method: 'POST' })
}
