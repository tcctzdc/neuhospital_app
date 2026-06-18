import { request } from '../request'
import { unwrapList } from '../format'

export interface MedicalRecordDto {
  id: number
  chiefComplaint?: string
  preliminaryDiagnosis?: string
  departmentName?: string
  doctorName?: string
  createdAt?: string
  visitDate?: string
  status?: string
  presentIllness?: string
  pastHistory?: string
  allergyHistory?: string
  physicalExam?: string
}

export interface PrescriptionDto {
  id: number
  prescriptionNo?: string
  doctorName?: string
  departmentName?: string
  createdAt?: string
  status?: string
  itemCount?: number
  items?: unknown[]
}

export interface CheckResultDto {
  id: number
  checkName?: string
  name?: string
  departmentName?: string
  createdAt?: string
  status?: string
}

export interface InspectionResultDto {
  id: number
  inspectionName?: string
  name?: string
  departmentName?: string
  createdAt?: string
  status?: string
}

export interface CtAnalysisTaskDto {
  id: number
  taskId?: number
  analysisType?: string
  status?: string
  riskLevel?: string
  createdAt?: string
}

export interface MedicalDiagnosisDto {
  diagnosisName?: string
  name?: string
  icdCode?: string
  code?: string
}

export async function fetchPatientRecords(patientId: number): Promise<MedicalRecordDto[]> {
  const data = await request<MedicalRecordDto[] | { records: MedicalRecordDto[] }>({
    url: `/patients/${patientId}/records`,
    method: 'GET',
  })
  return unwrapList(data)
}

export async function fetchMedicalRecord(id: number): Promise<MedicalRecordDto> {
  return request<MedicalRecordDto>({ url: `/outpatient/records/${id}`, method: 'GET' })
}

export async function fetchMedicalDiagnoses(recordId: number): Promise<MedicalDiagnosisDto[]> {
  const data = await request<MedicalDiagnosisDto[] | { records: MedicalDiagnosisDto[] }>({
    url: `/outpatient/records/${recordId}/diagnoses`,
    method: 'GET',
  })
  return unwrapList(data)
}

export async function fetchPrescriptions(patientId?: number): Promise<PrescriptionDto[]> {
  const data = await request<PrescriptionDto[] | { records: PrescriptionDto[] }>({
    url: '/prescriptions',
    method: 'GET',
    data: patientId ? { patientId } : undefined,
  })
  return unwrapList(data)
}

export async function fetchCheckResults(patientId?: number): Promise<CheckResultDto[]> {
  const data = await request<CheckResultDto[] | { records: CheckResultDto[] }>({
    url: '/check-results',
    method: 'GET',
    data: patientId ? { patientId, pageNo: 1, pageSize: 50 } : { pageNo: 1, pageSize: 50 },
  })
  return unwrapList(data)
}

export async function fetchInspectionResults(patientId?: number): Promise<InspectionResultDto[]> {
  const data = await request<InspectionResultDto[] | { records: InspectionResultDto[] }>({
    url: '/inspection-results',
    method: 'GET',
    data: patientId ? { patientId, pageNo: 1, pageSize: 50 } : { pageNo: 1, pageSize: 50 },
  })
  return unwrapList(data)
}

export async function fetchCtAnalysisTasks(patientId?: number): Promise<CtAnalysisTaskDto[]> {
  const data = await request<CtAnalysisTaskDto[] | { records: CtAnalysisTaskDto[] }>({
    url: '/ct-analysis/tasks',
    method: 'GET',
    data: patientId ? { patientId, pageNo: 1, pageSize: 50 } : { pageNo: 1, pageSize: 50 },
  })
  return unwrapList(data)
}

export async function fetchPatientProfile(patientId: number): Promise<Record<string, unknown>> {
  return request({ url: `/patients/${patientId}`, method: 'GET' })
}

export async function updatePatientProfile(patientId: number, payload: Record<string, unknown>): Promise<void> {
  await request({ url: `/patients/${patientId}`, method: 'PUT', data: payload })
}
