import { fetchMyRegistrations, cancelRegistration } from '../../../utils/api/registration'
import { registrationStatusView, timeSlotText } from '../../../utils/format'
import { isLoggedIn } from '../../../utils/request'
import { checkLogin } from '../../../utils/patient'

interface RegItem {
  id: number
  registrationNo: string
  department: string
  doctorName: string
  visitDate: string
  timeSlotText: string
  queueNo: string
  statusText: string
  statusType: string
  status: string
  canCancel: boolean
}

function mapItem(raw: Record<string, unknown>): RegItem {
  const status = String(raw.status || '')
  const view = registrationStatusView(status)
  return {
    id: Number(raw.id || raw.registrationId),
    registrationNo: String(raw.registrationNo || raw.id || ''),
    department: String(raw.departmentName || ''),
    doctorName: String(raw.doctorName || ''),
    visitDate: String(raw.visitDate || ''),
    timeSlotText: timeSlotText(String(raw.timeSlot || '')),
    queueNo: String(raw.queueNo || ''),
    statusText: view.text,
    statusType: view.type,
    status,
    canCancel: ['PENDING', 'WAITING'].includes(status),
  }
}

Page({
  data: {
    loading: true,
    isLoggedIn: false,
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待就诊' },
      { key: 'done', label: '已完成' },
    ],
    allList: [] as RegItem[],
    list: [] as RegItem[],
  },

  onShow() {
    const loggedIn = isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (loggedIn) {
      this.loadList()
    } else {
      this.setData({ allList: [], list: [], loading: false })
    }
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const records = await fetchMyRegistrations()
      this.setData({ allList: records.map((r) => mapItem(r as unknown as Record<string, unknown>)) })
      this.filterList()
    } catch {
      this.setData({ allList: [], list: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  onTab(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeTab: e.currentTarget.dataset.key })
    this.filterList()
  },

  filterList() {
    const { activeTab, allList } = this.data
    let list = allList
    if (activeTab === 'pending') {
      list = allList.filter((i) => ['PENDING', 'WAITING', 'IN_PROGRESS'].includes(i.status))
    }
    if (activeTab === 'done') {
      list = allList.filter((i) => ['COMPLETED', 'CANCELLED'].includes(i.status))
    }
    this.setData({ list })
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: `/pages/registration/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  async onCancel(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset.id)
    wx.showModal({
      title: '退号确认',
      content: '确定要退号吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await cancelRegistration(id)
          wx.showToast({ title: '退号成功', icon: 'success' })
          this.loadList()
        } catch {
          // request 内已 toast
        }
      },
    })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  goRegister() {
    wx.switchTab({ url: '/pages/registration/index/index' })
  },
})
