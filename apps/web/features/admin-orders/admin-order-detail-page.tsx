'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { adminOrdersApi, type AdminOrderDetail } from '../../services/admin-orders-client';
import { getCurrentRole } from '../../services/auth-client';
import { formatOrderDate, money, statusLabel } from './admin-order-format';

const actionLabels: Record<string, string> = {
  CONFIRMED: 'Xác nhận đơn',
  PACKING: 'Bắt đầu đóng gói',
  SHIPPING: 'Bàn giao vận chuyển',
  COMPLETED: 'Hoàn thành đơn',
  CANCELLED: 'Hủy đơn',
};

const actionDescriptions: Record<string, string> = {
  CONFIRMED: 'Đơn hàng sẽ chuyển sang trạng thái đã xác nhận.',
  PACKING: 'Kho bắt đầu chuẩn bị và đóng gói đơn hàng.',
  SHIPPING: 'Đơn hàng sẽ được đánh dấu đã bàn giao cho vận chuyển.',
  COMPLETED: 'Đơn COD hoàn thành sẽ được ghi nhận đã thanh toán.',
  CANCELLED: 'Đơn hàng bị hủy và toàn bộ số lượng đã mua sẽ được hoàn lại kho.',
};

function StatusBadge({ value }: { value: string }) {
  return <span className="order-status-badge">{statusLabel(value)}</span>;
}

function TransitionDialog({
  order,
  targetStatus,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  order: AdminOrderDetail;
  targetStatus: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (note?: string) => void;
}) {
  const requiresReason = targetStatus === 'CANCELLED';
  const [note, setNote] = useState('');
  const dialogRef = useRef<HTMLFormElement | null>(null);
  const canSubmit = !busy && (!requiresReason || note.trim().length >= 5);

  useEffect(() => {
    const focusable = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled])',
    );
    focusable?.focus();
  }, []);

  const trapFocus = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled])',
      ) ?? [],
    );
    if (!focusable.length) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="admin-transition-backdrop" role="presentation">
      <form
        ref={dialogRef}
        className="admin-transition-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transition-dialog-title"
        onKeyDown={trapFocus}
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (canSubmit) onSubmit(note.trim() || undefined);
        }}
      >
        <h2 id="transition-dialog-title">{actionLabels[targetStatus] ?? 'Cập nhật đơn'}</h2>
        <p>
          Đơn {order.orderNumber}: {statusLabel(order.orderStatus)} → {statusLabel(targetStatus)}
        </p>
        <p>{actionDescriptions[targetStatus]}</p>
        <label>
          {requiresReason ? 'Lý do hủy' : 'Ghi chú nội bộ'}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            required={requiresReason}
            aria-invalid={requiresReason && note.trim().length > 0 && note.trim().length < 5}
            aria-describedby={requiresReason ? 'cancel-note-help' : undefined}
          />
        </label>
        {requiresReason && (
          <p id="cancel-note-help">Nhập tối thiểu 5 ký tự. Tồn kho sẽ được hoàn lại khi hủy.</p>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="admin-transition-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>
            Đóng
          </button>
          <button type="submit" disabled={!canSubmit}>
            {busy ? 'Đang xử lý…' : 'Xác nhận'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminOrderDetailPage({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const lastTransitionTrigger = useRef<HTMLButtonElement | null>(null);

  const load = async () => {
    const result = await adminOrdersApi.detail(orderNumber);
    setOrder(result);
    setStatus('ready');
  };

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void adminOrdersApi
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

  const submitTransition = async (note?: string) => {
    if (!targetStatus || !order) return;
    setTransitioning(true);
    setTransitionError('');
    try {
      const updated = await adminOrdersApi.transition(order.orderNumber, {
        targetStatus,
        expectedCurrentStatus: order.orderStatus,
        note,
      });
      setOrder(updated);
      setTargetStatus(null);
      setAnnouncement(`Đã chuyển đơn sang ${statusLabel(updated.orderStatus)}.`);
      window.requestAnimationFrame(() => lastTransitionTrigger.current?.focus());
    } catch (error: unknown) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : '';
      const messages: Record<string, string> = {
        ORDER_TRANSITION_INVALID: 'Trạng thái chuyển không hợp lệ.',
        ORDER_STATUS_CONFLICT: 'Đơn hàng vừa được cập nhật ở phiên khác. Đang tải lại dữ liệu.',
        ORDER_CANCELLATION_REASON_REQUIRED: 'Vui lòng nhập lý do hủy đơn.',
        ORDER_INVENTORY_RESTORE_FAILED: 'Không thể hoàn kho, trạng thái đơn chưa thay đổi.',
        FORBIDDEN_PERMISSION: 'Tài khoản hiện tại không có quyền xử lý đơn.',
      };
      const message = messages[code] ?? 'Không thể cập nhật trạng thái đơn.';
      setTransitionError(message);
      if (code === 'ORDER_STATUS_CONFLICT') {
        await load();
        setTargetStatus(null);
        setAnnouncement(message);
      }
    } finally {
      setTransitioning(false);
    }
  };

  if (status === 'loading')
    return (
      <main className="admin-orders-page" aria-busy="true" aria-live="polite">
        <div className="skeleton skeleton-title" />
        <div className="order-card skeleton-card" />
      </main>
    );

  if (status === 'not-found')
    return (
      <main className="admin-orders-page">
        <section className="orders-empty" role="alert">
          <h1>Không tìm thấy đơn hàng</h1>
          <p>Đơn hàng không tồn tại hoặc không thể truy cập bằng quyền hiện tại.</p>
          <Link className="button-link" href="/admin/orders">
            Về quản lý đơn hàng
          </Link>
        </section>
      </main>
    );

  if (status === 'error' || !order)
    return (
      <main className="admin-orders-page">
        <section className="orders-empty" role="alert">
          <h1>Chưa thể tải chi tiết đơn hàng</h1>
          <p>Vui lòng thử lại sau ít phút.</p>
        </section>
      </main>
    );

  const address = order.shippingAddress;
  const canManage = getCurrentRole() === 'ADMIN';
  return (
    <main className="admin-orders-page">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin/orders">Đơn hàng</Link>
        <span>/</span>
        <span>{order.orderNumber}</span>
      </nav>
      <header className="orders-heading admin-order-detail-heading">
        <div>
          <p className="eyebrow">Chi tiết đơn hàng</p>
          <h1>{order.orderNumber}</h1>
          <p>
            Tạo lúc {formatOrderDate(order.createdAt)} · Cập nhật {formatOrderDate(order.updatedAt)}
          </p>
        </div>
        <div className="admin-order-heading-badges">
          <StatusBadge value={order.orderStatus} />
          <StatusBadge value={order.paymentStatus} />
        </div>
      </header>

      {canManage && (
        <section className="order-card admin-processing-card" aria-labelledby="processing-title">
          <h2 id="processing-title">Xử lý đơn hàng</h2>
          {order.allowedTransitions.length ? (
            <div className="admin-transition-buttons">
              {order.allowedTransitions.map((statusValue) => (
                <button
                  key={statusValue}
                  type="button"
                  onClick={(event) => {
                    setTransitionError('');
                    lastTransitionTrigger.current = event.currentTarget;
                    setTargetStatus(statusValue);
                  }}
                  disabled={transitioning}
                >
                  {actionLabels[statusValue] ?? statusLabel(statusValue)}
                </button>
              ))}
            </div>
          ) : (
            <p>Đơn hàng đã ở trạng thái cuối, không còn thao tác xử lý.</p>
          )}
          {transitionError && (
            <p className="admin-transition-page-alert" role="alert">
              {transitionError}
            </p>
          )}
        </section>
      )}

      <section className="admin-order-detail-grid" aria-label="Thông tin đơn hàng">
        <article className="order-card">
          <h2>Khách hàng</h2>
          <dl className="order-card-meta">
            <div>
              <dt>Họ tên</dt>
              <dd>{order.customer.fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{order.customer.email}</dd>
            </div>
            <div>
              <dt>Điện thoại</dt>
              <dd>{order.customer.phone}</dd>
            </div>
          </dl>
        </article>

        <article className="order-card">
          <h2>Giao hàng</h2>
          <p>
            <strong>{address.recipientName}</strong> · {address.phone}
          </p>
          <p>
            {address.line1}, {address.ward}, {address.district}, {address.province}
          </p>
          {address.postalCode && <p>Mã bưu chính: {address.postalCode}</p>}
          {address.deliveryNote && <p>Ghi chú: {address.deliveryNote}</p>}
        </article>

        <article className="order-card">
          <h2>Thanh toán</h2>
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
        </article>

        <article className="order-card">
          <h2>Timeline</h2>
          <ol className="order-timeline-list">
            {order.statusHistory.map((event) => (
              <li key={event.id}>
                <StatusBadge value={event.toStatus} />
                <span>{formatOrderDate(event.createdAt)}</span>
                {event.actorName && <strong>{event.actorName}</strong>}
                {event.actorEmail && <span>{event.actorEmail}</span>}
                {event.note && <p>{event.note}</p>}
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="order-card" aria-labelledby="admin-order-items-title">
        <h2 id="admin-order-items-title">Sản phẩm đã mua</h2>
        <div className="admin-order-items">
          {order.items.map((item) => (
            <article className="admin-order-item-row" key={item.id}>
              {item.image ? (
                <img src={item.image.url} alt={item.image.altText} />
              ) : (
                <div className="admin-order-item-fallback" aria-hidden="true">
                  HKTStore
                </div>
              )}
              <div>
                <h3>{item.productName}</h3>
                <p>
                  {item.variantName} · SKU {item.sku}
                </p>
                <p>Số lượng: {item.quantity}</p>
              </div>
              <div className="admin-order-item-price">
                <span>{money(item.unitPrice)}</span>
                <strong>{money(item.lineTotal)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="order-card order-total-card" aria-labelledby="admin-order-total-title">
        <h2 id="admin-order-total-title">Tổng thanh toán</h2>
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
          <Link className="secondary-link" href="/admin/orders">
            Quay lại danh sách
          </Link>
        </div>
      </aside>

      {targetStatus && (
        <TransitionDialog
          order={order}
          targetStatus={targetStatus}
          busy={transitioning}
          error={transitionError}
          onCancel={() => {
            setTargetStatus(null);
            window.requestAnimationFrame(() => lastTransitionTrigger.current?.focus());
          }}
          onSubmit={(note) => void submitTransition(note)}
        />
      )}
    </main>
  );
}
