import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddToCartButton } from './add-to-cart-button';

const mocks = vi.hoisted(
  (): {
    push: ReturnType<typeof vi.fn>;
    addItem: ReturnType<typeof vi.fn>;
    status: 'ready' | 'guest';
  } => ({
    push: vi.fn(),
    addItem: vi.fn(),
    status: 'ready',
  }),
);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('./cart-provider', () => ({
  useCart: () => ({ addItem: mocks.addItem, status: mocks.status }),
}));

describe('AddToCartButton', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.status = 'ready';
    mocks.addItem.mockResolvedValue(undefined);
  });

  it('prevents duplicate clicks while adding', async () => {
    let resolve: () => void = () => undefined;
    mocks.addItem.mockReturnValue(new Promise<void>((done) => (resolve = done)));
    render(
      <AddToCartButton
        variantId="11"
        productName="Clean Code"
        productSlug="clean-code"
        availableQuantity={4}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }));
    expect(screen.getByRole('button', { name: 'Đang thêm…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Đang thêm…' }));
    expect(mocks.addItem).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' })).toBeEnabled(),
    );
  });

  it('sends a guest to login with a safe return URL', () => {
    mocks.status = 'guest';
    render(
      <AddToCartButton
        variantId="11"
        productName="Clean Code"
        productSlug="clean-code"
        availableQuantity={4}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ hàng' }));
    expect(mocks.push).toHaveBeenCalledWith('/dang-nhap?returnUrl=%2Fsach%2Fclean-code');
  });
});
