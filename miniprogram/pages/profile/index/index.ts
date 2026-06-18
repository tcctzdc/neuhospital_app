import { isLoggedIn, getUserInfo } from '../../../utils/request'
import { fetchMe, logout as apiLogout } from '../../../utils/api/auth'
import { fetchMyRegistrations } from '../../../utils/api/registration'
import { fetchPendingPayments } from '../../../utils/api/payment'
import { fetchPatientRecords } from '../../../utils/api/record'
import { fetchPatientProfile } from '../../../utils/api/record'
import { getPatientId } from '../../../utils/patient'

Page({
  data: {
    isLoggedIn: false,
    userName: '点击登录',
    phone: '登录后查看就诊信息',
    avatarText: '?',
    stats: { registrations: 0, records: 0, payments: 0 },
    healthMenus: [
      { icon: '📋', label: '挂号记录', url: '/pages/registration/my-list/my-list' },
      { icon: '📄', label: '电子病历', url: '/pages/records/index/index' },
      { icon: '💊', label: '我的处方', url: '/pages/records/index/index?tab=prescription' },
      { icon: '🔬', label: '检查检验', url: '/pages/records/index/index?tab=inspection' },
      { icon: '🧠', label: 'CT 影像分析', url: '/pages/records/index/index?tab=ct' },
      { icon: '💰', label: '缴费记录', url: '/pages/payment/list/list' },
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

  async loadUserInfo() {
    if (!isLoggedIn()) {
      this.setData({
        isLoggedIn: false,
        userName: '点击登录',
        phone: '登录后查看就诊信息',
        avatarText: '?',
        stats: { registrations: 0, records: 0, payments: 0 },
      })
      return
    }
    try {
      const me = await fetchMe()
      const app = getApp<IAppOption>()
      app.setUserInfo(me as unknown as Record<string, unknown>)
      const patientId = me.bizId || 0
      const [regs, payments, records] = await Promise.all([
        fetchMyRegistrations().catch(() => []),
        fetchPendingPayments().catch(() => []),
        patientId ? fetchPatientRecords(patientId).catch(() => []) : Promise.resolve([]),
      ])
      this.setData({
        isLoggedIn: true,
        userName: me.realName || me.username,
        phone: me.phone || '未绑定手机',
        avatarText: (me.realName || me.username || '?').charAt(0),
        stats: {
          registrations: regs.length,
          records: records.length,
          payments: payments.length,
        },
      })
    } catch {
      const user = getUserInfo() as Record<string, string> | null
      this.setData({
        isLoggedIn: true,
        userName: user?.realName || user?.username || '用户',
        phone: user?.phone || '',
        avatarText: (user?.realName || '?').charAt(0),
        stats: { registrations: 0, records: 0, payments: 0 },
      })
    }
  },

  onUserTap() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/auth/login/login' })
    }
  },

  goPage(e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: e.currentTarget.dataset.url as string })
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

  async onMenuTap(e: WechatMiniprogram.TouchEvent) {
    const action = e.currentTarget.dataset.action
    if (action === 'profile') {
      if (!this.data.isLoggedIn) {
        wx.navigateTo({ url: '/pages/auth/login/login' })
        return
      }
      try {
        const patientId = await getPatientId()
        const profile = await fetchPatientProfile(patientId)
        const name = profile.name || profile.realName || this.data.userName
        wx.showModal({
          title: '个人信息',
          content: `姓名：${name}\n手机：${profile.phone || this.data.phone}\n患者ID：${patientId}`,
          showCancel: false,
        })
      } catch {
        wx.showToast({ title: '获取信息失败', icon: 'none' })
      }
      return
    }
    if (action === 'service') {
      wx.makePhoneCall({ phoneNumber: '4000000000' }).catch(() => {})
      return
    }
    if (action === 'about') {
      wx.showModal({
        title: '智慧云脑诊疗',
        content: '东软教育实训 · 患者端小程序\n基于 Spring Boot + Spring AI 后端',
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
        getApp<IAppOption>().clearUserInfo()
        this.loadUserInfo()
        wx.showToast({ title: '已退出', icon: 'success' })
      },
    })
  },
})
