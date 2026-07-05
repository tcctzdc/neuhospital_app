import { request } from '../request'
import { departmentDisplayName, unwrapList } from '../format'

export interface DepartmentDto {
  id: number
  name: string
  deptName?: string
  deptCode?: string
  deptType?: string
  description?: string
  parentId?: number
}

function normalizeDepartment(raw: Record<string, unknown>): DepartmentDto {
  const id = Number(raw.id) || 0
  const name = departmentDisplayName({
    name: raw.name as string | undefined,
    deptName: raw.deptName as string | undefined,
    deptCode: raw.deptCode as string | undefined,
    id,
  })
  return {
    id,
    name,
    deptName: raw.deptName as string | undefined,
    deptCode: raw.deptCode as string | undefined,
    deptType: raw.deptType as string | undefined,
    description: (raw.description as string) || '',
    parentId: raw.parentId as number | undefined,
  }
}

export async function fetchDepartments(options?: { silent?: boolean }): Promise<DepartmentDto[]> {
  const data = await request<Record<string, unknown>[] | { records: Record<string, unknown>[] }>({
    url: '/departments',
    method: 'GET',
    silent: options?.silent,
  })
  return unwrapList(data).map((item) => normalizeDepartment(item as Record<string, unknown>))
}

/** 门诊可挂号科室（用于首页推荐） */
export function pickRecommendDepartments(list: DepartmentDto[], limit = 6): DepartmentDto[] {
  const outpatient = list.filter((d) => !d.deptType || d.deptType === 'OUTPATIENT')
  const source = outpatient.length ? outpatient : list
  return source.slice(0, limit)
}
