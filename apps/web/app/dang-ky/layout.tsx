import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Đăng ký',
  description: 'Tạo tài khoản thành thành viên của HKT Store',
  canonicalPath: '/dang-ky',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid register SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
