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

export interface CheckRequestDto {
  id: number
  requestNo?: string
  checkName?: string
  checkItemName?: string
  name?: string
  departmentName?: string
  createdAt?: string
  status?: string
}

export interface InspectionRequestDto {
  id: number
  requestNo?: string
  inspectionName?: string
  inspectionItemName?: string
  name?: string
  departmentName?: string
  createdAt?: string
  status?: string
}

export interface MedicalDiagnosisDto {
  diagnosisName?: string
  name?: string
  icdCode?: string
  code?: string
}

/** 病历列表 GET /api/outpatient/records?patientId=&pageNo=&pageSize= */
export async function fetchPatientRecords(patientId: number): Promise<MedicalRecordDto[]> {
  const data = await request<MedicalRecordDto[] | { records: MedicalRecordDto[] }>({
    url: '/outpatient/records',
    method: 'GET',
    data: { patientId, pageNo: 1, pageSize: 50 },
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

export async function fetchPrescriptions(patientId: number): Promise<PrescriptionDto[]> {
  const data = await request<PrescriptionDto[] | { records: PrescriptionDto[] }>({
    url: '/prescriptions',
    method: 'GET',
    data: { patientId, pageNo: 1, pageSize: 50 },
  })
  return unwrapList(data)
}

/** 检查申请单列表 GET /api/check-requests?patientId= */
export async function fetchCheckRequests(patientId: number): Promise<CheckRequestDto[]> {
  const data = await request<CheckRequestDto[] | { records: CheckRequestDto[] }>({
    url: '/check-requests',
    method: 'GET',
    data: { patientId, pageNo: 1, pageSize: 50 },
  })
  return unwrapList(data)
}

/** 检验申请单列表 GET /api/inspection-requests?patientId= */
export async function fetchInspectionRequests(patientId: number): Promise<InspectionRequestDto[]> {
  const data = await request<InspectionRequestDto[] | { records: InspectionRequestDto[] }>({
    url: '/inspection-requests',
    method: 'GET',
    data: { patientId, pageNo: 1, pageSize: 50 },
  })
  return unwrapList(data)
}

export async function fetchPatientProfile(patientId: number): Promise<Record<string, unknown>> {
  return request({ url: `/patients/${patientId}`, method: 'GET' })
}

export async function updatePatientProfile(patientId: number, payload: Record<string, unknown>): Promise<void> {
  await request({ url: `/patients/${patientId}`, method: 'PUT', data: payload })
}

/** @deprecated 使用 fetchCheckRequests */
export const fetchCheckResults = fetchCheckRequests

/** @deprecated 使用 fetchInspectionRequests */
export const fetchInspectionResults = fetchInspectionRequests
