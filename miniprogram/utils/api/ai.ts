import { request } from '../request'

export interface AiSessionDto {
  id?: number
  sessionNo?: string
  sessionType?: string
  status?: string
  registrationId?: number
}

export interface AiMessageDto {
  id?: number
  role: string
  content: string
  createdAt?: string
}

/** 创建 AI 会话：传 sessionType，patientId 由 Token 解析 */
export async function createAiSession(
  sessionType: 'INQUIRY' | 'TRIAGE' = 'INQUIRY',
  registrationId?: number,
): Promise<AiSessionDto> {
  const data: Record<string, unknown> = { sessionType }
  if (registrationId) data.registrationId = registrationId
  return request<AiSessionDto>({
    url: '/ai/chat/sessions',
    method: 'POST',
    data,
  })
}

/** 发送消息 POST /api/ai/chat/sessions/{sessionNo}/messages */
export async function sendAiMessage(
  sessionNo: string,
  content: string,
): Promise<{ content?: string; reply?: string; assistantMessage?: AiMessageDto }> {
  return request({
    url: `/ai/chat/sessions/${sessionNo}/messages`,
    method: 'POST',
    data: { content, role: 'USER' },
  })
}
