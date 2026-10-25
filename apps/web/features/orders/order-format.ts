import { formatPrice } from '../../services/catalog-client';

export const formatOrderDate = (value: string): string =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const statusLabel = (value: string): string => {
  const labels: Record<string, string> = {
    PENDING_CONFIRMATION: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PACKING: 'Đang đóng gói',
    SHIPPING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    COD: 'Thanh toán khi nhận hàng',
  };
  return labels[value] ?? value;
};

export const money = formatPrice;
