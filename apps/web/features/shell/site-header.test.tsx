import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from './site-header';

const mocks = vi.hoisted(() => ({
  token: null as string | null,
  role: null as string | null,
  label: null as string | null,
  replace: vi.fn(),
  logout: vi.fn(),
  listener: null as (() => void) | null,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('../../services/auth-client', () => ({
  getAccessToken: () => mocks.token,
  getCurrentRole: () => mocks.role,
  getCurrentUserLabel: () => mocks.label,
  bootstrapSession: vi.fn(() => Promise.resolve(Boolean(mocks.token))),
  subscribeAuth: (listener: () => void) => {
    mocks.listener = listener;
    return () => undefined;
  },
  logout: () => {
    mocks.token = null;
    mocks.logout();
    return Promise.resolve();
  },
}));
vi.mock('../cart/cart-provider', () => ({
  useCart: () => ({ cart: { totalQuantity: 5 } }),
}));

describe('SiteHeader', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = null;
    mocks.role = null;
    mocks.label = null;
  });
  it('shows complete guest navigation', async () => {
    render(<SiteHeader />);
    expect(await screen.findByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument();
    for (const name of [
      'HKTStore — Trang chủ',
      'Trang chủ',
      'Danh mục',
      'Sản phẩm',
      'Khuyến mãi',
      'Đăng ký',
    ])
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Danh mục' })).toHaveAttribute('href', '/danh-muc');
    expect(screen.getByRole('link', { name: 'Giỏ hàng, 5 sản phẩm' })).toHaveAttribute(
      'href',
      '/gio-hang',
    );
    const menu = screen.getByRole('button', { name: /Menu/i });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveFocus();
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('link', { name: 'Sản phẩm' }));
    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
  it.each([
    ['ADMIN', 'Khu vực Admin'],
    ['STAFF', 'Khu vực Staff'],
  ] as const)('shows the correct %s area only', async (role, link) => {
    mocks.token = 'token';
    mocks.role = role;
    mocks.label = 'Người dùng';
    render(<SiteHeader />);
    expect(await screen.findByRole('link', { name: link })).toHaveAttribute(
      'href',
      '/admin/dashboard',
    );
    expect(screen.getByRole('link', { name: 'Người dùng' })).toHaveAttribute('href', '/tai-khoan');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    await waitFor(() => expect(mocks.logout).toHaveBeenCalled());
  });
});
