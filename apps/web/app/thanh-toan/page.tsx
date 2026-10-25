import { CheckoutPage } from '../../features/checkout/checkout-page';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Thanh toán',
  description: 'Hoàn tất đơn hàng HKT Store',
  canonicalPath: '/thanh-toan',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid checkout SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function Page() {
  return <CheckoutPage />;
}
