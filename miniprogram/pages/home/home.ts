import { fetchDepartments, pickRecommendDepartments } from '../../utils/api/department'
import { fetchDoctors } from '../../utils/api/doctor'
import { fetchPendingPayments } from '../../utils/api/payment'
import { fetchMyRegistrations } from '../../utils/api/registration'
import { deptIcon, firstChar } from '../../utils/format'
import { checkLogin } from '../../utils/patient'
import { isLoggedIn } from '../../utils/request'

const SERVICE_URLS = [
  { icon: '📋', label: '预约挂号', bgColor: '#e6f4ff', url: '/pages/registration/department/department' },
  { icon: '🏥', label: '挂号记录', bgColor: '#e6f4ff', url: '/pages/registration/my-list/my-list' },
  { icon: '💰', label: '在线缴费', bgColor: '#fff7e6', url: '/pages/payment/list/list', badgeKey: 'payment' },
  { icon: '📄', label: '就诊记录', bgColor: '#f6ffed', url: '/pages/records/index/index' },
  { icon: '💊', label: '我的处方', bgColor: '#fff0f6', url: '/pages/records/index/index?tab=prescription' },
  { icon: '🔬', label: '检查检验', bgColor: '#f9f0ff', url: '/pages/records/index/index?tab=inspection' },
  { icon: '💬', label: 'AI 问诊', bgColor: '#e6fffb', url: '/pages/ai/chat/chat', needLogin: true },
]

const DEPT_COLORS = ['#e6f4ff', '#fff0f6', '#e6fffb', '#f6ffed', '#fff7e6', '#f9f0ff']

interface DeptView {
  id: number
  name: string
  abbr: string
  icon: string
  bgColor: string
}

interface SearchResult {
  type: 'dept' | 'doctor'
  id: number
  name: string
  sub: string
  departmentId?: number
  departmentName?: string
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

Page({
  data: {
    deptLoading: true,
    isLoggedIn: false,
    searchKeyword: '',
    searchLoading: false,
    searchResults: [] as SearchResult[],
    banners: [
      { id: 1, tag: '在线挂号', title: '足不出户预约挂号', desc: '查看排班、选医生、一键挂号' },
      { id: 2, tag: '在线缴费', title: '挂号/检查/处方一站式缴费', desc: '待缴项目一目了然，模拟微信支付' },
      { id: 3, tag: 'AI 问诊', title: '7×24 智能健康咨询', desc: 'Spring AI 驱动，随时解答健康问题' },
    ],
    services: SERVICE_URLS.map((s) => ({ ...s, badge: '' })),
    departments: [] as DeptView[],
    todos: [] as Array<{ id: number; type: string; title: string; desc: string; url: string }>,
  },

  allDepartments: [] as Awaited<ReturnType<typeof fetchDepartments>>,

  onShow() {
    this.loadHomeData()
  },

  async loadHomeData() {
    const loggedIn = isLoggedIn()
    this.setData({ deptLoading: true, isLoggedIn: loggedIn })
    try {
      const [deptList, todos] = await Promise.all([
        loggedIn
          ? fetchDepartments({ silent: true }).catch(() => [])
          : Promise.resolve([]),
        this.buildTodos(),
      ])
      this.allDepartments = deptList
      const recommend = pickRecommendDepartments(deptList, 6)
      const departments = recommend.map((d, i) => ({
        id: d.id,
        name: d.name,
        abbr: firstChar(d.name),
        icon: deptIcon(d.name),
        bgColor: DEPT_COLORS[i % DEPT_COLORS.length],
      }))
      const pendingCount = todos.filter((t) => t.type === 'warning').length
      const services = SERVICE_URLS.map((s) => ({
        ...s,
        badge: s.badgeKey === 'payment' && pendingCount > 0 ? String(pendingCount) : '',
      }))
      this.setData({ departments, todos, services })
      if (this.data.searchKeyword) {
        this.runSearch(this.data.searchKeyword)
      }
    } catch {
      this.allDepartments = []
      this.setData({ departments: [], todos: [] })
    } finally {
      this.setData({ deptLoading: false })
    }
  },

  async buildTodos() {
    if (!isLoggedIn()) return []
    const todos: Array<{ id: number; type: string; title: string; desc: string; url: string }> = []
    try {
      const [payments, regs] = await Promise.all([
        fetchPendingPayments().catch(() => []),
        fetchMyRegistrations().catch(() => []),
      ])
      if (payments.length) {
        const total = payments.reduce((s, p) => s + Number(p.amount ?? p.totalAmount ?? 0), 0)
        todos.push({
          id: 1,
          type: 'warning',
          title: '待缴费',
          desc: `共 ${payments.length} 项，合计 ¥${total.toFixed(2)}`,
          url: '/pages/payment/list/list',
        })
      }
      const upcoming = regs.find((r) => ['PENDING', 'WAITING', 'PAID'].includes(String(r.status)))
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

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = (e.detail.value || '').trim()
    this.setData({ searchKeyword: keyword })
    if (searchTimer) clearTimeout(searchTimer)
    if (!keyword) {
      this.setData({ searchResults: [], searchLoading: false })
      return
    }
    if (!isLoggedIn()) {
      checkLogin({ navigate: true })
      return
    }
    searchTimer = setTimeout(() => this.runSearch(keyword), 300)
  },

  onSearchConfirm(e: WechatMiniprogram.Input) {
    const keyword = (e.detail.value || '').trim()
    if (!keyword) return
    if (!isLoggedIn()) {
      checkLogin({ navigate: true })
      return
    }
    this.runSearch(keyword)
  },

  onSearchFocus() {
    if (!isLoggedIn()) {
      checkLogin({ navigate: true })
    }
  },

  async runSearch(keyword: string) {
    const kw = keyword.trim().toLowerCase()
    if (!kw) {
      this.setData({ searchResults: [], searchLoading: false })
      return
    }
    this.setData({ searchLoading: true })
    try {
      if (!this.allDepartments.length) {
        this.allDepartments = await fetchDepartments({ silent: true }).catch(() => [])
      }
      const deptHits = this.allDepartments
        .filter((d) => d.name.toLowerCase().includes(kw))
        .slice(0, 6)
        .map((d) => ({
          type: 'dept' as const,
          id: d.id,
          name: d.name,
          sub: '科室',
        }))
      const doctorList = await fetchDoctors({ keyword: kw, pageNo: 1, pageSize: 8 }).catch(() => [])
      const doctorHits = doctorList
        .filter((doc) => doc.name && doc.name.toLowerCase().includes(kw))
        .map((doc) => ({
          type: 'doctor' as const,
          id: doc.id,
          name: doc.name,
          sub: [doc.title, doc.departmentName].filter(Boolean).join(' · ') || '医生',
          departmentId: doc.departmentId,
          departmentName: doc.departmentName,
        }))
      this.setData({ searchResults: [...deptHits, ...doctorHits] })
    } catch {
      this.setData({ searchResults: [] })
    } finally {
      this.setData({ searchLoading: false })
    }
  },

  onSearchResult(e: WechatMiniprogram.TouchEvent) {
    const { type, id, name, departmentId, departmentName } = e.currentTarget.dataset
    if (type === 'dept') {
      wx.navigateTo({
        url: `/pages/registration/doctors/doctors?departmentId=${id}&departmentName=${encodeURIComponent(String(name || ''))}`,
      })
      return
    }
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    wx.navigateTo({
      url: `/pages/registration/confirm/confirm?doctorId=${id}&departmentId=${departmentId || ''}&departmentName=${encodeURIComponent(String(departmentName || ''))}&date=${today}`,
    })
  },

  clearSearch() {
    if (searchTimer) clearTimeout(searchTimer)
    this.setData({ searchKeyword: '', searchResults: [], searchLoading: false })
  },

  goService(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    const needLogin = e.currentTarget.dataset.login
    if (needLogin && !checkLogin({ navigate: true })) return
    if (url) wx.navigateTo({ url })
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
