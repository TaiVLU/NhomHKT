'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ordersApi, type OrderDetail } from '../../services/orders-client';
import { formatOrderDate, money, statusLabel } from './order-format';

function StatusBadge({ value }: { value: string }) {
  return <span className="order-status-badge">{statusLabel(value)}</span>;
}

export function OrderDetailPage({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void ordersApi
      .detail(orderNumber)
      .then((result) => {
        if (cancelled) return;
        setOrder(result);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus(
          error instanceof Error && 'code' in error && error.code === 'ORDER_NOT_FOUND'
            ? 'not-found'
            : 'error',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (status === 'loading')
    return (
      <section className="orders-panel" aria-busy="true">
        <div className="skeleton skeleton-title" />
        <div className="order-card skeleton-card" />
      </section>
    );

  if (status === 'not-found')
    return (
      <section className="orders-empty" role="alert">
        <h1>Không tìm thấy đơn hàng</h1>
        <p>Đơn hàng không tồn tại hoặc không thuộc tài khoản hiện tại.</p>
        <Link className="button-link" href="/tai-khoan/don-hang">
          Về danh sách đơn hàng
        </Link>
      </section>
    );

  if (status === 'error' || !order)
    return (
      <section className="orders-empty" role="alert">
        <h1>Chưa thể tải chi tiết đơn hàng</h1>
        <p>Vui lòng thử lại sau ít phút.</p>
      </section>
    );

  const address = order.shippingAddress;
  return (
    <article className="order-detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/tai-khoan/don-hang">Đơn hàng</Link>
        <span>/</span>
        <span>{order.orderNumber}</span>
      </nav>
      <header className="orders-heading">
        <div>
          <p className="eyebrow">Chi tiết đơn hàng</p>
          <h1>{order.orderNumber}</h1>
          <p>Đặt lúc {formatOrderDate(order.createdAt)}</p>
        </div>
        <StatusBadge value={order.orderStatus} />
      </header>

      <div className="order-detail-grid">
        <section className="order-card" aria-labelledby="order-shipping-title">
          <h2 id="order-shipping-title">Thông tin giao hàng</h2>
          <p>
            <strong>{address.recipientName}</strong> · {address.phone}
          </p>
          <p>
            {address.line1}, {address.ward}, {address.district}, {address.province}
          </p>
          {address.postalCode && <p>Mã bưu chính: {address.postalCode}</p>}
          {address.deliveryNote && <p>Ghi chú: {address.deliveryNote}</p>}
        </section>

        <section className="order-card" aria-labelledby="order-payment-title">
          <h2 id="order-payment-title">Thanh toán</h2>
          <dl className="order-card-meta">
            <div>
              <dt>Phương thức</dt>
              <dd>{statusLabel(order.paymentMethod)}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{statusLabel(order.paymentStatus)}</dd>
            </div>
          </dl>
        </section>

        <section className="order-card order-timeline" aria-labelledby="order-timeline-title">
          <h2 id="order-timeline-title">Tiến trình đơn hàng</h2>
          <ol className="order-timeline-list">
            {order.statusHistory.map((event) => (
              <li key={`${event.status}-${event.createdAt}`}>
                <StatusBadge value={event.status} />
                <span>{formatOrderDate(event.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="order-card" aria-labelledby="order-items-title">
        <h2 id="order-items-title">Sách đã mua</h2>
        <div className="order-items-list">
          {order.items.map((item) => (
            <article className="order-item-row" key={item.id}>
              <div>
                <h3>{item.productName}</h3>
                <p>
                  {item.variantName} · SKU {item.sku}
                </p>
                <p>Số lượng: {item.quantity}</p>
              </div>
              <div>
                <span>{money(item.unitPrice)}</span>
                <strong>{money(item.subtotal)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="order-card order-total-card" aria-labelledby="order-total-title">
        <h2 id="order-total-title">Tổng thanh toán</h2>
        <dl className="checkout-breakdown">
          <div>
            <dt>Tạm tính</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          <div>
            <dt>Phí vận chuyển</dt>
            <dd>{order.shippingFee === 0 ? 'Miễn phí' : money(order.shippingFee)}</dd>
          </div>
          <div>
            <dt>Giảm giá</dt>
            <dd>{money(order.discount)}</dd>
          </div>
          <div className="summary-total">
            <dt>Tổng cộng</dt>
            <dd>{money(order.grandTotal)}</dd>
          </div>
        </dl>
        <div className="success-actions">
          <Link className="secondary-link" href="/tai-khoan/don-hang">
            Tất cả đơn hàng
          </Link>
          <Link className="button-link" href="/san-pham">
            Tiếp tục mua sắm
          </Link>
        </div>
      </aside>
    </article>
  );
}
