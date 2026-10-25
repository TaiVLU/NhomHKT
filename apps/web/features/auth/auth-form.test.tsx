import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthForm, Field } from './auth-form';
describe('AuthForm', () => {
  afterEach(cleanup);
  it('renders labeled safe form controls', () => {
    render(
      <AuthForm title="Đăng nhập" submitLabel="Đăng nhập" handleSubmit={() => Promise.resolve()}>
        <Field label="Username" name="username" />
      </AuthForm>,
    );
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeRequired();
  });
  it('disables submit while the request is pending', async () => {
    let finish: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    render(
      <AuthForm title="Đăng nhập" submitLabel="Đăng nhập" handleSubmit={() => pending}>
        <Field label="Username" name="username" />
      </AuthForm>,
    );
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'customer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByRole('button', { name: 'Đang xử lý…' })).toBeDisabled();
    finish?.();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeEnabled());
    vi.clearAllMocks();
  });
});
