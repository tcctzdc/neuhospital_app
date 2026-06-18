import { loadDoctorCards } from '../../../utils/api/registration-ui'

Page({
  data: {
    loading: true,
    today: '',
    steps: [
      { title: '选科室', desc: '按症状选科' },
      { title: '选医生', desc: '查看排班' },
      { title: '确认', desc: '完成挂号' },
    ],
    todayDoctors: [] as Awaited<ReturnType<typeof loadDoctorCards>>,
  },

  onLoad() {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    this.setData({ today })
    this.loadTodayDoctors(today)
  },

  async loadTodayDoctors(today: string) {
    this.setData({ loading: true })
    try {
      const todayDoctors = await loadDoctorCards({ scheduleDate: today })
      this.setData({ todayDoctors: todayDoctors.slice(0, 5) })
    } catch {
      this.setData({ todayDoctors: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  goDepartment() {
    wx.navigateTo({ url: '/pages/registration/department/department' })
  },

  goMyList() {
    wx.navigateTo({ url: '/pages/registration/my-list/my-list' })
  },

  goDoctor(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id || e.detail?.id
    const { today } = this.data
    wx.navigateTo({ url: `/pages/registration/confirm/confirm?doctorId=${id}&date=${today}` })
  },
})
