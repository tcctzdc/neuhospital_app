import { loadDoctorCards } from '../../../utils/api/registration-ui'

Page({
  data: {
    loading: true,
    departmentId: 0,
    departmentName: '',
    date: '',
    today: '',
    doctors: [] as Awaited<ReturnType<typeof loadDoctorCards>>,
  },

  onLoad(options: Record<string, string>) {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    this.setData({
      departmentId: Number(options.departmentId) || 0,
      departmentName: decodeURIComponent(options.departmentName || ''),
      date: today,
      today,
    })
    this.loadDoctors()
  },

  async loadDoctors() {
    const { departmentId, departmentName, date } = this.data
    this.setData({ loading: true })
    try {
      const doctors = await loadDoctorCards({ departmentId, scheduleDate: date, departmentName })
      this.setData({ doctors })
    } catch {
      this.setData({ doctors: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  onDateChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ date: e.detail.value as string })
    this.loadDoctors()
  },

  selectDoctor(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id || e.detail?.id
    const { departmentId, departmentName, date } = this.data
    wx.navigateTo({
      url: `/pages/registration/confirm/confirm?doctorId=${id}&departmentId=${departmentId}&departmentName=${encodeURIComponent(departmentName)}&date=${date}`,
    })
  },
})
