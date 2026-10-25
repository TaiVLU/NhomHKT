import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutPage } from './checkout-page';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  role: 'CUSTOMER',
  refreshCart: vi.fn(),
  notify: vi.fn(),
  addresses: vi.fn(),
  placeOrder: vi.fn(),
  saveConfirmation: vi.fn(),
  key: 'checkout-key-1',
  cart: {
    cartId: '1',
    totalQuantity: 2,
    subtotal: 440000,
    items: [
      {
        id: '10',
        variantId: '11',
        productId: '2',
        sku: 'CLEAN-CODE',
        variantName: 'Bản tiêu chuẩn',
        productName: 'Clean Code',
        productSlug: 'clean-code',
        quantity: 2,
        unitPrice: 220000,
        subtotal: 440000,
        availableQuantity: 3,
        metadata: { coverUrl: null, coverAlt: 'Clean Code', authors: 'Robert C. Martin' },
      },
    ],
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('../../services/auth-client', () => ({
  getCurrentRole: () => mocks.role,
}));
vi.mock('../../services/account-client', () => ({
  accountApi: { addresses: mocks.addresses },
}));
vi.mock('../../services/checkout-client', () => ({
  checkoutApi: { placeOrder: mocks.placeOrder },
  checkoutRequestFingerprint: (request: object) => JSON.stringify(request),
  createCheckoutIdempotencyKey: () => mocks.key,
  saveCheckoutConfirmation: mocks.saveConfirmation,
}));
vi.mock('../cart/cart-provider', () => ({
  useCart: () => ({
    cart: mocks.cart,
    status: 'ready',
    refreshCart: mocks.refreshCart,
    notify: mocks.notify,
  }),
}));

const address = {
  id: '2',
  recipientName: 'Customer',
  phone: '+84901111111',
  line1: '1 Main',
  ward: 'W',
  district: 'D',
  province: 'P',
  postalCode: '700000',
  isDefault: true,
  createdAt: 'x',
  updatedAt: 'x',
};

const confirmation = {
  orderNumber: 'RS20260719120000ABC123',
  orderStatus: 'PENDING_CONFIRMATION',
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  shippingAddress: {
    recipientName: 'Customer',
    phone: '+84901111111',
    line1: '1 Main',
    ward: 'W',
    district: 'D',
    province: 'P',
    postalCode: '700000',
    deliveryNote: 'Call me',
  },
  items: [
    {
      id: '1',
      variantId: '11',
      productId: '2',
      sku: 'CLEAN-CODE',
      productName: 'Clean Code',
      productSlug: 'clean-code',
      variantName: 'Bản tiêu chuẩn',
      quantity: 2,
      unitPrice: 220000,
      subtotal: 440000,
    },
  ],
  totalQuantity: 2,
  subtotal: 440000,
  shippingFee: 0,
  discount: 0,
  grandTotal: 440000,
  createdAt: '2026-07-19T10:00:00.000Z',
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'CUSTOMER';
    mocks.key = 'checkout-key-1';
    mocks.addresses.mockResolvedValue([
      address,
      { ...address, id: '3', recipientName: 'Second', isDefault: false },
    ]);
    mocks.placeOrder.mockResolvedValue(confirmation);
    mocks.refreshCart.mockResolvedValue(undefined);
  });
  afterEach(cleanup);

  it('renders cart, selected address, COD payment, and totals', async () => {
    render(<CheckoutPage />);
    expect(screen.getByRole('heading', { name: 'Thanh toán' })).toBeInTheDocument();
    expect(await screen.findByText('Customer')).toBeInTheDocument();
    expect(screen.getByText(/1 Main, W, D, P/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Thanh toán khi nhận hàng/i })).toBeChecked();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getAllByText(/440.000/).length).toBeGreaterThan(0);
  });

  it('selects another address from the accessible dialog', async () => {
    render(<CheckoutPage />);
    await screen.findByText('Customer');
    fireEvent.click(screen.getByRole('button', { name: 'Thay đổi địa chỉ' }));
    expect(screen.getByRole('dialog', { name: 'Chọn địa chỉ giao hàng' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Second/ }));
    expect(await screen.findByText('Second')).toBeInTheDocument();
  });

  it('handles no-address and address loading failure states', async () => {
    mocks.addresses.mockResolvedValueOnce([]);
    const { unmount } = render(<CheckoutPage />);
    expect(await screen.findByText('Bạn chưa có địa chỉ giao hàng.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Thêm địa chỉ mới' })).toHaveAttribute(
      'href',
      '/tai-khoan/dia-chi',
    );
    unmount();
    mocks.addresses.mockRejectedValueOnce(new Error('failed'));
    render(<CheckoutPage />);
    expect(await screen.findByText('Không thể tải địa chỉ giao hàng.')).toBeInTheDocument();
  });

  it('normalizes delivery note, sends Idempotency-Key, clears cart state, and navigates', async () => {
    render(<CheckoutPage />);
    await screen.findByText('Customer');
    fireEvent.change(screen.getByLabelText('Ghi chú giao hàng'), {
      target: { value: '  Call me  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }));
    await waitFor(() =>
      expect(mocks.placeOrder).toHaveBeenCalledWith(
        { shippingAddressId: '2', paymentMethod: 'COD', deliveryNote: 'Call me' },
        'checkout-key-1',
      ),
    );
    expect(mocks.saveConfirmation).toHaveBeenCalledWith(confirmation);
    expect(mocks.refreshCart).toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/thanh-toan/thanh-cong');
  });

  it('prevents double-click duplicate requests while submitting', async () => {
    let resolveOrder: (value: typeof confirmation) => void = () => undefined;
    mocks.placeOrder.mockReturnValueOnce(new Promise((resolve) => (resolveOrder = resolve)));
    render(<CheckoutPage />);
    await screen.findByText('Customer');
    const button = screen.getByRole('button', { name: 'Đặt hàng' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Đang xử lý đơn hàng…' })).toBeDisabled();
    resolveOrder(confirmation);
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
  });

  it('reuses the same key for uncertain retry and creates a new key after material input change', async () => {
    mocks.placeOrder.mockRejectedValueOnce(
      Object.assign(new Error('network'), { code: 'NETWORK_UNCERTAIN' }),
    );
    render(<CheckoutPage />);
    await screen.findByText('Customer');
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }));
    expect(await screen.findByText(/Chưa thể xác nhận kết quả đặt hàng/)).toBeInTheDocument();
    mocks.placeOrder.mockResolvedValueOnce(confirmation);
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }));
    await waitFor(() =>
      expect(mocks.placeOrder).toHaveBeenLastCalledWith(expect.any(Object), 'checkout-key-1'),
    );

    cleanup();
    mocks.key = 'checkout-key-2';
    mocks.placeOrder.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { code: 'CHECKOUT_IDEMPOTENCY_CONFLICT' }),
    );
    render(<CheckoutPage />);
    await screen.findByText('Customer');
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }));
    expect(await screen.findByText(/Thông tin thanh toán đã thay đổi/)).toBeInTheDocument();
    mocks.key = 'checkout-key-3';
    fireEvent.change(screen.getByLabelText('Ghi chú giao hàng'), { target: { value: 'new note' } });
    mocks.placeOrder.mockResolvedValueOnce(confirmation);
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }));
    await waitFor(() =>
      expect(mocks.placeOrder).toHaveBeenLastCalledWith(expect.any(Object), 'checkout-key-3'),
    );
  });

  it.each([
    ['CHECKOUT_PRICE_CHANGED', /Giá của một hoặc nhiều sản phẩm/],
    ['CHECKOUT_OUT_OF_STOCK', /không còn đủ số lượng/],
    ['CHECKOUT_PRODUCT_DISABLED', /không còn được bán/],
    ['CHECKOUT_VARIANT_DISABLED', /không còn khả dụng/],
    ['CHECKOUT_CART_EMPTY', /Giỏ hàng của bạn đang trống/],
    ['CHECKOUT_ADDRESS_NOT_FOUND', /Địa chỉ giao hàng không hợp lệ/],
    [
      'CHECKOUT_UNSUPPORTED_PAYMENT_METHOD',
      /Phương thức thanh toán đã chọn hiện không được hỗ trợ/,
    ],
    ['CHECKOUT_IDEMPOTENCY_IN_PROGRESS', /đang được xử lý/],
    ['CHECKOUT_IDEMPOTENCY_CONFLICT', /Thông tin thanh toán đã thay đổi/],
    ['CHECKOUT_CONFLICT', /Hệ thống đang bận/],
    ['AUTH_UNAUTHORIZED', /Phiên đăng nhập đã hết hạn/],
  ])('maps %s to a customer-safe message', async (code, message) => {
    mocks.placeOrder.mockRejectedValueOnce(Object.assign(new Error(code), { code }));
    render(<CheckoutPage />);
    await screen.findByText('Customer');
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});
