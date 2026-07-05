import { isLoggedIn, clearAuth } from '../../../utils/request'
import { logout as apiLogout } from '../../../utils/api/auth'
import { fetchMyRegistrations } from '../../../utils/api/registration'
import { fetchPendingPayments } from '../../../utils/api/payment'
import { fetchPatientRecords } from '../../../utils/api/record'
import { checkLogin, fetchPatientDisplayInfo } from '../../../utils/patient'

Page({
  data: {
    isLoggedIn: false,
    loading: false,
    userName: '点击登录',
    phone: '登录后查看就诊信息',
    avatarText: '?',
    stats: { registrations: 0, records: 0, payments: 0 },
    healthMenus: [
      { icon: '📋', label: '挂号记录', url: '/pages/registration/my-list/my-list' },
      { icon: '📄', label: '电子病历', url: '/pages/records/index/index' },
      { icon: '💊', label: '我的处方', url: '/pages/records/index/index?tab=prescription' },
      { icon: '🔬', label: '检查检验', url: '/pages/records/index/index?tab=inspection' },
      { icon: '💰', label: '在线缴费', url: '/pages/payment/list/list' },
      { icon: '💬', label: 'AI 问诊', url: '/pages/ai/chat/chat', needLogin: true },
    ],
    settingMenus: [
      { icon: '👤', label: '个人信息', action: 'profile' },
      { icon: '📞', label: '联系客服', action: 'service' },
      { icon: 'ℹ️', label: '关于我们', action: 'about' },
    ],
  },

  onShow() {
    this.loadUserInfo()
  },

  setGuestView() {
    this.setData({
      isLoggedIn: false,
      userName: '点击登录',
      phone: '登录后查看就诊信息',
      avatarText: '?',
      stats: { registrations: 0, records: 0, payments: 0 },
    })
  },

  async loadUserInfo() {
    if (!isLoggedIn()) {
      clearAuth()
      this.setGuestView()
      return
    }
    this.setData({ loading: true })
    try {
      const info = await fetchPatientDisplayInfo({ silent: true })
      if (!info) throw new Error('未登录')
      const patientId = info.patientId
      const [regs, payments, records] = await Promise.all([
        fetchMyRegistrations().catch(() => []),
        fetchPendingPayments().catch(() => []),
        patientId ? fetchPatientRecords(patientId).catch(() => []) : Promise.resolve([]),
      ])
      this.setData({
        isLoggedIn: true,
        userName: info.displayName || '未设置姓名',
        phone: info.phone || '未绑定手机',
        avatarText: (info.displayName || '?').charAt(0),
        stats: {
          registrations: regs.length,
          records: records.length,
          payments: payments.length,
        },
      })
    } catch {
      // token 失效或后端不可用：清除本地登录态，不再用旧缓存冒充已登录
      clearAuth()
      this.setGuestView()
    } finally {
      this.setData({ loading: false })
    }
  },

  onUserTap() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/auth/login/login' })
      return
    }
    if (!checkLogin({ navigate: true })) return
    wx.navigateTo({ url: '/pages/patient/profile/profile' })
  },

  goPage(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    const needLogin = e.currentTarget.dataset.login
    if (needLogin && !checkLogin({ navigate: true })) return
    wx.navigateTo({ url })
  },

  goRegistrations() {
    wx.navigateTo({ url: '/pages/registration/my-list/my-list' })
  },

  goRecords() {
    wx.navigateTo({ url: '/pages/records/index/index' })
  },

  goPayments() {
    wx.navigateTo({ url: '/pages/payment/list/list' })
  },

  onMenuTap(e: WechatMiniprogram.TouchEvent) {
    const action = e.currentTarget.dataset.action
    if (action === 'profile') {
      if (!checkLogin({ navigate: true })) return
      wx.navigateTo({ url: '/pages/patient/profile/profile' })
      return
    }
    if (action === 'service') {
      wx.makePhoneCall({ phoneNumber: '1589921770' }).catch(() => {})
      return
    }
    if (action === 'about') {
      wx.showModal({
        title: '智慧云脑诊疗',
        content: '东软教育实训 · 患者端小程序\n注册 / 登录 / 挂号 / 缴费 / 病历 / AI 问诊',
        showCancel: false,
      })
    }
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await apiLogout()
        } catch {
          // 仍清除本地
        }
        clearAuth()
        this.setGuestView()
        wx.showToast({ title: '已退出', icon: 'success' })
      },
    })
  },
})
