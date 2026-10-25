import { CheckoutSuccessPage } from '../../../features/checkout/checkout-success-page';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Đặt hàng thành công',
  description: 'Xác nhận đơn hàng HKT Store',
  canonicalPath: '/thanh-toan/thanh-cong',
  published: true,
  indexable: false,
  follow: false,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid checkout success SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default function Page() {
  return <CheckoutSuccessPage />;
}
