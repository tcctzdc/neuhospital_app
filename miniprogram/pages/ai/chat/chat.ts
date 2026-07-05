import { createAiSession, sendAiMessage } from '../../../utils/api/ai'
import { checkLogin } from '../../../utils/patient'

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

Page({
  data: {
    sessionNo: '',
    input: '',
    typing: false,
    sending: false,
    scrollTo: '',
    messages: [] as MsgView[],
    quickQuestions: [
      '头痛三天伴有恶心怎么办？',
      '高血压患者饮食注意事项',
      '感冒和流感有什么区别？',
      '帮我查一下明天有没有心内科号源',
    ],
    msgId: 0,
  },

  async onLoad() {
    if (!checkLogin({ navigate: true })) return
  },

  async ensureSession(): Promise<string> {
    if (this.data.sessionNo) return this.data.sessionNo
    const session = await createAiSession('INQUIRY')
    const sessionNo = String(session.sessionNo || session.id || '')
    this.setData({ sessionNo })
    return sessionNo
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
      sending: true,
      msgId: msgId + 1,
      scrollTo: `msg-${msgId + 1}`,
    })

    try {
      const sessionNo = await this.ensureSession()
      const res = await sendAiMessage(sessionNo, text)
      const reply = String(
        res.content
        || res.reply
        || res.assistantMessage?.content
        || '抱歉，暂时无法回答，请稍后再试。',
      )
      const aiMsg: MsgView = { id: msgId + 2, role: 'assistant', content: reply, time }
      this.setData({
        messages: [...this.data.messages, aiMsg],
        typing: false,
        sending: false,
        msgId: msgId + 2,
        scrollTo: `msg-${msgId + 2}`,
      })
    } catch {
      this.setData({ typing: false, sending: false })
    }
  },
})
