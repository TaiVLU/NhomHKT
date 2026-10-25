import type { Metadata } from 'next';
import type { SEOMetadataAsset } from '../core/descriptor';

export const toNextMetadata = (asset: SEOMetadataAsset): Metadata => ({
  title: asset.title,
  description: asset.description,
  alternates: { canonical: asset.alternates.canonical },
  robots: {
    index: asset.robots.index,
    follow: asset.robots.follow,
    ...(asset.robots.noarchive ? { noarchive: true } : {}),
  },
  openGraph: {
    title: asset.openGraph.title,
    description: asset.openGraph.description,
    url: asset.openGraph.url,
    siteName: asset.openGraph.siteName,
    locale: asset.openGraph.locale,
    type: asset.openGraph.type,
    images: asset.openGraph.images,
  },
  twitter: {
    card: asset.twitter.card,
    title: asset.twitter.title,
    description: asset.twitter.description,
    images: asset.twitter.images,
  },
});
