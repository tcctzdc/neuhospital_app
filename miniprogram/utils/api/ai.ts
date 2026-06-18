import { request } from '../request'
import { unwrapList } from '../format'

export interface AiSessionDto {
  id: number
  title?: string
  sessionType?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  lastMessage?: string
}

export interface AiMessageDto {
  id: number
  role: string
  content: string
  createdAt?: string
}

export interface AiTriageResultDto {
  sessionId?: string | number
  departmentId?: number
  departmentName?: string
  reason?: string
  confidence?: number
  advice?: string
  recommendedDepartment?: string
}

export async function fetchAiSessions(): Promise<AiSessionDto[]> {
  const data = await request<AiSessionDto[] | { records: AiSessionDto[] }>({
    url: '/ai/chat/sessions',
    method: 'GET',
  })
  return unwrapList(data)
}

export async function createAiSession(patientId: number, sessionType = 'INQUIRY'): Promise<AiSessionDto> {
  return request<AiSessionDto>({
    url: '/ai/chat/sessions',
    method: 'POST',
    data: { patientId, sessionType },
  })
}

export async function fetchAiMessages(sessionId: number): Promise<AiMessageDto[]> {
  const data = await request<AiMessageDto[] | { records: AiMessageDto[] }>({
    url: `/ai/chat/sessions/${sessionId}/messages`,
    method: 'GET',
  })
  return unwrapList(data)
}

export async function sendAiMessage(sessionId: number, content: string): Promise<AiMessageDto | { reply?: string; assistantMessage?: AiMessageDto; userMessage?: AiMessageDto }> {
  return request({
    url: `/ai/chat/sessions/${sessionId}/messages`,
    method: 'POST',
    data: { content, role: 'USER' },
  })
}

export async function submitAiTriage(symptoms: string, patientId?: number): Promise<AiTriageResultDto> {
  return request<AiTriageResultDto>({
    url: '/ai/triage',
    method: 'POST',
    data: { symptoms, patientId },
  })
}

export async function fetchAiTriageResult(sessionId: string | number): Promise<AiTriageResultDto> {
  return request<AiTriageResultDto>({ url: `/ai/triage/${sessionId}`, method: 'GET' })
}
