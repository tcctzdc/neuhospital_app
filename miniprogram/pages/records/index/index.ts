import {
  fetchPatientRecords,
  fetchPrescriptions,
  fetchCheckResults,
  fetchInspectionResults,
  fetchCtAnalysisTasks,
} from '../../../utils/api/record'
import { getPatientId, checkLogin } from '../../../utils/patient'
import { isLoggedIn } from '../../../utils/request'

interface RecordItem {
  id: number
  title: string
  subtitle: string
  time: string
  statusText: string
  statusType: string
}

Page({
  data: {
    loading: true,
    isLoggedIn: false,
    activeTab: 'medical',
    tabs: [
      { key: 'medical', label: '病历' },
      { key: 'prescription', label: '处方' },
      { key: 'inspection', label: '检查检验' },
      { key: 'ct', label: 'CT 分析' },
    ],
    list: [] as RecordItem[],
  },

  onLoad(options: Record<string, string>) {
    if (options.tab) this.setData({ activeTab: options.tab })
  },

  onShow() {
    const loggedIn = isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (loggedIn) {
      this.loadTab()
    } else {
      this.setData({ list: [], loading: false })
    }
  },

  onTab(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeTab: e.currentTarget.dataset.key })
    this.loadTab()
  },

  async loadTab() {
    const { activeTab } = this.data
    this.setData({ loading: true })
    try {
      const patientId = await getPatientId()
      let list: RecordItem[] = []
      if (activeTab === 'medical') {
        const rows = await fetchPatientRecords(patientId)
        list = rows.map((r) => ({
          id: r.id,
          title: r.chiefComplaint || r.preliminaryDiagnosis || '门诊病历',
          subtitle: `${r.departmentName || ''} · ${r.doctorName || ''}`,
          time: String(r.visitDate || r.createdAt || '').slice(0, 10),
          statusText: r.status === 'CONFIRMED' ? '已确认' : '病历',
          statusType: 'success',
        }))
      } else if (activeTab === 'prescription') {
        const rows = await fetchPrescriptions(patientId)
        list = rows.map((r) => ({
          id: r.id,
          title: r.prescriptionNo ? `处方 #${r.prescriptionNo}` : `处方 #${r.id}`,
          subtitle: `${r.itemCount || r.items?.length || 0} 种药品 · ${r.doctorName || ''}`,
          time: String(r.createdAt || '').slice(0, 10),
          statusText: r.status === 'DISPENSED' ? '已发药' : (r.status || '有效'),
          statusType: r.status === 'DISPENSED' ? 'success' : 'primary',
        }))
      } else if (activeTab === 'inspection') {
        const [checks, inspections] = await Promise.all([
          fetchCheckResults(patientId),
          fetchInspectionResults(patientId),
        ])
        list = [
          ...checks.map((r) => ({
            id: r.id,
            title: r.checkName || r.name || '检查',
            subtitle: r.departmentName || '检查科',
            time: String(r.createdAt || '').slice(0, 10),
            statusText: '已出报告',
            statusType: 'success',
          })),
          ...inspections.map((r) => ({
            id: r.id,
            title: r.inspectionName || r.name || '检验',
            subtitle: r.departmentName || '检验科',
            time: String(r.createdAt || '').slice(0, 10),
            statusText: '已出报告',
            statusType: 'success',
          })),
        ]
      } else if (activeTab === 'ct') {
        const rows = await fetchCtAnalysisTasks(patientId)
        list = rows.map((r) => ({
          id: Number(r.id || r.taskId),
          title: r.analysisType || 'CT AI 分析',
          subtitle: '影像 AI',
          time: String(r.createdAt || '').slice(0, 10),
          statusText: r.riskLevel || r.status || '分析中',
          statusType: r.riskLevel === 'HIGH' ? 'danger' : 'primary',
        }))
      }
      this.setData({ list })
    } catch {
      this.setData({ list: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const { id, type } = e.currentTarget.dataset
    if (this.data.activeTab === 'medical') {
      wx.navigateTo({ url: `/pages/records/medical/medical?id=${id}` })
    } else {
      wx.showToast({ title: '请在医院系统查看详情', icon: 'none' })
    }
  },
})
