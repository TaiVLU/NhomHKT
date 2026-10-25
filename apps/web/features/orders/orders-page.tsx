'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ordersApi, type OrderSummary } from '../../services/orders-client';
import { formatOrderDate, money, statusLabel } from './order-format';

const pageSize = 6;

function OrdersLoading() {
  return (
    <section className="orders-panel" aria-busy="true" aria-label="Đang tải đơn hàng">
      <div className="skeleton skeleton-title" />
      <div className="order-card skeleton-card" />
      <div className="order-card skeleton-card" />
    </section>
  );
}

function OrderStatusBadge({ value }: { value: string }) {
  return <span className="order-status-badge">{statusLabel(value)}</span>;
}

function EmptyOrders() {
  return (
    <section className="orders-empty">
      <p className="eyebrow">Đơn hàng</p>
      <h1>Bạn chưa có đơn hàng nào</h1>
      <p>Những cuốn sách bạn đặt tại HKT Store sẽ xuất hiện tại đây</p>
      <Link className="button-link" href="/san-pham">
        Tiếp tục mua sắm
      </Link>
    </section>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  return (
    <article className="order-card">
      <div>
        <p className="eyebrow">Mã đơn hàng</p>
        <h2>{order.orderNumber}</h2>
        <p>{formatOrderDate(order.createdAt)}</p>
      </div>
      <dl className="order-card-meta">
        <div>
          <dt>Trạng thái</dt>
          <dd>
            <OrderStatusBadge value={order.orderStatus} />
          </dd>
        </div>
        <div>
          <dt>Thanh toán</dt>
          <dd>{statusLabel(order.paymentStatus)}</dd>
        </div>
        <div>
          <dt>Số lượng</dt>
          <dd>{order.itemCount} sản phẩm</dd>
        </div>
        <div>
          <dt>Tổng cộng</dt>
          <dd>{money(order.grandTotal)}</dd>
        </div>
      </dl>
      <Link className="secondary-link" href={`/tai-khoan/don-hang/${order.orderNumber}`}>
        Xem chi tiết
      </Link>
    </article>
  );
}

export function OrdersPage() {
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [meta, setMeta] = useState({ page, pageSize, total: 0 });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void ordersApi
      .list(page, pageSize)
      .then((result) => {
        if (cancelled) return;
        setOrders(result.data);
        setMeta(result.meta);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (status === 'loading') return <OrdersLoading />;
  if (status === 'error')
    return (
      <section className="orders-empty" role="alert">
        <h1>Chưa thể tải đơn hàng</h1>
        <p>Kết nối đang gián đoạn. Vui lòng thử lại sau ít phút</p>
      </section>
    );
  if (!orders.length) return <EmptyOrders />;

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  return (
    <section className="orders-panel" aria-labelledby="orders-title">
      <header className="orders-heading">
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h1 id="orders-title">Đơn hàng của tôi</h1>
          <p>Theo dõi trạng thái, thanh toán và chi tiết các đơn sách đã đặt</p>
        </div>
      </header>
      <div className="orders-list" aria-live="polite">
        {orders.map((order) => (
          <OrderCard order={order} key={order.orderNumber} />
        ))}
      </div>
      <nav className="pagination" aria-label="Phân trang đơn hàng">
        {page > 1 && (
          <Link href={`/tai-khoan/don-hang?page=${page - 1}`}>Trang trước</Link>
        )}
        <span>
          Trang {page}/{totalPages}
        </span>
        {page < totalPages && (
          <Link href={`/tai-khoan/don-hang?page=${page + 1}`}>Trang sau</Link>
        )}
      </nav>
    </section>
  );
}