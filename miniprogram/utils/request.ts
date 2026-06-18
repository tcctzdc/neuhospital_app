import { API_BASE, STORAGE_KEYS } from './config'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  needAuth?: boolean
}

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: string
}

function buildUrl(path: string, data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return `${API_BASE}${path}`
  const query = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`
}

export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, needAuth = true } = options
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (needAuth) {
    const token = wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    if (token) {
      header.Authorization = `Bearer ${token}`
    }
  }

  const isGet = method === 'GET'
  const requestUrl = isGet ? buildUrl(url, data) : `${API_BASE}${url}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: requestUrl,
      method,
      data: isGet ? undefined : data,
      header,
      success: (res) => {
        const body = res.data as ApiResponse<T>
        if (body.code === 200) {
          resolve(body.data)
        } else if (body.code === 401) {
          const app = getApp<IAppOption>()
          app.clearUserInfo()
          wx.showToast({ title: body.message || '请重新登录', icon: 'none' })
          reject(new Error(body.message || '未登录'))
        } else {
          wx.showToast({ title: body.message || '请求失败', icon: 'none' })
          reject(new Error(body.message))
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      },
    })
  })
}

export function isLoggedIn(): boolean {
  return !!wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
}

export function getUserInfo(): Record<string, unknown> | null {
  return wx.getStorageSync(STORAGE_KEYS.USER_INFO) || null
}
