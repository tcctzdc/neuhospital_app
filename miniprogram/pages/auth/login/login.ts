import { login, fetchMe } from '../../../utils/api/auth'
import { STORAGE_KEYS } from '../../../utils/config'

Page({
  data: {
    username: '',
    password: '',
    loading: false,
  },

  onUsername(e: WechatMiniprogram.Input) {
    this.setData({ username: e.detail.value })
  },

  onPassword(e: WechatMiniprogram.Input) {
    this.setData({ password: e.detail.value })
  },

  async onLogin() {
    const { username, password } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请填写账号密码', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const data = await login({ username, password })
      wx.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
      wx.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
      const app = getApp<IAppOption>()
      try {
        const me = await fetchMe()
        app.setUserInfo(me as unknown as Record<string, unknown>)
      } catch {
        app.setUserInfo(data as unknown as Record<string, unknown>)
      }
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch {
      // request 内已 toast
    } finally {
      this.setData({ loading: false })
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/auth/register/register' })
  },
})
