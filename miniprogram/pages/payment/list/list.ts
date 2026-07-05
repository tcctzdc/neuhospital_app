import { fetchPendingPayments, createPaymentOrder, payOrder, toPaymentCreateItems } from '../../../utils/api/payment'
import { isLoggedIn } from '../../../utils/request'
import { checkLogin } from '../../../utils/patient'

interface PendingView {
  itemType: string
  bizId: number
  bizType: string
  name: string
  time: string
  amount: string
}

Page({
  data: {
    loading: true,
    paying: false,
    isLoggedIn: false,
    totalAmount: '0.00',
    orders: [] as PendingView[],
    rawItems: [] as ReturnType<typeof toPaymentCreateItems>,
  },

  onShow() {
    const loggedIn = isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (loggedIn) {
      this.loadPending()
    } else {
      this.setData({ orders: [], rawItems: [], totalAmount: '0.00', loading: false })
    }
  },

  async loadPending() {
    this.setData({ loading: true })
    try {
      const rows = await fetchPendingPayments()
      const orders: PendingView[] = rows.map((o) => ({
        itemType: String(o.itemType || o.bizType || 'REGISTRATION').toUpperCase(),
        bizId: Number(o.bizId ?? o.id ?? 0),
        bizType: o.itemType || o.bizType || '待缴费',
        name: o.itemName || o.name || '医疗费用',
        time: String(o.createdAt || '').slice(0, 10),
        amount: Number(o.amount ?? o.totalAmount ?? 0).toFixed(2),
      }))
      const total = rows.reduce((s, o) => s + Number(o.amount ?? o.totalAmount ?? 0), 0)
      this.setData({
        orders,
        rawItems: toPaymentCreateItems(rows),
        totalAmount: total.toFixed(2),
      })
    } catch {
      this.setData({ orders: [], rawItems: [], totalAmount: '0.00' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  async payAll() {
    if (!checkLogin({ navigate: true })) return
    const { rawItems, paying } = this.data
    if (!rawItems.length || paying) return
    wx.showModal({
      title: '确认支付',
      content: `将支付 ${rawItems.length} 项待缴费用，合计 ¥${this.data.totalAmount}`,
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ paying: true })
        try {
          const order = await createPaymentOrder(rawItems)
          const amount = Number(order.totalAmount ?? order.amount ?? this.data.totalAmount)
          await payOrder(order.id, amount)
          wx.showToast({ title: '支付成功', icon: 'success' })
          this.loadPending()
        } catch {
          // request 内已 toast
        } finally {
          this.setData({ paying: false })
        }
      },
    })
  },
})
