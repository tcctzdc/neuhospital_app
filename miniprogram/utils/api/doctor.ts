import { request } from '../request'
import { unwrapList } from '../format'

export interface DoctorDto {
  id: number
  name: string
  title?: string
  specialty?: string
  departmentId?: number
  departmentName?: string
  registrationFee?: number
  fee?: number
}

export interface ScheduleDto {
  id: number
  doctorId: number
  departmentId?: number
  scheduleDate?: string
  timeSlot?: string
  remainQuota?: number
  totalQuota?: number
  feeAmount?: number
  status?: string
}

export async function fetchDoctors(departmentId?: number): Promise<DoctorDto[]> {
  const data = await request<DoctorDto[] | { records: DoctorDto[] }>({
    url: '/doctors',
    method: 'GET',
    data: departmentId ? { departmentId } : undefined,
    needAuth: false,
  })
  return unwrapList(data)
}

export async function fetchDoctor(id: number): Promise<DoctorDto> {
  return request<DoctorDto>({ url: `/doctors/${id}`, method: 'GET', needAuth: false })
}

export async function fetchSchedules(params: {
  departmentId?: number
  doctorId?: number
  scheduleDate?: string
}): Promise<ScheduleDto[]> {
  const data = await request<ScheduleDto[] | { records: ScheduleDto[] }>({
    url: '/schedules',
    method: 'GET',
    data: params as Record<string, unknown>,
    needAuth: false,
  })
  return unwrapList(data)
}
