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

export function formatDateYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 可预约日期范围：今天起 advanceDays 个自然日（含当天） */
export function getBookableDateRange(advanceDays = 7): { today: string; maxDate: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const max = new Date(today)
  max.setDate(max.getDate() + advanceDays - 1)
  return { today: formatDateYmd(today), maxDate: formatDateYmd(max) }
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export interface BookableDateOption {
  value: string
  weekdayText: string
  dateText: string
}

/** 生成可预约日期条：今天 / 明天 / 周几 + MM-DD */
export function buildBookableDateOptions(advanceDays = 7): BookableDateOption[] {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const options: BookableDateOption[] = []
  for (let i = 0; i < advanceDays; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    let weekdayText = WEEKDAY_LABELS[d.getDay()]
    if (i === 0) weekdayText = '今天'
    else if (i === 1) weekdayText = '明天'
    options.push({
      value: formatDateYmd(d),
      weekdayText,
      dateText: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    })
  }
  return options
}

export function pickBookableDate(preferred: string | undefined, advanceDays = 7): string {
  const { today } = getBookableDateRange(advanceDays)
  const options = buildBookableDateOptions(advanceDays)
  if (preferred && options.some((o) => o.value === preferred)) return preferred
  return today
}

/** 兼容后端 deptName / name 字段 */
export function departmentDisplayName(d: {
  name?: string
  deptName?: string
  deptCode?: string
  id?: number
}): string {
  return (d.name || d.deptName || d.deptCode || (d.id ? `科室${d.id}` : '')).trim()
}

export function deptIcon(name?: string): string {
  const map: Record<string, string> = {
    神经: '🧠', 心血管: '❤️', 心内: '❤️', 呼吸: '🫁', 消化: '🩺',
    骨科: '🦴', 儿科: '👶', 妇产: '👩', 眼科: '👁️', 皮肤: '🧴',
    影像: '📷', 检验: '🔬', 药: '💊',
  }
  if (!name) return firstChar(name)
  for (const [key, icon] of Object.entries(map)) {
    if (name.includes(key)) return icon
  }
  return firstChar(name)
}

export function timeSlotText(slot?: string): string {
  const map: Record<string, string> = {
    AM: '上午',
    PM: '下午',
    EVENING: '晚间',
    MORNING: '上午',
    AFTERNOON: '下午',
  }
  return slot ? (map[slot] || slot) : ''
}

export function registrationStatusView(status?: string): { text: string; type: string } {
  const map: Record<string, { text: string; type: string }> = {
    PENDING: { text: '待就诊', type: 'primary' },
    PAID: { text: '已缴费', type: 'success' },
    WAITING: { text: '候诊中', type: 'warning' },
    CHECKED_IN: { text: '已签到', type: 'success' },
    IN_PROGRESS: { text: '就诊中', type: 'warning' },
    COMPLETED: { text: '已完成', type: 'success' },
    CANCELLED: { text: '已退号', type: 'default' },
  }
  return map[status || ''] || { text: status || '未知', type: 'default' }
}

const GENDER_LABEL: Record<string, string> = {
  MALE: '男',
  FEMALE: '女',
  UNKNOWN: '未知',
  男: '男',
  女: '女',
  未知: '未知',
}

const GENDER_API: Record<string, string> = {
  男: 'MALE',
  女: 'FEMALE',
  未知: 'UNKNOWN',
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  UNKNOWN: 'UNKNOWN',
}

/** 后端 MALE/FEMALE → 页面展示 */
export function genderToLabel(gender?: string): string {
  if (!gender) return '未知'
  return GENDER_LABEL[gender] || gender
}

/** 页面选择 → 后端 MALE/FEMALE */
export function genderToApi(gender?: string): string {
  if (!gender) return 'UNKNOWN'
  return GENDER_API[gender] || gender
}
