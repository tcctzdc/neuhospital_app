import { register } from '../../../utils/api/auth'

Page({
  data: {
    loading: false,
    genderOptions: ['男', '女'],
    form: {
      username: '',
      password: '',
      realName: '',
      phone: '',
      idCard: '',
      gender: '',
    },
    fields: [
      { key: 'username', label: '用户名', placeholder: '设置登录用户名' },
      { key: 'password', label: '密码', placeholder: '设置登录密码', password: true },
      { key: 'realName', label: '真实姓名', placeholder: '请输入真实姓名' },
      { key: 'phone', label: '手机号', placeholder: '请输入手机号', inputType: 'number' },
      { key: 'idCard', label: '身份证号', placeholder: '请输入身份证号' },
      { key: 'gender', label: '性别', type: 'gender' },
    ],
  },

  onInput(e: WechatMiniprogram.Input) {
    const key = e.currentTarget.dataset.key as string
    this.setData({ [`form.${key}`]: e.detail.value })
  },

  onGender(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value)
    this.setData({ 'form.gender': idx === 0 ? 'MALE' : 'FEMALE' })
  },

  async onRegister() {
    const { form } = this.data
    if (!form.username || !form.password || !form.realName || !form.phone) {
      wx.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      await register(form)
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch {
      // request 内已 toast
    } finally {
      this.setData({ loading: false })
    }
  },
})
