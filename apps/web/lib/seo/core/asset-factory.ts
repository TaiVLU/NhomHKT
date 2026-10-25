import type { SEOConfig } from './config';
import type { NormalizedSEODescriptor, SEOAssets } from './descriptor';
import { createStructuredDataAssets, serializeStructuredData } from '../structured-data';
import { seoOk, type SEOResult } from './result';

const openGraphType = (type: NormalizedSEODescriptor['type']): 'website' | 'article' =>
  type === 'book' ? 'article' : 'website';

const openGraphImage = (descriptor: NormalizedSEODescriptor) => ({
  url: descriptor.imageUrl,
  alt: descriptor.title,
  ...(descriptor.imageUrl.endsWith('/social-preview.png') ? { width: 1200, height: 630 } : {}),
});

export const createSEOAssets = (
  descriptor: NormalizedSEODescriptor,
  config: SEOConfig,
): SEOResult<SEOAssets> => {
  const robots = {
    index: descriptor.indexable,
    follow: descriptor.follow,
    ...(descriptor.noarchive ? { noarchive: true } : {}),
  };

  const structuredData = createStructuredDataAssets(descriptor);
  if (!structuredData.ok) return structuredData;

  return seoOk(
    {
      descriptor,
      metadata: {
        title: descriptor.title,
        description: descriptor.description,
        alternates: { canonical: descriptor.canonicalUrl },
        robots,
        openGraph: {
          title: descriptor.title,
          description: descriptor.description,
          url: descriptor.canonicalUrl,
          siteName: config.siteName,
          locale: descriptor.locale,
          type: openGraphType(descriptor.type),
          images: [openGraphImage(descriptor)],
        },
        twitter: {
          card: 'summary_large_image',
          title: descriptor.title,
          description: descriptor.description,
          images: [descriptor.imageUrl],
        },
      },
      sitemapEntry: descriptor.sitemapEligible
        ? {
            url: descriptor.canonicalUrl,
            ...(descriptor.updatedAt ? { lastModified: descriptor.updatedAt } : {}),
          }
        : null,
      structuredData: structuredData.value,
      structuredDataJson: structuredData.value
        ? serializeStructuredData(structuredData.value)
        : null,
    },
    structuredData.issues,
  );
};
