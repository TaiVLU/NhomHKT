import { CartPage } from '../../features/cart/cart-page';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Giỏ hàng',
  description: 'Xem và cập nhật những cuốn sách trong giỏ hàng HKT Store',
  canonicalPath: '/gio-hang',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid cart SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function Page() {
  return <CartPage />;
}