/** 联调模式：false = 仅使用真实接口，失败则提示错误 */
export const ENABLE_MOCK_FALLBACK = false

/** API 基础配置（请改为实际后端地址） */
export const API_BASE = 'http://localhost:8080/api'

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
}

export const REGISTRATION_STATUS: Record<string, { text: string; type: string }> = {
  PENDING: { text: '待就诊', type: 'primary' },
  WAITING: { text: '候诊中', type: 'warning' },
  IN_PROGRESS: { text: '就诊中', type: 'warning' },
  COMPLETED: { text: '已完成', type: 'success' },
  CANCELLED: { text: '已退号', type: 'default' },
}

export const TIME_SLOT_MAP: Record<string, string> = {
  AM: '上午',
  PM: '下午',
  EVENING: '晚间',
}
