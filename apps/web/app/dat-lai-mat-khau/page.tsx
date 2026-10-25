import { ResetPasswordForm } from '@/features/auth/reset-password-form';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Đặt lại mật khẩu',
  description: 'Đặt lại mật khẩu tài khoản HKT Store',
  canonicalPath: '/dat-lai-mat-khau',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid reset password SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = '' } = await searchParams;
  return <ResetPasswordForm email={email} />;
}