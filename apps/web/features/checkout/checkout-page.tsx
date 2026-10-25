'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { accountApi, type AddressDto } from '../../services/account-client';
import { getCurrentRole } from '../../services/auth-client';
import { formatPrice } from '../../services/catalog-client';
import {
  checkoutApi,
  checkoutRequestFingerprint,
  createCheckoutIdempotencyKey,
  saveCheckoutConfirmation,
  type CheckoutRequest,
  type PaymentMethod,
} from '../../services/checkout-client';
import { ProductImage } from '../catalog/product-image';
import { useCart, type EnrichedCartItem } from '../cart/cart-provider';

const deliveryNoteLimit = 500;

const addressText = (address: AddressDto): string =>
  [address.line1, address.ward, address.district, address.province].filter(Boolean).join(', ');

const normalizeNote = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length ? normalized : null;
};

const errorMessages: Record<
  string,
  { message: string; actionLabel?: string; actionHref?: string }
> = {
  CHECKOUT_PRICE_CHANGED: {
    message:
      'Giá của một hoặc nhiều sản phẩm đã thay đổi. Vui lòng kiểm tra lại giỏ hàng trước khi đặt hàng',
    actionLabel: 'Quay lại giỏ hàng',
    actionHref: '/gio-hang',
  },
  CHECKOUT_OUT_OF_STOCK: {
    message:
      'Một hoặc nhiều sản phẩm không còn đủ số lượng trong kho. Vui lòng cập nhật lại giỏ hàng',
    actionLabel: 'Kiểm tra giỏ hàng',
    actionHref: '/gio-hang',
  },
  CHECKOUT_PRODUCT_DISABLED: {
    message: 'Một sản phẩm trong giỏ hàng hiện không còn được bán',
    actionLabel: 'Kiểm tra giỏ hàng',
    actionHref: '/gio-hang',
  },
  CHECKOUT_VARIANT_DISABLED: {
    message: 'Một phiên bản sản phẩm trong giỏ hàng hiện không còn khả dụng',
    actionLabel: 'Kiểm tra giỏ hàng',
    actionHref: '/gio-hang',
  },
  CHECKOUT_CART_EMPTY: {
    message: 'Giỏ hàng của bạn đang trống',
    actionLabel: 'Tiếp tục mua sắm',
    actionHref: '/san-pham',
  },
  CHECKOUT_CART_NOT_FOUND: {
    message: 'Giỏ hàng của bạn đang trống',
    actionLabel: 'Tiếp tục mua sắm',
    actionHref: '/san-pham',
  },
  CHECKOUT_ADDRESS_NOT_FOUND: {
    message: 'Địa chỉ giao hàng không hợp lệ hoặc không còn tồn tại. Vui lòng chọn địa chỉ khác',
  },
  CHECKOUT_UNSUPPORTED_PAYMENT_METHOD: {
    message: 'Phương thức thanh toán đã chọn hiện không được hỗ trợ',
  },
  UNSUPPORTED_PAYMENT_METHOD: {
    message: 'Phương thức thanh toán đã chọn hiện không được hỗ trợ',
  },
  CHECKOUT_IDEMPOTENCY_IN_PROGRESS: {
    message: 'Đơn hàng của bạn đang được xử lý. Vui lòng chờ trong giây lát',
  },
  CHECKOUT_IDEMPOTENCY_CONFLICT: {
    message:
      'Thông tin thanh toán đã thay đổi trong lần xử lý này. Vui lòng kiểm tra lại trước khi thử lại',
  },
  CHECKOUT_CONFLICT: {
    message: 'Hệ thống đang bận xử lý đơn hàng. Vui lòng thử lại sau ít phút',
  },
  NETWORK_UNCERTAIN: {
    message:
      'Chưa thể xác nhận kết quả đặt hàng. Hệ thống sẽ kiểm tra lại bằng cùng mã xử lý để tránh tạo đơn trùng',
  },
  AUTH_UNAUTHORIZED: {
    message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để thanh toán',
    actionLabel: 'Đăng nhập',
    actionHref: '/dang-nhap?returnUrl=%2Fthanh-toan',
  },
};

function CheckoutSkeleton() {
  return (
    <main className="checkout-page" aria-busy="true" aria-label="Đang tải thanh toán">
      <div className="checkout-heading">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-copy" />
      </div>
      <div className="checkout-layout">
        <section className="checkout-main">
          <div className="checkout-card skeleton-card" />
          <div className="checkout-card skeleton-card" />
        </section>
        <aside className="checkout-summary checkout-card" />
      </div>
    </main>
  );
}

function CheckoutState({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <main className="cart-message-page">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <p className="text-sm text-slate-500">{children}</p>
      {action}
    </main>
  );
}

function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onClose,
}: {
  addresses: AddressDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose();
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input:not(:disabled)',
      ),
    ];
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
    <div className="dialog-backdrop" role="presentation">
      <div
        className="address-selector-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-selector-title"
        ref={dialogRef}
        onKeyDown={trapFocus}
        style={{ borderRadius: '16px' }}
      >
        <div className="dialog-title-row">
          <h2 id="address-selector-title" className="text-lg font-bold text-slate-800">
            Chọn địa chỉ giao hàng
          </h2>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Đóng chọn địa chỉ"
          >
            ×
          </button>
        </div>
        {addresses.length ? (
          <div className="address-options" role="list">
            {addresses.map((address) => (
              <button
                type="button"
                className="address-option"
                aria-pressed={address.id === selectedId}
                key={address.id}
                style={{ borderRadius: '10px' }}
                onClick={() => {
                  onSelect(address.id);
                  onClose();
                }}
              >
                <span>
                  <strong>{address.recipientName}</strong>
                  {address.isDefault && <em>Mặc định</em>}
                </span>
                <small>{address.phone}</small>
                <span>{addressText(address)}</span>
                {address.postalCode && <small>Mã bưu chính: {address.postalCode}</small>}
              </button>
            ))}
          </div>
        ) : (
          <div className="checkout-empty-panel">
            <h3 className="text-base font-semibold text-slate-800">Bạn chưa có địa chỉ giao hàng</h3>
            <p className="text-sm text-slate-500 mb-4">Thêm địa chỉ trong tài khoản rồi quay lại thanh toán</p>
            <Link
              className="bg-[#0080c8] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0070b0]"
              href="/tai-khoan/dia-chi"
              style={{
                borderRadius: '8px',
                height: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Thêm địa chỉ mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ShippingAddressSection({
  addresses,
  selectedAddress,
  loading,
  error,
  onRefresh,
  onOpenSelector,
}: {
  addresses: AddressDto[];
  selectedAddress: AddressDto | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onOpenSelector: () => void;
}) {
  return (
    <section className="checkout-card" aria-labelledby="shipping-title" style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '24px' }}>
      <div className="checkout-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p className="eyebrow text-xs font-semibold tracking-wider text-[#0080c8] uppercase">Giao hàng</p>
          <h2 id="shipping-title" className="text-lg font-bold text-slate-800 mt-1">
            Địa chỉ nhận hàng
          </h2>
        </div>
        {addresses.length > 0 && (
          <button
            type="button"
            onClick={onOpenSelector}
            disabled={loading}
            style={{
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: '#fff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="hover:border-[#0080c8] hover:text-[#0080c8]"
          >
            Thay đổi địa chỉ
          </button>
        )}
      </div>
      {loading ? (
        <p aria-busy="true" className="text-sm text-slate-500">Đang tải địa chỉ…</p>
      ) : error ? (
        <div className="checkout-inline-error" role="status">
          <p className="text-sm text-rose-600 mb-2">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            style={{ borderRadius: '8px', padding: '6px 14px', fontSize: '0.8125rem' }}
            className="border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Tải lại địa chỉ
          </button>
        </div>
      ) : selectedAddress ? (
        <article className="selected-address-card" aria-label="Địa chỉ đang chọn" style={{ borderRadius: '10px' }}>
          <div>
            <strong>{selectedAddress.recipientName}</strong>
            {selectedAddress.isDefault && <span>Mặc định</span>}
          </div>
          <p>{selectedAddress.phone}</p>
          <p>{addressText(selectedAddress)}</p>
          {selectedAddress.postalCode && <p>Mã bưu chính: {selectedAddress.postalCode}</p>}
        </article>
      ) : (
        <div className="checkout-empty-panel">
          <h3 className="text-base font-semibold text-slate-800">Bạn chưa có địa chỉ giao hàng</h3>
          <p className="text-sm text-slate-500 mb-4">Checkout cần một địa chỉ trong sổ địa chỉ của tài khoản</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              href="/tai-khoan/dia-chi"
              style={{
                borderRadius: '8px',
                height: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              className="bg-[#0080c8] px-5 text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98]"
            >
              Thêm địa chỉ mới
            </Link>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={onOpenSelector}
                style={{
                  borderRadius: '8px',
                  height: '40px',
                  padding: '0 16px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-slate-50"
              >
                Chọn địa chỉ
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PaymentMethodSection({
  paymentMethod,
  disabled,
  onChange,
}: {
  paymentMethod: PaymentMethod;
  disabled: boolean;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <section className="checkout-card" aria-labelledby="payment-title" style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '24px' }}>
      <fieldset className="payment-fieldset" disabled={disabled} style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend id="payment-title" className="text-lg font-bold text-slate-800 mb-4 block">
          Phương thức thanh toán
        </legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label
            className="payment-option selected"
            style={{
              borderRadius: '10px',
              border: paymentMethod === 'COD' ? '1.5px solid #0080c8' : '1px solid #e2e8f0',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              cursor: 'pointer',
              background: paymentMethod === 'COD' ? '#f0f9ff' : '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === 'COD'}
              onChange={() => onChange('COD')}
              style={{ marginTop: '3px' }}
            />
            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <strong className="text-sm font-semibold text-slate-800">Thanh toán khi nhận hàng</strong>
              <small className="text-xs text-slate-500">Bạn thanh toán cho nhân viên giao hàng khi đơn được giao đến</small>
            </span>
          </label>
          <div
            className="payment-option disabled"
            aria-disabled="true"
            style={{
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: '#f8fafc',
              opacity: 0.7,
            }}
          >
            <span aria-hidden="true" style={{ width: '13px', display: 'inline-block' }} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <strong className="text-sm font-semibold text-slate-500">VNPay</strong>
              <small className="text-xs text-slate-400">Sắp ra mắt</small>
            </span>
          </div>
        </div>
      </fieldset>
    </section>
  );
}

function DeliveryNoteField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const overLimit = value.length > deliveryNoteLimit;
  return (
    <section className="checkout-card" style={{ borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', padding: '24px' }}>
      <label
        className="delivery-note-label text-lg font-bold text-slate-800 mb-3 block"
        htmlFor="delivery-note"
        id="note-label"
      >
        Ghi chú giao hàng
      </label>
      <textarea
        id="delivery-note"
        value={value}
        maxLength={deliveryNoteLimit}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ví dụ: Gọi cho tôi trước khi giao hàng"
        aria-describedby="delivery-note-count"
        aria-invalid={overLimit}
        style={{
          borderRadius: '8px',
          width: '100%',
          minHeight: '90px',
          padding: '12px',
          border: '1px solid #cbd5e1',
          fontSize: '0.875rem',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        className="focus:border-[#0080c8] focus:ring-1 focus:ring-[#0080c8]"
      />
      <p id="delivery-note-count" className={overLimit ? 'field-error text-xs text-rose-500 mt-1' : 'field-help text-xs text-slate-400 mt-1'}>
        {value.length}/{deliveryNoteLimit} ký tự
      </p>
    </section>
  );
}

function SummaryItem({ item }: { item: EnrichedCartItem }) {
  return (
    <article className="checkout-summary-item">
      <div className="checkout-summary-cover product-image">
        <ProductImage
          src={item.metadata?.coverUrl}
          alt={item.metadata?.coverAlt ?? item.productName}
        />
      </div>
      <div>
        <h3>{item.productName}</h3>
        <p>
          {item.variantName} · SKU {item.sku}
        </p>
        <p>Số lượng: {item.quantity}</p>
      </div>
      <strong>{formatPrice(item.subtotal)}</strong>
    </article>
  );
}

function CheckoutOrderSummary({
  cart,
  disabled,
  canSubmit,
  submitLabel,
  onSubmit,
}: {
  cart: NonNullable<ReturnType<typeof useCart>['cart']>;
  disabled: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onSubmit: () => void;
}) {
  return (
    <aside
      className="checkout-summary checkout-card"
      aria-labelledby="checkout-summary-title"
      style={{
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        background: '#fff',
      }}
    >
      <div className="checkout-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p className="eyebrow text-xs font-semibold tracking-wider text-[#0080c8] uppercase">Đơn hàng</p>
          <h2 id="checkout-summary-title" className="text-lg font-bold text-slate-800 mt-1">
            Kiểm tra sách đã chọn
          </h2>
        </div>
        <Link href="/gio-hang" className="text-xs font-semibold text-slate-500 hover:text-[#0080c8]">
          Quay lại giỏ hàng
        </Link>
      </div>
      <div className="checkout-summary-list">
        {cart.items.map((item) => (
          <SummaryItem item={item} key={item.id} />
        ))}
      </div>
      <dl className="checkout-breakdown" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
          <dt className="text-slate-500">Tạm tính</dt>
          <dd className="font-semibold text-slate-800">{formatPrice(cart.subtotal)}</dd>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
          <dt className="text-slate-500">Phí vận chuyển</dt>
          <dd className="font-semibold text-emerald-600">Miễn phí</dd>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
          <dt className="text-slate-500">Giảm giá</dt>
          <dd className="font-semibold text-slate-700">{formatPrice(0)}</dd>
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
          <dd className="text-lg font-bold text-[#0080c8]">{formatPrice(cart.subtotal)}</dd>
        </div>
      </dl>
      <button
        type="button"
        disabled={disabled || !canSubmit}
        onClick={onSubmit}
        style={{
          borderRadius: '8px',
          width: '100%',
          height: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '20px',
        }}
        className="bg-[#0080c8] px-6 text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {submitLabel}
      </button>
      <p className="text-xs text-slate-400 text-center mt-3">HKT Store sẽ xác nhận lại giá và tồn kho trước khi tạo đơn</p>
    </aside>
  );
}

export function CheckoutPage() {
  const router = useRouter();
  const { cart, status, refreshCart, notify } = useCart();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<{
    code: string;
    message: string;
    actionLabel?: string;
    actionHref?: string;
  } | null>(null);
  const attemptRef = useRef<{ key: string; fingerprint: string } | null>(null);
  const selectorButtonRef = useRef<HTMLButtonElement>(null);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;
  const deliveryNoteValid = deliveryNote.length <= deliveryNoteLimit;
  const checkoutRequest = useMemo<CheckoutRequest | null>(() => {
    if (!selectedAddressId) return null;
    return {
      shippingAddressId: selectedAddressId,
      paymentMethod,
      deliveryNote: normalizeNote(deliveryNote),
    };
  }, [deliveryNote, paymentMethod, selectedAddressId]);
  const canSubmit =
    Boolean(checkoutRequest) &&
    paymentMethod === 'COD' &&
    deliveryNoteValid &&
    status === 'ready' &&
    Boolean(cart?.items.length) &&
    !addressLoading &&
    !submitting;

  const loadAddresses = useCallback(async () => {
    setAddressLoading(true);
    setAddressError('');
    try {
      const next = await accountApi.addresses();
      setAddresses(next);
      setSelectedAddressId((current) => {
        if (current && next.some((address) => address.id === current)) return current;
        return next.find((address) => address.isDefault)?.id ?? next[0]?.id ?? null;
      });
    } catch {
      setAddressError('Không thể tải địa chỉ giao hàng');
    } finally {
      setAddressLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if (status === 'guest') router.replace('/dang-nhap?returnUrl=%2Fthanh-toan');
  }, [router, status]);

  useEffect(() => {
    if (getCurrentRole() && getCurrentRole() !== 'CUSTOMER') router.replace('/');
  }, [router, status]);

  useEffect(() => {
    if (!selectorOpen) selectorButtonRef.current?.focus();
  }, [selectorOpen]);

  const submit = useCallback(async () => {
    if (!checkoutRequest || !cart?.items.length || submitting) return;
    setCheckoutError(null);
    const fingerprint = checkoutRequestFingerprint(checkoutRequest);
    if (!attemptRef.current || attemptRef.current.fingerprint !== fingerprint) {
      attemptRef.current = { key: createCheckoutIdempotencyKey(), fingerprint };
    }
    setSubmitting(true);
    try {
      const confirmation = await checkoutApi.placeOrder(checkoutRequest, attemptRef.current.key);
      saveCheckoutConfirmation(confirmation);
      attemptRef.current = null;
      await refreshCart();
      notify('Đơn hàng đã được tiếp nhận');
      router.push('/thanh-toan/thanh-cong');
    } catch (error) {
      const code =
        error instanceof Error && 'code' in error ? String(error.code) : 'CHECKOUT_REQUEST_FAILED';
      const mapped = errorMessages[code] ?? {
        message: error instanceof Error ? error.message : 'Không thể đặt hàng. Vui lòng thử lại',
      };
      setCheckoutError({ code, ...mapped });
      if (code === 'CHECKOUT_ADDRESS_NOT_FOUND') void loadAddresses();
    } finally {
      setSubmitting(false);
    }
  }, [cart?.items.length, checkoutRequest, loadAddresses, notify, refreshCart, router, submitting]);

  if (status === 'loading') return <CheckoutSkeleton />;
  if (status === 'guest')
    return (
      <CheckoutState
        eyebrow="Thanh toán"
        title="Vui lòng đăng nhập"
        action={
          <Link className="button-link" href="/dang-nhap?returnUrl=%2Fthanh-toan">
            Đăng nhập
          </Link>
        }
      >
        HKT Store cần xác nhận tài khoản trước khi tạo đơn hàng
      </CheckoutState>
    );
  if (status === 'error')
    return (
      <CheckoutState
        eyebrow="Thanh toán"
        title="Chưa thể tải giỏ hàng"
        action={
          <button className="button-link" type="button" onClick={() => void refreshCart()}>
            Thử lại
          </button>
        }
      >
        Kết nối đang gián đoạn. Vui lòng tải lại giỏ hàng trước khi thanh toán
      </CheckoutState>
    );
  if (!cart?.items.length)
    return (
      <CheckoutState
        eyebrow="Thanh toán"
        title="Giỏ hàng của bạn đang trống"
        action={
          <Link className="button-link" href="/san-pham">
            Tiếp tục mua sắm
          </Link>
        }
      >
        Hãy chọn những cuốn sách bạn yêu thích trước khi thanh toán
      </CheckoutState>
    );

  return (
    <main className="checkout-page" aria-busy={submitting}>
      <header className="checkout-heading" style={{ marginBottom: '24px' }}>
        <p className="eyebrow text-xs font-semibold tracking-wider text-[#0080c8] uppercase">Giỏ hàng → Thanh toán → Hoàn tất</p>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">Thanh toán</h2>
        <p className="text-sm text-slate-500 mt-1">Vui lòng kiểm tra địa chỉ giao hàng và thông tin đơn trước khi đặt hàng</p>
      </header>
      <div className="checkout-layout">
        <div className="checkout-main" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ShippingAddressSection
            addresses={addresses}
            selectedAddress={selectedAddress}
            loading={addressLoading}
            error={addressError}
            onRefresh={() => void loadAddresses()}
            onOpenSelector={() => setSelectorOpen(true)}
          />
          <PaymentMethodSection
            paymentMethod={paymentMethod}
            disabled={submitting}
            onChange={setPaymentMethod}
          />
          <DeliveryNoteField
            value={deliveryNote}
            disabled={submitting}
            onChange={setDeliveryNote}
          />
          {checkoutError && (
            <div className="checkout-error-box" role="alert" aria-live="assertive" style={{ borderRadius: '10px' }}>
              <strong>{checkoutError.message}</strong>
              {checkoutError.actionHref && checkoutError.actionLabel && (
                <Link href={checkoutError.actionHref}>{checkoutError.actionLabel}</Link>
              )}
            </div>
          )}
          <p className="checkout-status" aria-live="polite">
            {submitting ? 'Đang xử lý đơn hàng…' : ''}
          </p>
        </div>
        <CheckoutOrderSummary
          cart={cart}
          disabled={submitting}
          canSubmit={canSubmit}
          submitLabel={submitting ? 'Đang xử lý đơn hàng…' : 'Đặt hàng'}
          onSubmit={() => void submit()}
        />
      </div>
      {selectorOpen && (
        <AddressSelector
          addresses={addresses}
          selectedId={selectedAddressId}
          onSelect={(id) => {
            setSelectedAddressId(id);
            setCheckoutError(null);
          }}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </main>
  );
}