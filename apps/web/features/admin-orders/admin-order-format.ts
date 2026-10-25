import { formatOrderDate, money, statusLabel } from '../orders/order-format';

export { formatOrderDate, money, statusLabel };

export const orderStatusOptions = [
  ['PENDING_CONFIRMATION', 'Chờ xác nhận'],
  ['CONFIRMED', 'Đã xác nhận'],
  ['PACKING', 'Đang đóng gói'],
  ['SHIPPING', 'Đang giao hàng'],
  ['COMPLETED', 'Hoàn thành'],
  ['CANCELLED', 'Đã hủy'],
] as const;

export const paymentStatusOptions = [
  ['UNPAID', 'Chưa thanh toán'],
  ['PAID', 'Đã thanh toán'],
] as const;

export const paymentMethodOptions = [['COD', 'Thanh toán khi nhận hàng']] as const;

export const sortOptions = [
  ['newest', 'Mới nhất'],
  ['oldest', 'Cũ nhất'],
  ['totalAsc', 'Tổng tiền tăng dần'],
  ['totalDesc', 'Tổng tiền giảm dần'],
] as const;
