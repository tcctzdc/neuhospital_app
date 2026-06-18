import { fetchDepartments } from '../../utils/api/department'
import { fetchPendingPayments } from '../../utils/api/payment'
import { fetchMyRegistrations } from '../../utils/api/registration'
import { deptIcon } from '../../utils/format'
import { isLoggedIn } from '../../utils/request'

const SERVICE_URLS = [
  { icon: '📋', label: '预约挂号', bgColor: '#e6f4ff', url: '/pages/registration/department/department' },
  { icon: '💬', label: 'AI 问诊', bgColor: '#e6fffb', url: '/pages/ai/chat/chat' },
  { icon: '📄', label: '就诊记录', bgColor: '#f6ffed', url: '/pages/records/index/index' },
  { icon: '💰', label: '在线缴费', bgColor: '#fff7e6', url: '/pages/payment/list/list', badgeKey: 'payment' },
  { icon: '💊', label: '我的处方', bgColor: '#fff0f6', url: '/pages/records/index/index?tab=prescription' },
  { icon: '🔬', label: '检查报告', bgColor: '#f9f0ff', url: '/pages/records/index/index?tab=inspection' },
  { icon: '🧠', label: 'CT 分析', bgColor: '#e6fffb', url: '/pages/records/index/index?tab=ct' },
  { icon: '🏥', label: '挂号记录', bgColor: '#e6f4ff', url: '/pages/registration/my-list/my-list' },
]

const DEPT_COLORS = ['#e6f4ff', '#fff0f6', '#e6fffb', '#f6ffed', '#fff7e6', '#f9f0ff']

Page({
  data: {
    loading: true,
    banners: [
      { id: 1, tag: 'AI 问诊', title: '7×24 智能健康咨询', desc: 'Spring AI 驱动，随时解答您的健康问题' },
      { id: 2, tag: '在线挂号', title: '足不出户预约挂号', desc: '查看排班、选医生、一键挂号' },
      { id: 3, tag: '影像分析', title: 'CT 智能辅助诊断', desc: 'AI 脑出血检测，快速出具分析报告' },
    ],
    services: SERVICE_URLS.map((s) => ({ ...s, badge: '' })),
    departments: [] as Array<{ id: number; name: string; icon: string; bgColor: string }>,
    todos: [] as Array<{ id: number; type: string; title: string; desc: string; url: string }>,
  },

  onShow() {
    this.loadHomeData()
  },

  async loadHomeData() {
    this.setData({ loading: true })
    try {
      const [deptList, todos] = await Promise.all([
        fetchDepartments().catch(() => []),
        this.buildTodos(),
      ])
      const departments = deptList.slice(0, 6).map((d, i) => ({
        id: d.id,
        name: d.name,
        icon: deptIcon(d.name),
        bgColor: DEPT_COLORS[i % DEPT_COLORS.length],
      }))
      const pendingCount = todos.filter((t) => t.type === 'warning').length
      const services = SERVICE_URLS.map((s) => ({
        ...s,
        badge: s.badgeKey === 'payment' && pendingCount > 0 ? String(pendingCount) : '',
      }))
      this.setData({ departments, todos, services })
    } catch {
      this.setData({ departments: [], todos: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  async buildTodos() {
    if (!isLoggedIn()) return []
    const todos: Array<{ id: number; type: string; title: string; desc: string; url: string }> = []
    try {
      const [payments, regs] = await Promise.all([
        fetchPendingPayments(),
        fetchMyRegistrations(),
      ])
      if (payments.length) {
        const total = payments.reduce((s, p) => s + (p.totalAmount ?? p.amount ?? 0), 0)
        todos.push({
          id: 1,
          type: 'warning',
          title: '待缴费',
          desc: `共 ${payments.length} 笔，合计 ¥${total.toFixed(2)}`,
          url: '/pages/payment/list/list',
        })
      }
      const upcoming = regs.find((r) => ['PENDING', 'WAITING'].includes(String(r.status)))
      if (upcoming) {
        const id = Number(upcoming.id || upcoming.registrationId)
        todos.push({
          id: 2,
          type: 'primary',
          title: '就诊提醒',
          desc: `${upcoming.departmentName || ''} · ${upcoming.doctorName || ''} · ${upcoming.visitDate || ''}`,
          url: `/pages/registration/detail/detail?id=${id}`,
        })
      }
    } catch {
      // 未登录或接口失败
    }
    return todos
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/registration/department/department' })
  },

  goService(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    if (url) wx.navigateTo({ url })
  },

  goTriage() {
    wx.navigateTo({ url: '/pages/ai/triage/triage' })
  },

  goDepartments() {
    wx.navigateTo({ url: '/pages/registration/department/department' })
  },

  goDepartment(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id
    const name = this.data.departments.find((d) => d.id === id)?.name || ''
    wx.navigateTo({ url: `/pages/registration/doctors/doctors?departmentId=${id}&departmentName=${encodeURIComponent(name)}` })
  },

  goTodo(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    if (url) wx.navigateTo({ url })
  },
})
