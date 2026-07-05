import { fetchMe } from './api/auth'
import { fetchPatient } from './api/patient'
import { getUserInfo, isLoggedIn } from './request'

export interface PatientDisplayInfo {
  patientId: number
  displayName: string
  phone: string
}

/** 就诊展示用：优先患者档案姓名/手机，账号信息作兜底 */
export async function fetchPatientDisplayInfo(options?: {
  silent?: boolean
}): Promise<PatientDisplayInfo | null> {
  if (!isLoggedIn()) return null
  const me = await fetchMe({ silent: options?.silent })
  const app = getApp<IAppOption>()
  app.setUserInfo(me as unknown as Record<string, unknown>)

  const patientId = Number(me.bizId) || 0
  let displayName = me.realName || me.username || ''
  let phone = me.phone || ''

  if (patientId) {
    try {
      const profile = await fetchPatient(patientId)
      displayName = profile.name || profile.realName || displayName
      phone = profile.phone || phone
    } catch {
      // 患者档案不可用时沿用账号信息
    }
  }

  return { patientId, displayName, phone }
}

export async function getPatientId(options?: { refresh?: boolean }): Promise<number> {
  if (options?.refresh || !getUserInfo()?.bizId) {
    if (!isLoggedIn()) return 0
    const me = await fetchMe()
    const app = getApp<IAppOption>()
    app.setUserInfo(me as unknown as Record<string, unknown>)
    return Number(me.bizId) || 0
  }
  const cached = getUserInfo()
  if (cached?.bizId) return Number(cached.bizId)
  return 0
}

export interface LoginCheckOptions {
  /** 是否跳转到登录页，Tab 页请设为 false */
  navigate?: boolean
  /** 是否提示 Toast */
  toast?: boolean
}

/**
 * 检查登录态。Tab 页仅用返回值控制 UI，不要 navigate。
 * 子页面/按钮点击时再 navigate: true。
 */
export function checkLogin(options: LoginCheckOptions = {}): boolean {
  const { navigate = false, toast = true } = options
  if (isLoggedIn()) return true
  if (toast) {
    wx.showToast({ title: '请先登录', icon: 'none' })
  }
  if (navigate) {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  }
  return false
}

/** @deprecated 请用 checkLogin({ navigate: true }) */
export async function requireLogin(): Promise<boolean> {
  return checkLogin({ navigate: true, toast: true })
}
