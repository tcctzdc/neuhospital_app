import { fetchMedicalRecord, fetchMedicalDiagnoses } from '../../../utils/api/record'
import { checkLogin } from '../../../utils/patient'

Page({
  data: {
    loading: true,
    sections: [] as Array<{ label: string; content: string }>,
    diagnoses: [] as Array<{ name: string; code: string }>,
    meta: '',
  },

  async onLoad(options: Record<string, string>) {
    if (!checkLogin({ navigate: true })) return
    const id = Number(options.id)
    if (id) await this.loadDetail(id)
  },

  async loadDetail(id: number) {
    this.setData({ loading: true })
    try {
      const [record, diagnoses] = await Promise.all([
        fetchMedicalRecord(id),
        fetchMedicalDiagnoses(id).catch(() => []),
      ])
      const sections = [
        { label: '主诉', content: record.chiefComplaint },
        { label: '现病史', content: record.presentIllness },
        { label: '既往史', content: record.pastHistory },
        { label: '过敏史', content: record.allergyHistory },
        { label: '体格检查', content: record.physicalExam },
        { label: '初步诊断', content: record.preliminaryDiagnosis },
      ].filter((s) => s.content) as Array<{ label: string; content: string }>

      this.setData({
        sections,
        diagnoses: diagnoses.map((d) => ({
          name: d.diagnosisName || d.name || '',
          code: d.icdCode || d.code || '',
        })),
        meta: `${record.visitDate || record.createdAt || ''} · ${record.departmentName || ''} · ${record.doctorName || ''}`,
      })
    } catch {
      this.setData({ sections: [], diagnoses: [] })
    } finally {
      this.setData({ loading: false })
    }
  },
})
