import { STORAGE_KEYS } from './utils/config'

App<IAppOption>({
  globalData: {
    userInfo: null as Record<string, unknown> | null,
    isLoggedIn: false,
  },
  onLaunch() {
    const token = wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    const userInfo = wx.getStorageSync(STORAGE_KEYS.USER_INFO)
    if (token && userInfo) {
      this.globalData.isLoggedIn = true
      this.globalData.userInfo = userInfo
    }
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
