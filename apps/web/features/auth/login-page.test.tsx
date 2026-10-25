import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError } from '../../services/auth-client';
import { LoginPage } from './login-page';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  bootstrap: vi.fn(),
  replace: vi.fn(),
  role: 'CUSTOMER',
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('../../services/auth-client', () => ({
  authenticate: mocks.authenticate,
  bootstrapSession: mocks.bootstrap,
  getCurrentRole: () => mocks.role,
  AuthApiError: class AuthApiError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

describe('Login UX', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'CUSTOMER';
    mocks.bootstrap.mockResolvedValue(false);
  });

  it('submits customer login with email and password', async () => {
    mocks.authenticate.mockResolvedValue(undefined);
    render(<LoginPage returnUrl="/tai-khoan" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@test.local' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    await screen.findByRole('button', { name: 'Đăng nhập' });
    expect(mocks.authenticate).toHaveBeenCalledWith('/auth/login', {
      email: 'customer@test.local',
      password: 'Password123',
    });
    expect(mocks.replace).toHaveBeenCalledWith('/tai-khoan');
  });

  it.each([
    ['AUTH_INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.'],
    ['RATE_LIMITED', 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.'],
  ])('maps %s', async (code, message) => {
    mocks.authenticate.mockRejectedValue(new AuthApiError(code, 'api error'));
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'customer@test.local' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('submits privileged login with a valid email', async () => {
    mocks.authenticate.mockResolvedValue(undefined);
    mocks.role = 'ADMIN';
    render(<LoginPage admin />);
    await screen.findByLabelText('Email');
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin.hktstore@gmail.com' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    await screen.findByRole('button', { name: 'Đăng nhập' });
    expect(mocks.authenticate).toHaveBeenCalledWith('/auth/admin/login', {
      email: 'admin.hktstore@gmail.com',
      password: 'Password123',
    });
  });

  it('redirects an already authenticated privileged user away from the login form', async () => {
    mocks.role = 'ADMIN';
    mocks.bootstrap.mockResolvedValue(true);
    render(<LoginPage admin />);
    await screen.findByText('Đang kiểm tra phiên quản trị…');
    expect(mocks.replace).toHaveBeenCalledWith('/admin/dashboard');
    expect(screen.queryByRole('heading', { name: 'Đăng nhập quản trị' })).not.toBeInTheDocument();
  });
});