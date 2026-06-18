import { createAiSession, fetchAiMessages, sendAiMessage } from '../../../utils/api/ai'
import { getPatientId, checkLogin } from '../../../utils/patient'

interface MsgView {
  id: number
  role: string
  content: string
  time: string
}

function formatTime(raw?: string): string {
  if (!raw) {
    const n = new Date()
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  }
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw.slice(11, 16) || raw
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function mapMessage(m: Record<string, unknown>, idx: number): MsgView {
  return {
    id: Number(m.id ?? idx),
    role: String(m.role || '').toLowerCase() === 'user' ? 'user' : 'assistant',
    content: String(m.content || ''),
    time: formatTime(String(m.createdAt || '')),
  }
}

Page({
  data: {
    sessionId: null as number | null,
    input: '',
    typing: false,
    scrollTo: '',
    messages: [] as MsgView[],
    quickQuestions: [
      '头痛三天伴有恶心怎么办？',
      '高血压患者饮食注意事项',
      '感冒和流感有什么区别？',
      '应该挂哪个科室？',
    ],
    msgId: 0,
  },

  async onLoad(options: Record<string, string>) {
    if (!checkLogin({ navigate: true })) return
    if (options.sessionId) {
      const sessionId = Number(options.sessionId)
      this.setData({ sessionId })
      await this.loadMessages(sessionId)
    }
  },

  async ensureSession(): Promise<number> {
    if (this.data.sessionId) return this.data.sessionId
    const patientId = await getPatientId()
    const session = await createAiSession(patientId, 'INQUIRY')
    this.setData({ sessionId: session.id })
    return session.id
  },

  async loadMessages(sessionId: number) {
    try {
      const list = await fetchAiMessages(sessionId)
      const messages = list.map((m, i) => mapMessage(m as unknown as Record<string, unknown>, i + 1))
      this.setData({ messages, msgId: messages.length })
    } catch {
      this.setData({ messages: [], msgId: 0 })
    }
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ input: e.detail.value })
  },

  sendQuick(e: WechatMiniprogram.TouchEvent) {
    this.setData({ input: e.currentTarget.dataset.text })
    this.onSend()
  },

  async onSend() {
    const text = this.data.input.trim()
    if (!text) return

    const { msgId, messages } = this.data
    const time = formatTime()
    const userMsg: MsgView = { id: msgId + 1, role: 'user', content: text, time }
    this.setData({
      messages: [...messages, userMsg],
      input: '',
      typing: true,
      msgId: msgId + 1,
      scrollTo: `msg-${msgId + 1}`,
    })

    try {
      const sessionId = await this.ensureSession()
      const res = await sendAiMessage(sessionId, text)
      let reply = ''
      if (typeof res === 'object' && res) {
        const r = res as Record<string, unknown>
        reply = String(
          r.content
          || (r.assistantMessage as Record<string, unknown>)?.content
          || r.reply
          || '',
        )
      }
      if (!reply) {
        await this.loadMessages(sessionId)
        this.setData({ typing: false })
        return
      }
      const aiMsg: MsgView = { id: msgId + 2, role: 'assistant', content: reply, time }
      this.setData({
        messages: [...this.data.messages, aiMsg],
        typing: false,
        msgId: msgId + 2,
        scrollTo: `msg-${msgId + 2}`,
      })
    } catch {
      this.setData({ typing: false })
    }
  },
})
