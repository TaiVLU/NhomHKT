'use client';
import { useState, type FormEvent } from 'react';
import { accountApi, AccountApiError } from '../../services/account-client';

export function PasswordForm() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = (name: string) => {
      const field = form.get(name);
      return typeof field === 'string' ? field : '';
    };
    const currentPassword = value('currentPassword');
    const newPassword = value('newPassword');
    if (newPassword !== value('confirmPassword')) {
      setMessage('Xác nhận mật khẩu không khớp.');
      return;
    }
    setBusy(true);
    try {
      await accountApi.changePassword(currentPassword, newPassword);
      formElement.reset();
      setMessage('Đã đổi mật khẩu.');
    } catch (error) {
      setMessage(
        error instanceof AccountApiError && error.code === 'PROFILE_CURRENT_PASSWORD_INVALID'
          ? 'Mật khẩu hiện tại không đúng.'
          : 'Không thể đổi mật khẩu.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="account-card form-card">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Đổi mật khẩu</h2>
      <p className="text-sm text-slate-500 mb-6">Mật khẩu 8–64 ký tự, có chữ và số.</p>
      {message && <p role="status" className="mb-4 text-sm text-slate-600 font-medium">{message}</p>}
      <form onSubmit={(event) => void submit(event)}>
        <label>
          Mật khẩu hiện tại <input name="currentPassword" type="password" required />
        </label>
        <label>
          Mật khẩu mới <input name="newPassword" type="password" required />
        </label>
        <label>
          Xác nhận mật khẩu mới <input name="confirmPassword" type="password" required />
        </label>
        <div style={{ gridColumn: '1 / -1', paddingTop: '12px' }}>
          <button
            type="submit"
            disabled={busy}
            style={{
              borderRadius: '8px',
              width: 'fit-content',
              minWidth: '140px',
              height: '42px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="bg-[#0080c8] px-6 text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Đổi mật khẩu
          </button>
        </div>
      </form>
    </section>
  );
}