import { LoginPage } from '@/features/auth/login-page';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Đăng nhập',
  description: 'Đăng nhập tài khoản HKT Store',
  canonicalPath: '/dang-nhap',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid login SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}) {
  const value = (await searchParams).returnUrl;
  return <LoginPage returnUrl={typeof value === 'string' ? value : undefined} />;
}
