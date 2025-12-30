/**
 * 订单相关类型定义
 */

export enum OrderStatus {
    PENDING_PAYMENT = 1,
    PENDING_SHIPMENT = 2,
    PENDING_RECEIPT = 3,
    COMPLETED = 4,
    CLOSED = 6,
}

export const ORDER_STATUS_TEXT: Record<number, string> = {
    0: '获取中',
    [OrderStatus.PENDING_PAYMENT]: '待付款',
    [OrderStatus.PENDING_SHIPMENT]: '待发货',
    [OrderStatus.PENDING_RECEIPT]: '待收货',
    [OrderStatus.COMPLETED]: '交易成功',
    [OrderStatus.CLOSED]: '已关闭',
}

export const ORDER_STATUS_CLASS: Record<number, string> = {
    0: 'order-status order-status-pending',
    [OrderStatus.PENDING_PAYMENT]: 'order-status order-status-pending',
    [OrderStatus.PENDING_SHIPMENT]: 'order-status order-status-paid',
    [OrderStatus.PENDING_RECEIPT]: 'order-status order-status-shipped',
    [OrderStatus.COMPLETED]: 'order-status order-status-completed',
    [OrderStatus.CLOSED]: 'order-status order-status-cancelled',
}

export interface Order {
    id: number
    orderId: string
    accountId: string
    itemId: string
    itemTitle: string
    itemPicUrl: string
    price: string
    buyerUserId: string
    buyerNickname: string
    status: number
    statusText: string
    orderTime: string
    payTime: string | null
    shipTime: string | null
    completeTime: string | null
    createdAt: string
    updatedAt: string
}

export interface OrderListResponse {
    orders: Order[]
    total: number
    limit: number
    offset: number
}
