import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminShell } from './admin-shell';

const mocks = vi.hoisted(() => ({
  pathname: '/admin/dashboard',
  replace: vi.fn(),
  bootstrap: vi.fn(),
  logout: vi.fn(),
  role: 'ADMIN',
}));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('../../services/auth-client', () => ({
  bootstrapSession: mocks.bootstrap,
  getCurrentRole: () => mocks.role,
  getCurrentUserLabel: () => 'Demo User',
  logout: mocks.logout,
  subscribeAuth: () => () => undefined,
}));

describe('M7.4E Admin shell', () => {
  afterEach(cleanup);
  beforeEach(() => {
    mocks.pathname = '/admin/dashboard';
    mocks.role = 'ADMIN';
    mocks.bootstrap.mockReset().mockResolvedValue(true);
    mocks.logout.mockReset().mockResolvedValue(undefined);
    mocks.replace.mockReset();
  });

  it('shows all approved navigation in order, active state and Admin label', async () => {
    render(
      <AdminShell>
        <p>Dashboard content</p>
      </AdminShell>,
    );
    expect(await screen.findByText('Dashboard content')).toBeInTheDocument();
    const links = screen.getAllByRole('link').filter((link) => link.closest('nav'));
    expect(links.slice(0, 6).map((link) => link.textContent)).toEqual([
      'Tổng quan',
      'Doanh thu',
      'Thống kê sản phẩm',
      'Đơn hàng',
      'Sản phẩm',
      'Tồn kho',
    ]);
    expect(screen.getAllByRole('link', { name: 'Tổng quan' })[0]).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getAllByText('Quản trị viên').length).toBeGreaterThan(0);
  });

  it('shows Staff read-only mode and logs out safely', async () => {
    mocks.role = 'STAFF';
    render(
      <AdminShell>
        <p>Staff content</p>
      </AdminShell>,
    );
    expect(await screen.findByText('Staff content')).toBeInTheDocument();
    expect(screen.getAllByText('Nhân viên · chỉ đọc').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/admin/login'));
  });

  it('does not wrap the privileged login page', () => {
    mocks.pathname = '/admin/login';
    render(
      <AdminShell>
        <p>Login form</p>
      </AdminShell>,
    );
    expect(screen.getByText('Login form')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Điều hướng quản trị' }),
    ).not.toBeInTheDocument();
  });

  it('denies anonymous operational routes before rendering protected children', async () => {
    mocks.bootstrap.mockResolvedValue(false);
    render(
      <AdminShell>
        <p>Protected catalog data</p>
      </AdminShell>,
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('Protected catalog data')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  });

  it('denies authenticated customers and keeps Admin shell hidden', async () => {
    mocks.role = 'CUSTOMER';
    mocks.bootstrap.mockResolvedValue(true);
    render(
      <AdminShell>
        <p>Protected dashboard data</p>
      </AdminShell>,
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('Protected dashboard data')).not.toBeInTheDocument();
    expect(screen.getByText('Bạn không có quyền truy cập khu vực quản trị.')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Điều hướng quản trị' }),
    ).not.toBeInTheDocument();
  });

  it('denies customers on an unknown Admin path before rendering not-found content', async () => {
    mocks.pathname = '/admin/khong-ton-tai';
    mocks.role = 'CUSTOMER';
    mocks.bootstrap.mockResolvedValue(true);
    render(
      <AdminShell>
        <p>Unknown Admin route content</p>
      </AdminShell>,
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(screen.queryByText('Unknown Admin route content')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Điều hướng quản trị' }),
    ).not.toBeInTheDocument();
  });
});
