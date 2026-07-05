import { payOrder } from '../../../utils/api/payment'
import { checkLogin } from '../../../utils/patient'

Page({
  data: {
    id: 0,
    paying: false,
    loading: false,
    amount: '0.00',
    statusText: '待支付',
    items: [] as Array<{ name: string; price: string }>,
    info: [] as Array<{ label: string; value: string }>,
  },

  onLoad(options: Record<string, string>) {
    if (!checkLogin({ navigate: true })) return
    const id = Number(options.id)
    const amount = options.amount || '0.00'
    const orderNo = options.orderNo || String(id)
    this.setData({
      id,
      amount,
      statusText: '待支付',
      items: [{ name: '医疗费用', price: amount }],
      info: [
        { label: '订单编号', value: orderNo },
        { label: '订单状态', value: 'PENDING' },
      ],
    })
  },

  async onPay() {
    const { id, amount } = this.data
    if (!id) {
      wx.redirectTo({ url: '/pages/payment/list/list' })
      return
    }
    wx.showModal({
      title: '确认支付',
      content: `微信支付 ¥${amount}？`,
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ paying: true })
        try {
          await payOrder(id, Number(amount))
          wx.showToast({ title: '支付成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1000)
        } catch {
          // request 内已 toast
        } finally {
          this.setData({ paying: false })
        }
      },
    })
  },
})
