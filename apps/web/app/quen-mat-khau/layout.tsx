import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Quên mật khẩu',
  description: 'Khôi phục quyền truy cập tài khoản HKT Store',
  canonicalPath: '/quen-mat-khau',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid forgot password SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
