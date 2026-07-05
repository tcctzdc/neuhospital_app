import { API_BASE, STORAGE_KEYS } from './utils/config'
import { fetchMe } from './utils/api/auth'

App<IAppOption>({
  globalData: {
    userInfo: null as Record<string, unknown> | null,
    isLoggedIn: false,
  },
  onLaunch() {
    console.log('[app] API_BASE =', API_BASE)
    const token = wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) {
      // 清除残留的 userInfo，避免「看起来已登录、实际无 token」
      this.clearUserInfo()
      return
    }
    // 启动时校验 token 是否仍有效
    fetchMe({ silent: true })
      .then((me) => {
        this.setUserInfo(me as unknown as Record<string, unknown>)
      })
      .catch(() => {
        this.clearUserInfo()
      })
  },
  setUserInfo(userInfo: Record<string, unknown>) {
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true
    wx.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
  },
  clearUserInfo() {
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    wx.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    wx.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN)
    wx.removeStorageSync(STORAGE_KEYS.USER_INFO)
  },
})
