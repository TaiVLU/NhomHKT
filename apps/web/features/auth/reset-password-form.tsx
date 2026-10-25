'use client';
import { useRouter } from 'next/navigation';
import { AuthForm, Field, formText } from './auth-form';
import { resetPassword, verifyOtp } from '@/services/auth-client';

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  return (
    <AuthForm
      title="Đặt lại mật khẩu"
      submitLabel="Đặt lại"
      handleSubmit={async (form) => {
        const verified = await verifyOtp(email, formText(form, 'otp'));
        const token =
          verified?.data && 'resetToken' in verified.data ? String(verified.data.resetToken) : '';
        await resetPassword(token, formText(form, 'password'));
        router.push('/dang-nhap');
      }}
    >
      <Field label="OTP" name="otp" />
      <Field label="Mật khẩu mới" name="password" type="password" />
    </AuthForm>
  );
}
