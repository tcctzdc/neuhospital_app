import { API_BASE, REQUEST_TIMEOUT, STORAGE_KEYS } from './config'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  /** 为 true 时不携带本地 token（用于登录/注册） */
  skipToken?: boolean
  /** 为 true 时不弹出 Toast（用于首页等后台预加载） */
  silent?: boolean
}

function parseBody<T>(body: unknown): { ok: true; data: T } | { ok: false; code: number; message: string } {
  if (body === null || body === undefined) {
    return { ok: false, code: -1, message: '空响应' }
  }

  if (typeof body !== 'object') {
    return { ok: true, data: body as T }
  }

  const record = body as Record<string, unknown>

  if (typeof record.code === 'number') {
    if (record.code === 200) {
      return { ok: true, data: (record.data ?? null) as T }
    }
    return { ok: false, code: record.code, message: String(record.message || '请求失败') }
  }

  return { ok: true, data: body as T }
}

function buildUrl(path: string, data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return `${API_BASE}${path}`
  const query = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`
}

function failMessage(err: WechatMiniprogram.GeneralCallbackResult): string {
  const errMsg = err.errMsg || ''
  if (errMsg.includes('timeout')) {
    return `连接超时，请确认后端已启动：${API_BASE}`
  }
  if (errMsg.includes('domain') || errMsg.includes('合法域名')) {
    return '域名校验未关闭，请在开发者工具勾选「不校验合法域名」'
  }
  if (errMsg.includes('fail')) {
    return `网络请求失败：${errMsg}`
  }
  return '网络异常'
}

function toast(title: string, silent?: boolean) {
  if (silent) return
  wx.showToast({ title, icon: 'none', duration: 3000 })
}

function withApiHint(msg: string, requestUrl: string): string {
  if (msg.includes('No static resource') && requestUrl.includes(':8080/')) {
    return `${msg}\n8080 是 Nacos 控制台，请改 config.ts 为网关 10010 并重新编译`
  }
  return msg
}

export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, skipToken = false, silent = false } = options
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!skipToken) {
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
      timeout: REQUEST_TIMEOUT,
      success: (res) => {
        if (res.statusCode !== 200) {
          const msg = withApiHint(httpErrorMessage(res), requestUrl)
          console.error('[request]', method, requestUrl, res.statusCode, res.data)
          if (!skipToken && (res.statusCode === 401 || res.statusCode === 403)) {
            const app = getApp<IAppOption>()
            app.clearUserInfo()
          }
          toast(msg, silent)
          reject(new Error(msg))
          return
        }

        const parsed = parseBody<T>(res.data)
        if (parsed.ok) {
          resolve(parsed.data)
          return
        }

        if (parsed.code === 401) {
          const app = getApp<IAppOption>()
          app.clearUserInfo()
          toast(parsed.message || '请重新登录', silent)
          reject(new Error(parsed.message || '未登录'))
          return
        }

        toast(parsed.message || '请求失败', silent)
        reject(new Error(parsed.message))
      },
      fail: (err) => {
        const msg = failMessage(err)
        console.error('[request]', method, requestUrl, err)
        toast(msg, silent)
        reject(err)
      },
    })
  })
}

export function isLoggedIn(): boolean {
  return !!wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
}

/** 清除本地登录态（token + 用户信息） */
export function clearAuth(): void {
  getApp<IAppOption>().clearUserInfo()
}

export function getUserInfo(): Record<string, unknown> | null {
  return wx.getStorageSync(STORAGE_KEYS.USER_INFO) || null
}
