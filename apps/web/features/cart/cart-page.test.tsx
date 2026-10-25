import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartPage } from './cart-page';

const mocks = vi.hoisted(() => ({
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  refreshCart: vi.fn(),
}));
vi.mock('./cart-provider', () => ({
  useCart: () => ({
    status: 'ready',
    pendingItemIds: new Set<string>(),
    updateQuantity: mocks.updateQuantity,
    removeItem: mocks.removeItem,
    clearCart: mocks.clearCart,
    refreshCart: mocks.refreshCart,
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
  }),
}));

describe('CartPage', () => {
  afterEach(cleanup);

  it('renders item detail, updates quantity, and confirms removal', () => {
    render(<CartPage />);
    expect(screen.getByRole('heading', { name: '2 cuốn sách đang chờ' })).toBeInTheDocument();
    expect(screen.getByText('Robert C. Martin')).toBeInTheDocument();
    expect(screen.getByText('SKU: CLEAN-CODE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tăng số lượng Clean Code' }));
    expect(mocks.updateQuantity).toHaveBeenCalledWith('10', 3);
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(mocks.removeItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa sách' }));
    expect(mocks.removeItem).toHaveBeenCalledWith('10');
  });
});
