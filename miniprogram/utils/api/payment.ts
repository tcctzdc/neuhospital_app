import { request } from '../request'
import { unwrapList } from '../format'

export interface PaymentItemDto {
  itemName?: string
  name?: string
  amount?: number
  price?: number
}

export interface PaymentOrderDto {
  id: number
  orderNo?: string
  orderType?: string
  type?: string
  status?: string
  totalAmount?: number
  amount?: number
  paidAmount?: number
  createdAt?: string
  createTime?: string
  items?: PaymentItemDto[]
  paymentItems?: PaymentItemDto[]
}

export async function fetchPendingPayments(): Promise<PaymentOrderDto[]> {
  const data = await request<PaymentOrderDto[] | { records: PaymentOrderDto[] }>({
    url: '/payment-orders/pending',
    method: 'GET',
  })
  return unwrapList(data)
}

export async function fetchPaymentOrder(id: number): Promise<PaymentOrderDto> {
  return request<PaymentOrderDto>({ url: `/payment-orders/${id}`, method: 'GET' })
}

export async function payOrder(id: number, paidAmount: number): Promise<PaymentOrderDto> {
  return request<PaymentOrderDto>({
    url: `/payment-orders/${id}/pay`,
    method: 'POST',
    data: { payChannel: 'WECHAT', paidAmount },
  })
}

export async function fetchPaymentOrders(pageNo = 1, pageSize = 20): Promise<PaymentOrderDto[]> {
  const data = await request<PaymentOrderDto[] | { records: PaymentOrderDto[] }>({
    url: '/payment-orders',
    method: 'GET',
    data: { pageNo, pageSize },
  })
  return unwrapList(data)
}
