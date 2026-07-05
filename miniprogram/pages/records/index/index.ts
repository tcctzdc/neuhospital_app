import {
  fetchPatientRecords,
  fetchPrescriptions,
  fetchCheckRequests,
  fetchInspectionRequests,
} from '../../../utils/api/record'
import { getPatientId } from '../../../utils/patient'
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
    emptyHint: '',
    tabs: [
      { key: 'medical', label: '病历' },
      { key: 'prescription', label: '处方' },
      { key: 'inspection', label: '检查检验' },
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
      this.setData({ list: [], loading: false, emptyHint: '' })
    }
  },

  onTab(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeTab: e.currentTarget.dataset.key, emptyHint: '' })
    this.loadTab()
  },

  async loadTab() {
    const { activeTab } = this.data
    this.setData({ loading: true, emptyHint: '' })
    try {
      const patientId = await getPatientId()
      if (!patientId) {
        this.setData({ list: [] })
        return
      }
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
          fetchCheckRequests(patientId),
          fetchInspectionRequests(patientId),
        ])
        list = [
          ...checks.map((r) => ({
            id: r.id,
            title: r.checkName || r.checkItemName || r.name || `检查 #${r.requestNo || r.id}`,
            subtitle: r.departmentName || '检查科',
            time: String(r.createdAt || '').slice(0, 10),
            statusText: r.status || '申请单',
            statusType: 'primary',
          })),
          ...inspections.map((r) => ({
            id: r.id,
            title: r.inspectionName || r.inspectionItemName || r.name || `检验 #${r.requestNo || r.id}`,
            subtitle: r.departmentName || '检验科',
            time: String(r.createdAt || '').slice(0, 10),
            statusText: r.status || '申请单',
            statusType: 'primary',
          })),
        ]
      }
      this.setData({ list })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      const hint = msg.includes('403') || msg.includes('Access Denied') || msg.includes('权限')
        ? '后端暂未开放患者读取权限，请稍后重试'
        : ''
      this.setData({ list: [], emptyHint: hint })
    } finally {
      this.setData({ loading: false })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' })
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset
    if (this.data.activeTab === 'medical') {
      wx.navigateTo({ url: `/pages/records/medical/medical?id=${id}` })
    } else {
      wx.showToast({ title: '请在列表中查看摘要', icon: 'none' })
    }
  },
})
