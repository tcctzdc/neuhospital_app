import { fetchAiSessions } from '../../../utils/api/ai'
import { isLoggedIn } from '../../../utils/request'
import { checkLogin } from '../../../utils/patient'

function formatTime(raw?: string): string {
  if (!raw) return ''
  return raw.replace('T', ' ').slice(0, 16)
}

Page({
  data: {
    loading: false,
    isLoggedIn: false,
    sessions: [] as Array<{ id: number; title: string; time: string; status: string; statusType: string }>,
  },

  onShow() {
    this.syncLoginState()
  },

  syncLoginState() {
    const loggedIn = isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (loggedIn) {
      this.loadSessions()
    } else {
      this.setData({ sessions: [], loading: false })
    }
  },

  async loadSessions() {
    if (!isLoggedIn()) return
    this.setData({ loading: true })
    try {
      const list = await fetchAiSessions()
      const sessions = list.map((s) => ({
        id: s.id,
        title: s.title || s.lastMessage || 'AI 问诊会话',
        time: formatTime(s.updatedAt || s.createdAt),
        status: s.status === 'ACTIVE' || s.status === 'IN_PROGRESS' ? '进行中' : '已结束',
        statusType: s.status === 'ACTIVE' || s.status === 'IN_PROGRESS' ? 'primary' : 'default',
      }))
      this.setData({ sessions })
    } catch {
      this.setData({ sessions: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  goChat() {
    if (!checkLogin({ navigate: true })) return
    wx.navigateTo({ url: '/pages/ai/chat/chat' })
  },

  goTriage() {
    wx.navigateTo({ url: '/pages/ai/triage/triage' })
  },

  openSession(e: WechatMiniprogram.TouchEvent) {
    if (!checkLogin({ navigate: true })) return
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/ai/chat/chat?sessionId=${id}` })
  },
})
