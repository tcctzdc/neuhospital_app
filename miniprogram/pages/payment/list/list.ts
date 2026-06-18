import { fetchPendingPayments, payOrder } from '../../../utils/api/payment'
import { isLoggedIn } from '../../../utils/request'
import { checkLogin } from '../../../utils/patient'

interface OrderView {
  id: number
  type: string
  items: string[]
  time: string
  amount: string
}

Page({
  data: {
    loading: true,
    isLoggedIn: false,
    totalAmount: '0.00',
    orders: [] as OrderView[],
  },

  onShow() {
    const loggedIn = isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (loggedIn) {
      this.loadOrders()
    } else {
      this.setData({ orders: [], totalAmount: '0.00', loading: false })
    }
  },

  async loadOrders() {
    this.setData({ loading: true })
    try {
      const rows = await fetchPendingPayments()
      const orders: OrderView[] = rows.map((o) => {
        const items = (o.items || o.paymentItems || []).map(
          (i) => i.itemName || i.name || '费用项',
        )
        return {
          id: o.id,
          type: o.orderType || o.type || '待缴费',
          items: items.length ? items : ['医疗费用'],
          time: String(o.createdAt || o.createTime || '').slice(0, 10),
          amount: Number(o.totalAmount ?? o.amount ?? 0).toFixed(2),
        }
      })
      const total = rows.reduce((s, o) => s + Number(o.totalAmount ?? o.amount ?? 0), 0)
      this.setData({ orders, totalAmount: total.toFixed(2) })
    } catch {
      this.setData({ orders: [], totalAmount: '0.00' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: `/pages/payment/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  async payAll() {
    if (!checkLogin({ navigate: true })) return
    const { orders } = this.data
    if (!orders.length) return
    wx.showModal({
      title: '确认支付',
      content: `将依次支付 ${orders.length} 笔待缴订单`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          for (const o of orders) {
            await payOrder(o.id, Number(o.amount))
          }
          wx.showToast({ title: '支付成功', icon: 'success' })
          this.loadOrders()
        } catch {
          // request 内已 toast
        }
      },
    })
  },
})
