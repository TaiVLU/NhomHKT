import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';
import { AdminShell } from '../../features/admin/admin-shell';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Admin RoSach',
  description: 'Khu vực quản trị nội bộ của HKT Store',
  canonicalPath: '/admin',
  published: true,
  indexable: false,
  follow: false,
  noarchive: true,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid admin SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
