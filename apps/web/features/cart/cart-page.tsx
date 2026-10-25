'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { formatPrice } from '../../services/catalog-client';
import { ProductImage } from '../catalog/product-image';
import { ConfirmationDialog } from './confirmation-dialog';
import { useCart, type EnrichedCartItem } from './cart-provider';

function CartSkeleton() {
  return (
    <main className="cart-page" aria-busy="true" aria-label="Đang tải giỏ hàng">
      <div className="cart-heading skeleton-heading" />
      <div className="cart-layout">
        <div className="cart-items">
          {[1, 2].map((item) => (
            <div className="cart-item skeleton-card" key={item}>
              <div className="skeleton skeleton-cover" />
              <div className="skeleton-lines">
                <span className="skeleton" />
                <span className="skeleton short" />
                <span className="skeleton" />
              </div>
            </div>
          ))}
        </div>
        <div className="order-summary skeleton-card" />
      </div>
    </main>
  );
}

function QuantityControl({ item }: { item: EnrichedCartItem }) {
  const { pendingItemIds, updateQuantity } = useCart();
  const pending = pendingItemIds.has(item.id);
  return (
    <div
      className="quantity-control"
      aria-label={`Số lượng ${item.productName}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <button
        type="button"
        disabled={pending || item.quantity <= 1}
        onClick={() => void updateQuantity(item.id, item.quantity - 1)}
        aria-label={`Giảm số lượng ${item.productName}`}
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: pending || item.quantity <= 1 ? 'not-allowed' : 'pointer',
          color: '#475569',
          fontWeight: 600,
        }}
      >
        −
      </button>
      <output
        aria-live="polite"
        aria-label={`${item.quantity} cuốn`}
        style={{
          minWidth: '32px',
          textAlign: 'center',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0f172a',
        }}
      >
        {item.quantity}
      </output>
      <button
        type="button"
        disabled={pending || item.quantity >= item.availableQuantity}
        onClick={() => void updateQuantity(item.id, item.quantity + 1)}
        aria-label={`Tăng số lượng ${item.productName}`}
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: pending || item.quantity >= item.availableQuantity ? 'not-allowed' : 'pointer',
          color: '#475569',
          fontWeight: 600,
        }}
      >
        +
      </button>
    </div>
  );
}

function CartItem({
  item,
  onRequestRemove,
}: {
  item: EnrichedCartItem;
  onRequestRemove: () => void;
}) {
  const { pendingItemIds } = useCart();
  return (
    <article
      className="cart-item"
      aria-busy={pendingItemIds.has(item.id)}
      style={{
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        background: '#fff',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <Link className="cart-item-cover product-image" href={`/sach/${item.productSlug}`}>
        <ProductImage
          src={item.metadata?.coverUrl}
          alt={item.metadata?.coverAlt ?? item.productName}
        />
      </Link>
      <div className="cart-item-info">
        <div>
          <Link
            className="cart-item-title font-bold text-slate-800 transition hover:text-[#0080c8]"
            href={`/sach/${item.productSlug}`}
          >
            {item.productName}
          </Link>
          <p className="text-xs text-slate-500 mt-1">{item.metadata?.authors ?? 'Đang cập nhật tác giả'}</p>
          <p className="cart-item-sku text-xs text-slate-400">SKU: {item.sku}</p>
        </div>
        <p className={item.availableQuantity > 0 ? 'stock-text text-xs font-medium text-emerald-600' : 'stock-text out text-xs font-medium text-rose-500'}>
          {item.availableQuantity > 0
            ? item.availableQuantity <= 5
              ? `Chỉ còn ${item.availableQuantity} cuốn`
              : 'Còn hàng'
            : 'Tạm hết hàng'}
        </p>
        <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <QuantityControl item={item} />
          <button
            type="button"
            onClick={onRequestRemove}
            style={{
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#fff',
              border: '1px solid #fecdd3',
              color: '#e11d48',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="hover:bg-rose-50 hover:border-rose-300"
          >
            Xóa
          </button>
        </div>
      </div>
      <div className="cart-item-price" style={{ textAlign: 'right' }}>
        <strong className="text-base font-bold text-[#0080c8] block">{formatPrice(item.subtotal)}</strong>
        <span className="text-xs text-slate-400 block mt-0.5">{formatPrice(item.unitPrice)} / cuốn</span>
      </div>
    </article>
  );
}

export function CartPage() {
  const { cart, status, clearCart, refreshCart, removeItem } = useCart();
  const [removeTarget, setRemoveTarget] = useState<EnrichedCartItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const closeRemove = useCallback(() => setRemoveTarget(null), []);
  const closeClear = useCallback(() => setConfirmClear(false), []);

  if (status === 'loading') return <CartSkeleton />;
  if (status === 'guest')
    return (
      <main className="cart-message-page">
        <div className="empty-cart-visual" aria-hidden="true">
          <ProductImage src={null} alt="Giỏ hàng" />
        </div>
        <p className="eyebrow">Giỏ hàng của bạn</p>
        <h1 className="text-xl font-bold text-slate-800">Đăng nhập để xem những cuốn sách bạn đã chọn</h1>
        <p className="text-sm text-slate-500">Giỏ hàng được lưu theo tài khoản để bạn có thể tiếp tục mua sắm trên mọi phiên</p>
        <div className="cart-message-actions">
          <Link className="button-link" href="/dang-nhap?returnUrl=%2Fgio-hang">
            Đăng nhập
          </Link>
          <Link className="secondary-link" href="/san-pham">
            Tiếp tục mua sắm
          </Link>
        </div>
      </main>
    );
  if (status === 'error')
    return (
      <main className="cart-message-page">
        <p className="eyebrow">Giỏ hàng</p>
        <h1 className="text-xl font-bold text-slate-800">Chưa thể tải giỏ hàng</h1>
        <p className="text-sm text-slate-500">Kết nối đang gián đoạn. Dữ liệu của bạn vẫn được giữ nguyên</p>
        <button className="button-link" type="button" onClick={() => void refreshCart()}>
          Thử lại
        </button>
      </main>
    );
  if (!cart?.items.length)
    return (
      <main className="cart-message-page">
        <div className="empty-cart-visual" aria-hidden="true">
          <ProductImage src={null} alt="Giỏ hàng trống" />
        </div>
        <p className="eyebrow">Giỏ hàng của bạn</p>
        <h1 className="text-xl font-bold text-slate-800">Giỏ hàng đang chờ cuốn sách đầu tiên</h1>
        <p className="text-sm text-slate-500">Khám phá những đầu sách được HKT Store tuyển chọn và bắt đầu tủ sách của riêng bạn</p>
        <Link className="button-link" href="/san-pham">
          Tiếp tục mua sắm
        </Link>
      </main>
    );

  return (
    <main className="cart-page">
      <header className="cart-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <p className="eyebrow text-xs font-semibold tracking-wider text-[#0080c8] uppercase">Giỏ hàng của bạn</p>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">{cart.totalQuantity} cuốn sách đang chờ</h2>
        </div>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          style={{
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            background: '#fff',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          className="hover:bg-rose-50 hover:border-rose-300"
        >
          Xóa toàn bộ
        </button>
      </header>

      <div className="cart-layout">
        <section className="cart-items" aria-label="Sách trong giỏ hàng" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.items.map((item) => (
            <CartItem key={item.id} item={item} onRequestRemove={() => setRemoveTarget(item)} />
          ))}
          <Link
            className="continue-shopping-link text-sm font-semibold text-slate-600 transition hover:text-[#0080c8]"
            href="/san-pham"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}
          >
            <span aria-hidden="true">←</span> Tiếp tục mua sắm
          </Link>
        </section>

        <aside
          className="order-summary"
          aria-labelledby="summary-title"
          style={{
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            background: '#fff',
          }}
        >
          <h2 id="summary-title" className="text-lg font-bold text-slate-800 mb-4">
            Tóm tắt đơn hàng
          </h2>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <dt className="text-slate-500">Tổng số lượng</dt>
              <dd className="font-semibold text-slate-700">{cart.totalQuantity} cuốn</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <dt className="text-slate-500">Tạm tính</dt>
              <dd className="font-semibold text-slate-800">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="future-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <dt className="text-slate-500">Phí vận chuyển</dt>
              <dd className="font-semibold text-emerald-600">Miễn phí</dd>
            </div>
            <div className="future-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <dt className="text-slate-500">Mã giảm giá</dt>
              <dd className="text-slate-400">Sắp có</dd>
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
              <dt className="text-base font-bold text-slate-900">Tổng cộng dự kiến</dt>
              <dd className="text-lg font-bold text-[#0080c8]">{formatPrice(cart.subtotal)}</dd>
            </div>
          </dl>

          <Link
            href="/thanh-toan"
            style={{
              borderRadius: '8px',
              width: '100%',
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '20px',
              textDecoration: 'none',
            }}
            className="bg-[#0080c8] px-6 text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98]"
          >
            Thanh toán
          </Link>
          <p className="text-xs text-slate-400 text-center mt-3">Giá và tồn kho sẽ được xác nhận lại khi thanh toán</p>
        </aside>
      </div>

      {removeTarget && (
        <ConfirmationDialog
          title="Xóa sách khỏi giỏ hàng?"
          description={`“${removeTarget.productName}” sẽ được xóa khỏi giỏ hàng của bạn`}
          confirmLabel="Xóa sách"
          onCancel={closeRemove}
          onConfirm={() => {
            void removeItem(removeTarget.id);
            closeRemove();
          }}
        />
      )}
      {confirmClear && (
        <ConfirmationDialog
          title="Xóa toàn bộ giỏ hàng?"
          description="Tất cả sách đã chọn sẽ bị xóa. Hành động này không thể hoàn tác"
          confirmLabel="Xóa toàn bộ"
          onCancel={closeClear}
          onConfirm={() => {
            void clearCart();
            closeClear();
          }}
        />
      )}
    </main>
  );
}