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
  availableCount?: number
  totalQuota?: number
  feeAmount?: number
  status?: string
}

function normalizeSchedule(raw: ScheduleDto): ScheduleDto {
  const remain = raw.remainQuota ?? raw.availableCount
  return {
    ...raw,
    remainQuota: remain ?? 0,
  }
}

export async function fetchDoctors(params?: {
  departmentId?: number
  keyword?: string
  pageNo?: number
  pageSize?: number
}): Promise<DoctorDto[]> {
  const data = await request<DoctorDto[] | { records: DoctorDto[] }>({
    url: '/doctors/page',
    method: 'GET',
    data: params as Record<string, unknown>,
  })
  return unwrapList(data)
}

export async function fetchDoctor(id: number): Promise<DoctorDto> {
  return request<DoctorDto>({ url: `/doctors/${id}`, method: 'GET' })
}

/** 患者端查排班：默认 bookableOnly=true，仅返回 7 天窗口内可预约排班 */
export async function fetchSchedules(params: {
  departmentId?: number
  doctorId?: number
  scheduleDate?: string
  bookableOnly?: boolean
  pageNo?: number
  pageSize?: number
}): Promise<ScheduleDto[]> {
  const data = await request<ScheduleDto[] | { records: ScheduleDto[] }>({
    url: '/schedules',
    method: 'GET',
    data: {
      pageNo: 1,
      pageSize: 50,
      bookableOnly: true,
      ...params,
    } as Record<string, unknown>,
  })
  return unwrapList(data).map(normalizeSchedule)
}
