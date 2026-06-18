import { fetchDoctors, fetchSchedules, DoctorDto } from './doctor'
import { firstChar } from '../format'

export interface DoctorCardView {
  id: number
  name: string
  title: string
  department: string
  specialty: string
  statusText: string
  statusType: string
  fee: string
  avatarText: string
}

export async function loadDoctorCards(options: {
  departmentId?: number
  scheduleDate: string
  departmentName?: string
}): Promise<DoctorCardView[]> {
  const { departmentId, scheduleDate, departmentName } = options
  const [doctorList, scheduleList] = await Promise.all([
    fetchDoctors(departmentId),
    fetchSchedules({ departmentId, scheduleDate }),
  ])
  const scheduleByDoctor = new Map<number, typeof scheduleList>()
  scheduleList.forEach((s) => {
    const arr = scheduleByDoctor.get(s.doctorId) || []
    arr.push(s)
    scheduleByDoctor.set(s.doctorId, arr)
  })
  return doctorList.map((doc) => mapDoctorCard(doc, scheduleByDoctor.get(doc.id) || [], departmentName))
}

function mapDoctorCard(doc: DoctorDto, schedules: Array<{ remainQuota?: number; feeAmount?: number }>, departmentName?: string): DoctorCardView {
  const totalRemain = schedules.reduce((sum, s) => sum + (s.remainQuota ?? 0), 0)
  const fee = doc.registrationFee ?? doc.fee ?? schedules[0]?.feeAmount ?? 0
  return {
    id: doc.id,
    name: doc.name,
    title: doc.title || '医师',
    department: departmentName || doc.departmentName || '',
    specialty: doc.specialty || '暂无简介',
    statusText: totalRemain > 0 ? `余号 ${totalRemain}` : '无号',
    statusType: totalRemain > 3 ? 'success' : totalRemain > 0 ? 'warning' : 'danger',
    fee: String(fee),
    avatarText: firstChar(doc.name),
  }
}
