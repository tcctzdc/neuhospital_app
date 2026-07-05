import { request } from '../request'
import { unwrapList } from '../format'

export interface PatientDto {
  id: number
  name?: string
  realName?: string
  gender?: string
  birthDate?: string
  phone?: string
  idCard?: string
  bloodType?: string
  allergySummary?: string
  historySummary?: string
}

export async function fetchPatient(id: number): Promise<PatientDto> {
  return request<PatientDto>({ url: `/patients/${id}`, method: 'GET' })
}

export async function updatePatient(id: number, payload: Partial<PatientDto>): Promise<void> {
  await request({
    url: `/patients/${id}`,
    method: 'PUT',
    data: payload as Record<string, unknown>,
  })
}
