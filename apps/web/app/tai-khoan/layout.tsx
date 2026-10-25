import { AccountShell } from '../../features/account/account-shell';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Tài khoản',
  description: 'Khu vực tài khoản khách hàng RoSach.',
  canonicalPath: '/tai-khoan',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid account SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
