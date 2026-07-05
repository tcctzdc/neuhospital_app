import { fetchPatient, updatePatient } from '../../../utils/api/patient'
import { fetchMe } from '../../../utils/api/auth'
import { checkLogin } from '../../../utils/patient'
import { genderToApi, genderToLabel } from '../../../utils/format'

Page({
  data: {
    loading: true,
    loadError: false,
    saving: false,
    patientId: 0,
    form: {
      name: '',
      phone: '',
      gender: '',
      birthDate: '',
      bloodType: '',
      allergySummary: '',
      historySummary: '',
    },
    genderOptions: ['男', '女', '未知'],
    genderIndex: 0,
  },

  async onLoad() {
    if (!checkLogin({ navigate: true })) return
    await this.loadProfile()
  },

  async loadProfile() {
    this.setData({ loading: true, loadError: false })
    try {
      const me = await fetchMe()
      getApp<IAppOption>().setUserInfo(me as unknown as Record<string, unknown>)
      const patientId = Number(me.bizId) || 0
      if (!patientId) {
        throw new Error('未关联患者档案')
      }
      const profile = await fetchPatient(patientId)
      const gender = genderToLabel(profile.gender)
      const genderIndex = this.data.genderOptions.indexOf(gender)
      this.setData({
        patientId,
        form: {
          name: profile.name || profile.realName || me.realName || me.username || '',
          phone: profile.phone || me.phone || '',
          gender,
          birthDate: profile.birthDate || '',
          bloodType: profile.bloodType || '',
          allergySummary: profile.allergySummary || '',
          historySummary: profile.historySummary || '',
        },
        genderIndex: genderIndex >= 0 ? genderIndex : 2,
      })
    } catch {
      this.setData({ loadError: true })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onInput(e: WechatMiniprogram.Input) {
    const field = e.currentTarget.dataset.field as string
    const form = Object.assign({}, this.data.form) as Record<string, string>
    form[field] = e.detail.value
    this.setData({ form: form as typeof this.data.form })
  },

  onGenderChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value)
    this.setData({
      genderIndex: idx,
      'form.gender': this.data.genderOptions[idx],
    })
  },

  onDateChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ 'form.birthDate': e.detail.value as string })
  },

  async onSave() {
    const { patientId, form, saving } = this.data
    if (!patientId || saving) return
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await updatePatient(patientId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: genderToApi(form.gender),
        birthDate: form.birthDate,
        bloodType: form.bloodType.trim(),
        allergySummary: form.allergySummary.trim(),
        historySummary: form.historySummary.trim(),
      })
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },
})
