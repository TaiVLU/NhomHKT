'use client';
import { useRouter } from 'next/navigation';
import { AuthForm, Field, formText } from '@/features/auth/auth-form';
import { forgotPassword } from '@/services/auth-client';
export default function Page() {
  const router = useRouter();
  return (
    <AuthForm
      title="Quên mật khẩu"
      submitLabel="Gửi OTP"
      handleSubmit={async (f) => {
        const email = formText(f, 'email');
        await forgotPassword(email);
        router.push(`/dat-lai-mat-khau?email=${encodeURIComponent(email)}`);
      }}
    >
      <Field label="Email" name="email" type="email" />
    </AuthForm>
  );
}
