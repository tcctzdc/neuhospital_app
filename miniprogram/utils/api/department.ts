import { request } from '../request'
import { unwrapList } from '../format'

export interface DepartmentDto {
  id: number
  name: string
  description?: string
  parentId?: number
}

export async function fetchDepartments(): Promise<DepartmentDto[]> {
  const data = await request<DepartmentDto[] | { records: DepartmentDto[] }>({
    url: '/departments',
    method: 'GET',
    needAuth: false,
  })
  return unwrapList(data)
}
