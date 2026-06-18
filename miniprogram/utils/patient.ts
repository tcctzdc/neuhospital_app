import { fetchMe } from './api/auth'
import { getUserInfo, isLoggedIn } from './request'

export async function getPatientId(): Promise<number> {
  const cached = getUserInfo()
  if (cached?.bizId) return Number(cached.bizId)
  if (!isLoggedIn()) return 0
  const me = await fetchMe()
  return Number(me.bizId) || 0
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
