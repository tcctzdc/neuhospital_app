import { fetchPaymentOrder, payOrder } from '../../../utils/api/payment'
import { checkLogin } from '../../../utils/patient'

Page({
  data: {
    id: 0,
    loading: true,
    amount: '0.00',
    statusText: '待支付',
    items: [] as Array<{ name: string; price: string }>,
    info: [] as Array<{ label: string; value: string }>,
  },

  async onLoad(options: Record<string, string>) {
    if (!checkLogin({ navigate: true })) return
    const id = Number(options.id)
    this.setData({ id })
    if (id) await this.loadDetail(id)
  },

  async loadDetail(id: number) {
    this.setData({ loading: true })
    try {
      const order = await fetchPaymentOrder(id)
      const items = (order.items || order.paymentItems || []).map((i) => ({
        name: i.itemName || i.name || '费用项',
        price: Number(i.amount ?? i.price ?? 0).toFixed(2),
      }))
      const amount = Number(order.totalAmount ?? order.amount ?? 0).toFixed(2)
      this.setData({
        amount,
        statusText: order.status === 'PAID' ? '已支付' : '待支付',
        items: items.length ? items : [{ name: '医疗费用', price: amount }],
        info: [
          { label: '订单编号', value: String(order.orderNo || order.id) },
          { label: '订单状态', value: String(order.status || 'PENDING') },
          { label: '创建时间', value: String(order.createdAt || order.createTime || '-') },
        ],
      })
    } catch {
      this.setData({ items: [], info: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onPay() {
    const { id, amount } = this.data
    wx.showModal({
      title: '确认支付',
      content: `微信支付 ¥${amount}？`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await payOrder(id, Number(amount))
          wx.showToast({ title: '支付成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1000)
        } catch {
          // request 内已 toast
        }
      },
    })
  },
})
