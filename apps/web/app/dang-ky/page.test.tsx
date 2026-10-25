import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError } from '../../services/auth-client';
import Page from './page';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('../../services/auth-client', () => ({
  authenticate: mocks.authenticate,
  AuthApiError: class AuthApiError extends Error {
    constructor(
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

const fill = (password: string, confirmPassword: string) => {
  fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Khach hang' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'C@Test.Local' } });
  fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0901234567' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
    target: { value: confirmPassword },
  });
};

describe('Registration UX', () => {
  afterEach(cleanup);
  beforeEach(() => vi.clearAllMocks());

  it('rejects mismatched password confirmation before API submission', async () => {
    render(<Page />);
    fill('Password123', 'Mismatch123');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Xác nhận mật khẩu không khớp');
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it('submits normalized minimum identity fields without a public role', async () => {
    mocks.authenticate.mockResolvedValue(undefined);
    render(<Page />);
    fill('Password123', 'Password123');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await waitFor(() =>
      expect(mocks.authenticate).toHaveBeenCalledWith('/auth/register', {
        fullName: 'Khach hang',
        email: 'c@test.local',
        phone: '0901234567',
        password: 'Password123',
      }),
    );
  });

  it('maps RATE_LIMITED to the approved message', async () => {
    mocks.authenticate.mockRejectedValue(new AuthApiError('RATE_LIMITED', 'wait'));
    render(<Page />);
    fill('Password123', 'Password123');
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.',
    );
  });
});
