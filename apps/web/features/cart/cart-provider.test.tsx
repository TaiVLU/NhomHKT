import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from './cart-provider';

const emptyCart = { cartId: '1', items: [], totalQuantity: 0, subtotal: 0 };
const cartWithBook = {
  cartId: '1',
  items: [
    {
      id: '10',
      variantId: '11',
      productId: '2',
      sku: 'CLEAN-CODE',
      variantName: 'Bản tiêu chuẩn',
      productName: 'Clean Code',
      productSlug: 'clean-code',
      quantity: 1,
      unitPrice: 220000,
      subtotal: 220000,
      availableQuantity: 8,
    },
  ],
  totalQuantity: 1,
  subtotal: 220000,
};
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  listener: null as (() => void) | null,
}));

vi.mock('../../services/auth-client', () => ({
  getAccessToken: () => 'token',
  getCurrentRole: () => 'CUSTOMER',
  bootstrapSession: vi.fn(() => Promise.resolve(true)),
  subscribeAuth: (listener: () => void) => {
    mocks.listener = listener;
    return () => undefined;
  },
}));
vi.mock('../../services/cart-client', () => ({
  cartApi: {
    get: mocks.get,
    addItem: mocks.addItem,
    updateItem: mocks.updateItem,
    removeItem: mocks.removeItem,
    clear: mocks.clear,
  },
  getCartProductMetadata: vi.fn(() => Promise.resolve(null)),
}));

function Consumer() {
  const { cart, status, addItem } = useCart();
  return (
    <div>
      <span>{status}</span>
      <output aria-label="badge">{cart?.totalQuantity ?? 0}</output>
      <button type="button" onClick={() => void addItem('11', 'Clean Code')}>
        Add
      </button>
    </div>
  );
}

describe('CartProvider', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue(emptyCart);
    mocks.addItem.mockResolvedValue(cartWithBook);
  });

  it('loads the authenticated cart and synchronizes the total quantity after add', async () => {
    render(
      <CartProvider>
        <Consumer />
      </CartProvider>,
    );
    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument());
    expect(screen.getByLabelText('badge')).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(screen.getByLabelText('badge')).toHaveTextContent('1'));
    expect(mocks.addItem).toHaveBeenCalledWith('11', 1);
    expect(screen.getByText(/đã được thêm vào giỏ hàng/)).toHaveTextContent('Clean Code');
  });
});
