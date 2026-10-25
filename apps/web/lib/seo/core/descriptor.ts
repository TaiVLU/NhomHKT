import type { StructuredDataDescriptor, StructuredDataGraph } from '../structured-data';
import type { SerializedStructuredData } from '../structured-data';

export type SEOResourceType =
  'home' | 'catalog' | 'category' | 'book' | 'author' | 'publisher' | 'page';

export interface SEODescriptor {
  id?: string;
  type: SEOResourceType;
  title: string;
  description?: string;
  canonicalPath: string;
  imagePath?: string;
  locale?: string;
  language?: string;
  published: boolean;
  indexable: boolean;
  follow?: boolean;
  noarchive?: boolean;
  updatedAt?: Date | string;
  structuredData?: StructuredDataDescriptor;
}

export interface NormalizedSEODescriptor {
  id?: string;
  type: SEOResourceType;
  title: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  imageUrl: string;
  locale: string;
  language: string;
  published: boolean;
  indexable: boolean;
  follow: boolean;
  noarchive: boolean;
  sitemapEligible: boolean;
  updatedAt?: string;
  structuredData?: StructuredDataDescriptor;
}

export interface SEORobotsAsset {
  index: boolean;
  follow: boolean;
  noarchive?: boolean;
}

export interface SEOOpenGraphAsset {
  title: string;
  description: string;
  url: string;
  siteName: string;
  locale: string;
  type: 'website' | 'article';
  images: Array<{ url: string; alt: string; width?: number; height?: number }>;
}

export interface SEOTwitterAsset {
  card: 'summary' | 'summary_large_image';
  title: string;
  description: string;
  images: string[];
}

export interface SEOSitemapEntry {
  url: string;
  lastModified?: string;
}

export interface SEOMetadataAsset {
  title: string;
  description: string;
  alternates: { canonical: string };
  robots: SEORobotsAsset;
  openGraph: SEOOpenGraphAsset;
  twitter: SEOTwitterAsset;
}

export interface SEOAssets {
  descriptor: NormalizedSEODescriptor;
  metadata: SEOMetadataAsset;
  sitemapEntry: SEOSitemapEntry | null;
  structuredData: StructuredDataGraph | null;
  structuredDataJson: SerializedStructuredData | null;
}
