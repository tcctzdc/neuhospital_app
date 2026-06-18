export interface PageResult<T> {
  records: T[]
  pageNo: number
  pageSize: number
  total: number
}

/** 兼容分页结构或直接数组 */
export function unwrapList<T>(data: T[] | PageResult<T> | null | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.records)) return data.records
  return []
}

export function firstChar(name?: string): string {
  return (name || '?').charAt(0)
}

export function deptIcon(name?: string): string {
  const map: Record<string, string> = {
    神经: '🧠', 心血管: '❤️', 呼吸: '🫁', 消化: '🩺',
    骨科: '🦴', 儿科: '👶', 妇产: '👩', 眼科: '👁️', 皮肤: '🧴',
  }
  if (!name) return '🏥'
  for (const [key, icon] of Object.entries(map)) {
    if (name.includes(key)) return icon
  }
  return '🏥'
}

export function timeSlotText(slot?: string): string {
  const map: Record<string, string> = { AM: '上午', PM: '下午', EVENING: '晚间' }
  return slot ? (map[slot] || slot) : ''
}

export function registrationStatusView(status?: string): { text: string; type: string } {
  const map: Record<string, { text: string; type: string }> = {
    PENDING: { text: '待就诊', type: 'primary' },
    WAITING: { text: '候诊中', type: 'warning' },
    IN_PROGRESS: { text: '就诊中', type: 'warning' },
    COMPLETED: { text: '已完成', type: 'success' },
    CANCELLED: { text: '已退号', type: 'default' },
  }
  return map[status || ''] || { text: status || '未知', type: 'default' }
}
