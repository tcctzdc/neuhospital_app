/** 联调模式：false = 仅使用真实接口，失败则提示错误 */
export const ENABLE_MOCK_FALLBACK = false

/**
 * API 地址（本地联调）
 * - 微服务网关：10010（registration / 排班 / 挂号等走 gateway-service）
 * - 单体 backend-service：8081（若未启网关可改回）
 * - 模拟器：用 127.0.0.1，不要用 localhost（易 timeout）
 * - 真机调试：改为你电脑的局域网 IP，如 192.168.1.100
 */
export const API_HOST = '127.0.0.1'
export const API_PORT = 10010
export const API_BASE = `http://${API_HOST}:${API_PORT}/api`

/** wx.request 超时（毫秒） */
export const REQUEST_TIMEOUT = 15000

/** 与后端 app.registration.advance-days 一致：患者可预约天数（含当天） */
export const BOOKABLE_ADVANCE_DAYS = 7

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
  MORNING: '上午',
  AFTERNOON: '下午',
}
