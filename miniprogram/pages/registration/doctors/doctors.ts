import { loadDoctorCards } from '../../../utils/api/registration-ui'
import { BOOKABLE_ADVANCE_DAYS } from '../../../utils/config'
import { BookableDateOption, buildBookableDateOptions, pickBookableDate } from '../../../utils/format'

Page({
  data: {
    loading: true,
    departmentId: 0,
    departmentName: '',
    date: '',
    advanceDays: BOOKABLE_ADVANCE_DAYS,
    dateOptions: [] as BookableDateOption[],
    doctors: [] as Awaited<ReturnType<typeof loadDoctorCards>>,
  },

  onLoad(options: Record<string, string>) {
    const dateOptions = buildBookableDateOptions(BOOKABLE_ADVANCE_DAYS)
    const date = pickBookableDate(options.date, BOOKABLE_ADVANCE_DAYS)
    this.setData({
      departmentId: Number(options.departmentId) || 0,
      departmentName: decodeURIComponent(options.departmentName || ''),
      date,
      dateOptions,
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

  onSelectDate(e: WechatMiniprogram.TouchEvent) {
    const date = e.currentTarget.dataset.date as string
    if (!date || date === this.data.date) return
    this.setData({ date })
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
