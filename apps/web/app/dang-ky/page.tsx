'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthForm, AuthFormError, Field, formText } from '../../features/auth/auth-form';
import { authenticate, AuthApiError } from '../../services/auth-client';

export default function Page() {
  const router = useRouter();
  return (
    <AuthForm
      title="Đăng ký"
      submitLabel="Tạo tài khoản"
      handleSubmit={async (f) => {
        const password = formText(f, 'password');
        const fullName = formText(f, 'fullName').trim();
        const email = formText(f, 'email').trim().toLowerCase();
        if (!fullName) {
          throw new AuthFormError('Vui lòng nhập họ tên.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new AuthFormError('Email không hợp lệ.');
        }
        if (!/[A-Za-z]/u.test(password) || !/\d/u.test(password) || password.length < 8) {
          throw new AuthFormError('Mật khẩu cần ít nhất 8 ký tự, có chữ và số');
        }
        if (password !== formText(f, 'confirmPassword')) {
          throw new AuthFormError('Xác nhận mật khẩu không khớp');
        }
        await authenticate('/auth/register', {
          fullName,
          email,
          phone: formText(f, 'phone'),
          password,
        });
        router.replace('/tai-khoan');
      }}
      getErrorMessage={(error) => {
        if (!(error instanceof AuthApiError)) return 'Không thể đăng ký. Vui lòng thử lại';
        const messages: Record<string, string> = {
          RATE_LIMITED: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau',
          AUTH_USERNAME_CONFLICT: 'Tên đăng nhập được tạo từ email đã được sử dụng',
          AUTH_EMAIL_CONFLICT: 'Email đã được sử dụng.',
          AUTH_PHONE_CONFLICT: 'Số điện thoại đã được sử dụng.',
          VALIDATION_ERROR: 'Thông tin đăng ký chưa hợp lệ. Vui lòng kiểm tra lại',
        };
        return messages[error.code] ?? 'Không thể đăng ký. Vui lòng thử lại';
      }}
    >
      <Field label="Họ tên" name="fullName" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Số điện thoại" name="phone" type="tel" autoComplete="tel" />
      <Field label="Mật khẩu" name="password" type="password" autoComplete="new-password" />
      <p className="field-help text-xs text-slate-500 mt-1">Mật khẩu 8-64 ký tự, có ít nhất một chữ và một số</p>
      <Field
        label="Xác nhận mật khẩu"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
      />
      <p className="my-3 text-sm text-slate-600">
        Đã có tài khoản?{' '}
        <Link
          href="/dang-nhap"
          className="font-medium text-[#0080c8] underline decoration-[#0080c8]/60 underline-offset-4 transition hover:text-[#006097] hover:decoration-[#006097]"
        >
          Đăng nhập
        </Link>
      </p>
    </AuthForm>
  );
}