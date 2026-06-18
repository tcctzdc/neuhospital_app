import { fetchMe } from '../../../utils/api/auth'
import { fetchDoctor, fetchSchedules } from '../../../utils/api/doctor'
import { createRegistration } from '../../../utils/api/registration'
import { getUserInfo } from '../../../utils/request'
import { checkLogin } from '../../../utils/patient'
import { firstChar, timeSlotText } from '../../../utils/format'

interface SlotView {
  value: string
  label: string
  remain: number
  available: boolean
  scheduleId: number
}

Page({
  data: {
    doctorId: 0,
    departmentId: 0,
    departmentName: '',
    date: '',
    patientId: 0,
    patientName: '',
    selectedSlot: '',
    selectedScheduleId: 0,
    loading: false,
    pageLoading: true,
    doctor: { name: '', title: '', fee: '0', avatarText: '?' },
    slots: [] as SlotView[],
  },

  onLoad(options: Record<string, string>) {
    this.setData({
      doctorId: Number(options.doctorId) || 0,
      departmentId: Number(options.departmentId) || 0,
      departmentName: decodeURIComponent(options.departmentName || ''),
      date: options.date || '',
    })
    this.loadPageData()
  },

  async loadPageData() {
    if (!checkLogin({ navigate: true })) return
    this.setData({ pageLoading: true })
    try {
      await Promise.all([this.loadPatient(), this.loadDoctorAndSlots()])
    } finally {
      this.setData({ pageLoading: false })
    }
  },

  async loadPatient() {
    const me = await fetchMe()
    const app = getApp<IAppOption>()
    app.setUserInfo(me as unknown as Record<string, unknown>)
    this.setData({
      patientId: me.bizId || 0,
      patientName: me.realName || me.username,
    })
  },

  async loadDoctorAndSlots() {
    const { doctorId, departmentId, date } = this.data
    const [doctor, schedules] = await Promise.all([
      fetchDoctor(doctorId),
      fetchSchedules({ doctorId, departmentId, scheduleDate: date }),
    ])
    const slotOrder = ['AM', 'PM', 'EVENING']
    const slotMap = new Map<string, SlotView>()
    schedules.forEach((s) => {
      const slot = s.timeSlot || 'AM'
      const remain = s.remainQuota ?? 0
      slotMap.set(slot, {
        value: slot,
        label: timeSlotText(slot),
        remain,
        available: remain > 0 && s.status !== 'CLOSED',
        scheduleId: s.id,
      })
    })
    slotOrder.forEach((slot) => {
      if (!slotMap.has(slot)) {
        slotMap.set(slot, { value: slot, label: timeSlotText(slot), remain: 0, available: false, scheduleId: 0 })
      }
    })
    const slots = slotOrder.map((k) => slotMap.get(k)!)
    const firstAvailable = slots.find((s) => s.available)
    const fee = doctor.registrationFee ?? doctor.fee ?? schedules[0]?.feeAmount ?? 0
    this.setData({
      doctor: { name: doctor.name, title: doctor.title || '医师', fee: String(fee), avatarText: firstChar(doctor.name) },
      slots,
      selectedSlot: firstAvailable?.value || '',
      selectedScheduleId: firstAvailable?.scheduleId || 0,
    })
  },

  selectSlot(e: WechatMiniprogram.TouchEvent) {
    if (!e.currentTarget.dataset.available) return
    this.setData({
      selectedSlot: e.currentTarget.dataset.value as string,
      selectedScheduleId: Number(e.currentTarget.dataset.scheduleId),
    })
  },

  async onSubmit() {
    const { patientId, selectedScheduleId, date, selectedSlot } = this.data
    if (!patientId) {
      const cached = getUserInfo()
      if (!cached?.bizId) {
        wx.showToast({ title: '无法获取患者信息', icon: 'none' })
        return
      }
    }
    if (!selectedScheduleId) {
      wx.showToast({ title: '请选择可用时段', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      await createRegistration({
        patientId: patientId || Number(getUserInfo()?.bizId),
        scheduleId: selectedScheduleId,
        visitDate: date,
        timeSlot: selectedSlot,
      })
      wx.showToast({ title: '挂号成功', icon: 'success' })
      setTimeout(() => wx.redirectTo({ url: '/pages/registration/my-list/my-list' }), 1000)
    } catch {
      // request 内已 toast
    } finally {
      this.setData({ loading: false })
    }
  },
})
