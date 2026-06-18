import { submitAiTriage } from '../../../utils/api/ai'
import { getPatientId, checkLogin } from '../../../utils/patient'

Page({
  data: {
    symptoms: '',
    loading: false,
    symptomTags: ['头痛', '发热', '咳嗽', '胸闷', '腹痛', '恶心', '乏力', '失眠'],
    result: null as {
      department: string
      reason: string
      confidence: number
      advice: string
      departmentId: number
    } | null,
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ symptoms: e.detail.value })
  },

  addTag(e: WechatMiniprogram.TouchEvent) {
    const tag = e.currentTarget.dataset.tag as string
    const symptoms = this.data.symptoms ? `${this.data.symptoms}、${tag}` : tag
    this.setData({ symptoms })
  },

  async onSubmit() {
    if (!this.data.symptoms.trim()) {
      wx.showToast({ title: '请描述症状', icon: 'none' })
      return
    }
    if (!checkLogin({ navigate: true })) return
    this.setData({ loading: true })
    try {
      const patientId = await getPatientId()
      const raw = await submitAiTriage(this.data.symptoms.trim(), patientId || undefined)
      this.setData({
        result: {
          department: raw.departmentName || raw.recommendedDepartment || '请咨询导诊台',
          departmentId: Number(raw.departmentId) || 0,
          reason: raw.reason || '根据症状智能推荐',
          confidence: Math.round((raw.confidence ?? 0) * (raw.confidence && raw.confidence <= 1 ? 100 : 1)),
          advice: raw.advice || '建议尽快到院就诊',
        },
      })
    } catch {
      this.setData({ result: null })
    } finally {
      this.setData({ loading: false })
    }
  },

  goDept() {
    const { result } = this.data
    if (!result?.departmentId) {
      wx.navigateTo({ url: '/pages/registration/department/department' })
      return
    }
    wx.navigateTo({
      url: `/pages/registration/doctors/doctors?departmentId=${result.departmentId}&departmentName=${encodeURIComponent(result.department)}`,
    })
  },
})
