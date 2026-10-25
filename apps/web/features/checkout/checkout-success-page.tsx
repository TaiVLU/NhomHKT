'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice } from '../../services/catalog-client';
import {
  readCheckoutConfirmation,
  type CheckoutConfirmation,
} from '../../services/checkout-client';

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const mapOrderStatus = (status: string): string => {
  const mapping: Record<string, string> = {
    PENDING_CONFIRMATION: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    CANCELLED: 'Đã hủy',
  };
  return mapping[status] ?? status;
};

const mapPaymentInfo = (method: string, status: string): string => {
  const methodLabel = method === 'COD' ? 'Khi nhận hàng (COD)' : method;
  const statusLabel = status === 'UNPAID' ? 'Chưa thanh toán' : status === 'PAID' ? 'Đã thanh toán' : status;
  return `${methodLabel} · ${statusLabel}`;
};

export function CheckoutSuccessPage() {
  const [confirmation, setConfirmation] = useState<CheckoutConfirmation | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setConfirmation(readCheckoutConfirmation());
  }, []);

  if (confirmation === undefined)
    return (
      <main className="checkout-success-page" aria-busy="true">
        <div className="checkout-card" style={{ borderRadius: '16px' }}>
          <p className="text-sm text-slate-500">Đang tải xác nhận đơn hàng…</p>
        </div>
      </main>
    );

  if (!confirmation)
    return (
      <main className="cart-message-page">
        <p className="eyebrow text-xs font-semibold tracking-wider text-[#0080c8] uppercase">Thanh toán</p>
        <h1 className="text-xl font-bold text-slate-800 mt-1">Chưa có dữ liệu xác nhận đơn hàng</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          HKT Store chưa có trang tra cứu đơn hàng trong phạm vi hiện tại. Bạn có thể tiếp tục mua sắm
          hoặc quay lại giỏ hàng
        </p>
        <div className="cart-message-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link
            className="bg-[#0080c8] px-5 text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition hover:bg-[#0070b0]"
            href="/san-pham"
            style={{
              borderRadius: '8px',
              height: '42px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            Tiếp tục mua sắm
          </Link>
          <Link
            className="border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            href="/gio-hang"
            style={{
              borderRadius: '8px',
              height: '42px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            Về giỏ hàng
          </Link>
        </div>
      </main>
    );

  return (
    <main className="checkout-success-page">
      <section
        className="checkout-success-hero checkout-card"
        aria-labelledby="success-title"
        style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '28px' }}
      >
        <div
          className="success-icon"
          aria-hidden="true"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#10b981',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}
        >
          ✓
        </div>
        <p className="eyebrow text-xs font-semibold tracking-wider text-[#0080c8] uppercase">Hoàn tất</p>
        <h2 id="success-title" className="text-2xl font-bold text-slate-800 mt-1">
          Đặt hàng thành công
        </h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Cảm ơn bạn đã mua hàng tại HKT Store. Đơn hàng của bạn đã được tiếp nhận
        </p>
        <dl className="success-meta">
          <div style={{ borderRadius: '10px' }}>
            <dt>Mã đơn hàng</dt>
            <dd style={{ fontWeight: 500, fontSize: '0.875rem', color: '#334155' }}>
              {confirmation.orderNumber}
            </dd>
          </div>
          <div style={{ borderRadius: '10px' }}>
            <dt>Trạng thái đơn</dt>
            <dd style={{ fontWeight: 500, fontSize: '0.875rem', color: '#0284c7' }}>
              {mapOrderStatus(confirmation.orderStatus)}
            </dd>
          </div>
          <div style={{ borderRadius: '10px' }}>
            <dt>Thanh toán</dt>
            <dd style={{ fontWeight: 400, fontSize: '0.875rem', color: '#334155' }}>
              {mapPaymentInfo(confirmation.paymentMethod, confirmation.paymentStatus)}
            </dd>
          </div>
          <div style={{ borderRadius: '10px' }}>
            <dt>Thời gian</dt>
            <dd style={{ fontWeight: 400, fontSize: '0.875rem', color: '#334155' }}>
              {formatDate(confirmation.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="checkout-success-layout">
        <section
          className="checkout-card"
          aria-labelledby="success-address-title"
          style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '24px' }}
        >
          <h2 id="success-address-title" className="text-lg font-bold text-slate-800 mb-3">
            Địa chỉ giao hàng
          </h2>
          <p className="text-sm text-slate-700">
            <strong>{confirmation.shippingAddress.recipientName}</strong> · {confirmation.shippingAddress.phone}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {confirmation.shippingAddress.line1}, {confirmation.shippingAddress.ward},{' '}
            {confirmation.shippingAddress.district}, {confirmation.shippingAddress.province}
          </p>
          {confirmation.shippingAddress.postalCode && (
            <p className="text-xs text-slate-400 mt-1">Mã bưu chính: {confirmation.shippingAddress.postalCode}</p>
          )}
          {confirmation.shippingAddress.deliveryNote && (
            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-md">
              Ghi chú: {confirmation.shippingAddress.deliveryNote}
            </p>
          )}
        </section>

        <section
          className="checkout-card"
          aria-labelledby="success-items-title"
          style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '24px' }}
        >
          <h2 id="success-items-title" className="text-lg font-bold text-slate-800 mb-3">
            Sách đã mua
          </h2>
          <div className="success-items">
            {confirmation.items.map((item) => (
              <article key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{item.productName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.variantName} · SKU {item.sku} · Số lượng {item.quantity}
                  </p>
                </div>
                <strong className="text-sm font-bold text-[#0080c8]">{formatPrice(item.subtotal)}</strong>
              </article>
            ))}
          </div>
        </section>

        <aside
          className="checkout-card success-total-card"
          aria-labelledby="success-total-title"
          style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '24px' }}
        >
          <h2 id="success-total-title" className="text-lg font-bold text-slate-800 mb-4">
            Tổng thanh toán
          </h2>
          <dl className="checkout-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <dt className="text-slate-500">Tạm tính</dt>
              <dd className="font-semibold text-slate-800">{formatPrice(confirmation.subtotal)}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <dt className="text-slate-500">Phí vận chuyển</dt>
              <dd className="font-semibold text-emerald-600">
                {confirmation.shippingFee === 0
                  ? 'Miễn phí'
                  : formatPrice(confirmation.shippingFee)}
              </dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <dt className="text-slate-500">Giảm giá</dt>
              <dd className="font-semibold text-slate-700">{formatPrice(confirmation.discount)}</dd>
            </div>
            <div
              className="summary-total"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '16px',
                marginTop: '8px',
              }}
            >
              <dt className="text-base font-bold text-slate-900">Tổng cộng</dt>
              <dd className="text-lg font-bold text-[#0080c8]">{formatPrice(confirmation.grandTotal)}</dd>
            </div>
          </dl>
          <div className="success-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <Link
              href={`/tai-khoan/don-hang/${confirmation.orderNumber}`}
              style={{
                borderRadius: '8px',
                width: '100%',
                height: '42px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              className="border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#0080c8] hover:text-[#0080c8] hover:bg-slate-50"
            >
              Xem đơn hàng
            </Link>
            <Link
              href="/san-pham"
              style={{
                borderRadius: '8px',
                width: '100%',
                height: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              className="bg-[#0080c8] text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98]"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}