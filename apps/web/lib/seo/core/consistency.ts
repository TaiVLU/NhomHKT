import { isLocalOrigin, type SEOConfig } from './config';
import type { SEOAssets } from './descriptor';
import type { StructuredDataNode } from '../structured-data';
import {
  hasBlockingSEOIssue,
  seoError,
  seoIssue,
  seoOk,
  type SEOIssue,
  type SEOResult,
} from './result';

const isLocalUrl = (url: string): boolean => isLocalOrigin(url);

const structuredDataUrls = (value: unknown): string[] => {
  if (typeof value === 'string') return /^https?:\/\//i.test(value) ? [value] : [];
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(structuredDataUrls);
  return Object.values(value).flatMap(structuredDataUrls);
};

const schemaNodes = (
  assets: SEOAssets,
): readonly Extract<StructuredDataNode, { kind: 'schema' }>[] =>
  assets.structuredData?.['@graph'].filter(
    (node): node is Extract<StructuredDataNode, { kind: 'schema' }> => node.kind === 'schema',
  ) ?? [];

const propertyValue = (
  node: Extract<StructuredDataNode, { kind: 'schema' }>,
  key: string,
): unknown => node.properties[key];

const firstString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return firstString(value[0]);
  return null;
};

export const validateSEOAssetConsistency = (
  assets: SEOAssets,
  config?: SEOConfig,
): SEOResult<SEOAssets> => {
  const issues: SEOIssue[] = [];
  const descriptor = assets.descriptor;

  if (assets.metadata.alternates.canonical !== descriptor.canonicalUrl) {
    issues.push(
      seoIssue(
        'SEO_CANONICAL_MISMATCH',
        'Metadata canonical must match the normalized descriptor canonical URL.',
        'canonical',
      ),
    );
  }
  if (assets.metadata.openGraph.url !== descriptor.canonicalUrl) {
    issues.push(
      seoIssue('SEO_OG_URL_MISMATCH', 'Open Graph URL must match canonical URL.', 'openGraph.url'),
    );
  }
  if (assets.sitemapEntry && !descriptor.sitemapEligible) {
    issues.push(
      seoIssue(
        'SEO_SITEMAP_ELIGIBILITY_MISMATCH',
        'Non-eligible descriptors must not produce sitemap entries.',
        'sitemapEntry',
        'MAJOR',
      ),
    );
  }
  if (!descriptor.indexable && assets.metadata.robots.index) {
    issues.push(
      seoIssue(
        'SEO_ROBOTS_INDEX_MISMATCH',
        'Non-indexable descriptors must remain noindex.',
        'robots',
      ),
    );
  }
  if (assets.metadata.robots.follow !== descriptor.follow) {
    issues.push(
      seoIssue(
        'SEO_ROBOTS_FOLLOW_MISMATCH',
        'Metadata robots follow must match the normalized descriptor follow policy.',
        'robots',
      ),
    );
  }
  if (!!assets.metadata.robots.noarchive !== descriptor.noarchive) {
    issues.push(
      seoIssue(
        'SEO_ROBOTS_NOARCHIVE_MISMATCH',
        'Metadata robots noarchive must match the normalized descriptor archive policy.',
        'robots',
      ),
    );
  }
  if (
    config?.environment === 'production' &&
    [
      assets.descriptor.canonicalUrl,
      assets.descriptor.imageUrl,
      assets.metadata.alternates.canonical,
      assets.metadata.openGraph.url,
      ...assets.metadata.openGraph.images.map((image) => image.url),
      ...assets.metadata.twitter.images,
      ...(assets.sitemapEntry ? [assets.sitemapEntry.url] : []),
      ...structuredDataUrls(assets.structuredData),
    ].some(isLocalUrl)
  ) {
    issues.push(
      seoIssue(
        'SEO_PRODUCTION_LOCAL_URL_LEAK',
        'Production SEO assets must not contain localhost URLs.',
        'url',
      ),
    );
  }

  for (const node of schemaNodes(assets)) {
    if (
      ['Product', 'Book', 'BreadcrumbList', 'CollectionPage'].includes(node['@type']) &&
      node.url !== descriptor.canonicalUrl
    ) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_CANONICAL_MISMATCH',
          'Structured data URL must match the canonical URL for the page resource.',
          'structuredData.url',
        ),
      );
    }

    if (node['@type'] === 'Product') {
      const productImage = firstString(propertyValue(node, 'image'));
      if (productImage && productImage !== assets.metadata.openGraph.images[0]?.url) {
        issues.push(
          seoIssue(
            'SEO_STRUCTURED_DATA_IMAGE_MISMATCH',
            'Product structured data image must match Open Graph and Twitter image assets.',
            'structuredData.image',
          ),
        );
      }
    }

    if (node['@type'] === 'BreadcrumbList') {
      const items = propertyValue(node, 'itemListElement');
      const lastItem =
        Array.isArray(items) && items.length > 0
          ? (items[items.length - 1] as Record<string, unknown>)
          : null;
      if (typeof lastItem?.item === 'string' && lastItem.item !== descriptor.canonicalUrl) {
        issues.push(
          seoIssue(
            'SEO_STRUCTURED_DATA_BREADCRUMB_TERMINAL_MISMATCH',
            'Breadcrumb terminal URL must match the canonical URL.',
            'structuredData.breadcrumb',
          ),
        );
      }
    }
  }

  const organization = schemaNodes(assets).find((node) => node['@type'] === 'Organization');
  const website = schemaNodes(assets).find((node) => node['@type'] === 'WebSite');
  if (organization && website && organization.url !== website.url) {
    issues.push(
      seoIssue(
        'SEO_STRUCTURED_DATA_SITE_IDENTITY_MISMATCH',
        'Organization URL must match WebSite URL.',
        'structuredData.url',
      ),
    );
  }

  return hasBlockingSEOIssue(issues) ? seoError(issues) : seoOk(assets, issues);
};
