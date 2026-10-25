import { permanentRedirect } from 'next/navigation';
import { productUrl } from '../../../services/catalog-client';

export default async function LegacyProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  permanentRedirect(productUrl(slug));
}
