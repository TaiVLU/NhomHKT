'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  authenticate,
  AuthApiError,
  bootstrapSession,
  getCurrentRole,
} from '../../services/auth-client';
import { AuthForm, Field } from './auth-form';

export function LoginPage({
  admin = false,
  returnUrl,
}: {
  admin?: boolean;
  returnUrl?: string | undefined;
}) {
  const router = useRouter();
  const [adminAccess, setAdminAccess] = useState<
    'checking' | 'available' | 'redirecting' | 'denied'
  >('available');

  useEffect(() => {
    if (!admin) return;
    let active = true;
    setAdminAccess('checking');
    void bootstrapSession().then((authenticated) => {
      if (!active) return;
      const role = getCurrentRole();
      if (authenticated && (role === 'ADMIN' || role === 'STAFF')) {
        setAdminAccess('redirecting');
        router.replace('/admin/dashboard');
      } else if (authenticated) {
        setAdminAccess('denied');
        router.replace('/');
      } else {
        setAdminAccess('available');
      }
    });
    return () => {
      active = false;
    };
  }, [admin, router]);

  if (admin && (adminAccess === 'checking' || adminAccess === 'redirecting')) {
    return (
      <main className="admin-gate" aria-busy="true">
        <p>Đang kiểm tra phiên quản trị…</p>
      </main>
    );
  }

  if (admin && adminAccess === 'denied') {
    return (
      <main className="admin-access-denied">
        <h1>Không có quyền truy cập</h1>
        <p>Bạn không có quyền truy cập khu vực quản trị.</p>
        <Link href="/">Về trang chủ</Link>
      </main>
    );
  }

  return (
    <AuthForm
      title={admin ? 'Đăng nhập quản trị' : 'Đăng nhập'}
      submitLabel="Đăng nhập"
      handleSubmit={async (form) => {
        await authenticate(admin ? '/auth/admin/login' : '/auth/login', {
          email: form.get('email'),
          password: form.get('password'),
        });
        const role = getCurrentRole();
        const safeReturnUrl =
          returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;
        router.replace(
          admin || role === 'ADMIN' || role === 'STAFF'
            ? (safeReturnUrl ?? '/admin/dashboard')
            : (safeReturnUrl ?? '/tai-khoan'),
        );
      }}
      getErrorMessage={(error) =>
        error instanceof AuthApiError && error.code === 'RATE_LIMITED'
          ? 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.'
          : error instanceof AuthApiError && error.code === 'AUTH_INVALID_CREDENTIALS'
            ? admin
              ? 'Email hoặc mật khẩu không đúng.'
              : 'Email hoặc mật khẩu không đúng.'
            : 'Không thể đăng nhập. Vui lòng thử lại.'
      }
    >
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Mật khẩu" name="password" type="password" autoComplete="current-password" />
      {!admin && (
        <p className="my-3 text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link
            href="/dang-ky"
            className="font-medium text-[#0080c8] underline decoration-[#0080c8]/60 underline-offset-4 transition hover:text-[#006097] hover:decoration-[#006097]"
          >
            Đăng ký ngay
          </Link>
        </p>
      )}
    </AuthForm>
  );
}