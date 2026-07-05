import { fetchDepartments } from '../../../utils/api/department'
import { deptIcon } from '../../../utils/format'
import { checkLogin } from '../../../utils/patient'

interface DeptItem {
  id: number
  name: string
  icon: string
  desc: string
}

interface Category {
  name: string
  depts: DeptItem[]
}

Page({
  data: {
    loading: true,
    keyword: '',
    activeIndex: 0,
    categories: [] as Category[],
    filteredDepts: [] as DeptItem[],
  },

  onLoad() {
    if (!checkLogin({ navigate: true })) return
    this.loadDepartments()
  },

  async loadDepartments() {
    this.setData({ loading: true })
    try {
      const list = await fetchDepartments()
      const depts: DeptItem[] = list.map((d) => ({
        id: d.id,
        name: d.name,
        icon: deptIcon(d.name),
        desc: d.description || '点击查看医生排班',
      }))
      this.setData({
        categories: depts.length ? [{ name: '全部科室', depts }] : [],
        activeIndex: 0,
      })
      this.updateDepts()
    } catch {
      this.setData({ categories: [], filteredDepts: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  updateDepts() {
    const { categories, activeIndex, keyword } = this.data
    if (!categories.length) {
      this.setData({ filteredDepts: [] })
      return
    }
    let depts = categories[activeIndex]?.depts || []
    if (keyword) {
      depts = categories.flatMap((c) => c.depts).filter((d) => d.name.includes(keyword))
    }
    this.setData({ filteredDepts: depts })
  },

  onCategory(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeIndex: e.currentTarget.dataset.index, keyword: '' })
    this.updateDepts()
  },

  onSearch(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value })
    this.updateDepts()
  },

  selectDept(e: WechatMiniprogram.TouchEvent) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/registration/doctors/doctors?departmentId=${id}&departmentName=${name}` })
  },
})
