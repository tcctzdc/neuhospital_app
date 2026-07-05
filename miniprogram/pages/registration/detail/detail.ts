import { fetchRegistration, cancelRegistration, checkInRegistration } from '../../../utils/api/registration'
import { registrationStatusView, timeSlotText } from '../../../utils/format'

const CHECK_IN_STATUSES = ['PAID', 'PENDING', 'WAITING']

Page({
  data: {
    loading: true,
    id: 0,
    detail: {
      statusText: '',
      statusType: 'default',
      statusTip: '',
      canCancel: false,
      canCheckIn: false,
    },
    rows: [] as Array<{ label: string; value: string }>,
  },

  onLoad(options: Record<string, string>) {
    const id = Number(options.id)
    this.setData({ id })
    if (id) this.loadDetail(id)
    else this.setData({ loading: false })
  },

  async loadDetail(id: number) {
    this.setData({ loading: true })
    try {
      const raw = await fetchRegistration(id)
      const status = String(raw.status || '')
      const view = registrationStatusView(status)
      const canCancel = ['PENDING', 'WAITING'].includes(status)
      const canCheckIn = CHECK_IN_STATUSES.includes(status)
      this.setData({
        detail: {
          statusText: view.text,
          statusType: view.type,
          statusTip: canCheckIn
            ? '就诊当日请先到院签到，再前往候诊区等待叫号'
            : (canCancel ? '请按时到院就诊' : '本次就诊已结束'),
          canCancel,
          canCheckIn,
        },
        rows: [
          { label: '挂号单号', value: String(raw.registrationNo || raw.id || '') },
          { label: '就诊科室', value: String(raw.departmentName || '') },
          { label: '就诊医生', value: String(raw.doctorName || '') },
          { label: '就诊日期', value: `${raw.visitDate || ''} ${timeSlotText(raw.timeSlot)}` },
          { label: '排队号', value: String(raw.queueNo || '-') },
          { label: '挂号费用', value: `¥${raw.feeAmount ?? 0}` },
        ],
      })
    } catch {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onCancel() {
    const { id } = this.data
    wx.showModal({
      title: '退号确认',
      content: '确定要退号吗？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await cancelRegistration(id)
          wx.showToast({ title: '退号成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1000)
        } catch {
          wx.showToast({ title: '退号失败', icon: 'none' })
        }
      },
    })
  },

  onCheckIn() {
    const { id } = this.data
    wx.showModal({
      title: '到院签到',
      content: '确认已到院并签到？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await checkInRegistration(id)
          wx.showToast({ title: '签到成功', icon: 'success' })
          this.loadDetail(id)
        } catch {
          wx.showToast({ title: '签到失败', icon: 'none' })
        }
      },
    })
  },

  goPay() {
    wx.navigateTo({ url: '/pages/payment/list/list' })
  },
})
