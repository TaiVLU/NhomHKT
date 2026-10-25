import Link from 'next/link';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Không tìm thấy trang',
  description: 'Trang bạn đang tìm không tồn tại hoặc đã được cập nhật',
  canonicalPath: '/404',
  published: false,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid not-found SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function NotFoundPage() {
  return (
    <main className="empty-state">
      <h1>Không tìm thấy trang</h1>
      <p>Trang bạn đang tìm không tồn tại hoặc đã được cập nhật</p>
      <Link href="/san-pham">Khám phá sách</Link>
    </main>
  );
}
