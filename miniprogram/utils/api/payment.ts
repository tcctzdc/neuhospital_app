import { request } from '../request'
import { unwrapList } from '../format'

export interface PendingPaymentItem {
  id?: number
  itemType?: string
  bizType?: string
  bizId?: number
  itemName?: string
  name?: string
  amount?: number
  totalAmount?: number
  createdAt?: string
}

export interface PaymentOrderDto {
  id: number
  orderNo?: string
  status?: string
  totalAmount?: number
  amount?: number
  items?: Array<{ itemName?: string; name?: string; amount?: number }>
  createdAt?: string
}

export interface PaymentCreateItem {
  itemType: string
  bizId: number
}

/** 查询待缴费项目（patientId 由 Token 解析，无需传参） */
export async function fetchPendingPayments(): Promise<PendingPaymentItem[]> {
  const data = await request<PendingPaymentItem[] | { records: PendingPaymentItem[] } | PendingPaymentItem>({
    url: '/payment/pending',
    method: 'GET',
  })
  if (Array.isArray(data)) return data
  return unwrapList(data as { records: PendingPaymentItem[] })
}

/** 创建支付订单 POST /api/payment/create */
export async function createPaymentOrder(items: PaymentCreateItem[]): Promise<PaymentOrderDto> {
  return request<PaymentOrderDto>({
    url: '/payment/create',
    method: 'POST',
    data: { items } as Record<string, unknown>,
  })
}

/** 模拟支付 POST /api/payment/{id}/pay */
export async function payOrder(id: number, paidAmount?: number): Promise<PaymentOrderDto> {
  return request<PaymentOrderDto>({
    url: `/payment/${id}/pay`,
    method: 'POST',
    data: paidAmount ? { payChannel: 'WECHAT', paidAmount } : { payChannel: 'WECHAT' },
  })
}

/** 将待缴项转为 create 请求体 */
export function toPaymentCreateItems(rows: PendingPaymentItem[]): PaymentCreateItem[] {
  return rows
    .map((o) => ({
      itemType: String(o.itemType || o.bizType || 'REGISTRATION').toUpperCase(),
      bizId: Number(o.bizId ?? o.id ?? 0),
    }))
    .filter((o) => o.bizId > 0)
}
