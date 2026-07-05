import { fetchDoctor, fetchSchedules } from '../../../utils/api/doctor'
import { createRegistration } from '../../../utils/api/registration'
import { checkLogin, fetchPatientDisplayInfo } from '../../../utils/patient'
import { BOOKABLE_ADVANCE_DAYS } from '../../../utils/config'
import {
  BookableDateOption,
  buildBookableDateOptions,
  firstChar,
  pickBookableDate,
  timeSlotText,
} from '../../../utils/format'

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
    advanceDays: BOOKABLE_ADVANCE_DAYS,
    dateOptions: [] as BookableDateOption[],
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
    const dateOptions = buildBookableDateOptions(BOOKABLE_ADVANCE_DAYS)
    const date = pickBookableDate(options.date, BOOKABLE_ADVANCE_DAYS)
    this.setData({
      doctorId: Number(options.doctorId) || 0,
      departmentId: Number(options.departmentId) || 0,
      departmentName: decodeURIComponent(options.departmentName || ''),
      date,
      dateOptions,
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
    const info = await fetchPatientDisplayInfo()
    if (!info) return
    this.setData({
      patientId: info.patientId,
      patientName: info.displayName,
    })
  },

  async loadDoctorAndSlots() {
    const { doctorId, departmentId, date } = this.data
    const [doctor, schedules] = await Promise.all([
      fetchDoctor(doctorId),
      fetchSchedules({ doctorId, departmentId, scheduleDate: date }),
    ])
    const slotOrder = ['MORNING', 'AFTERNOON', 'AM', 'PM', 'EVENING']
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

  onSelectDate(e: WechatMiniprogram.TouchEvent) {
    const date = e.currentTarget.dataset.date as string
    if (!date || date === this.data.date) return
    this.setData({ date, pageLoading: true })
    this.loadDoctorAndSlots().finally(() => this.setData({ pageLoading: false }))
  },

  selectSlot(e: WechatMiniprogram.TouchEvent) {
    if (!e.currentTarget.dataset.available) return
    this.setData({
      selectedSlot: e.currentTarget.dataset.value as string,
      selectedScheduleId: Number(e.currentTarget.dataset.scheduleId),
    })
  },

  async onSubmit() {
    const { selectedScheduleId } = this.data
    if (!selectedScheduleId) {
      wx.showToast({ title: '请选择可用时段', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      await createRegistration({ scheduleId: selectedScheduleId })
      wx.showToast({ title: '挂号成功', icon: 'success' })
      setTimeout(() => wx.redirectTo({ url: '/pages/registration/my-list/my-list' }), 1000)
    } catch {
      // request 内已 toast
    } finally {
      this.setData({ loading: false })
    }
  },
})
