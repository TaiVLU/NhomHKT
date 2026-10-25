export { toNextMetadata } from './adapters/next-metadata-adapter';
export { StructuredDataRenderer, StructuredDataScript } from './adapters/structured-data-renderer';
export {
  DEFAULT_SEO_CONFIG,
  createSEOConfig,
  isLocalOrigin,
  normalizeOrigin,
  seoConfigFromEnvironment,
  seoRuntimeConfigFromEnvironment,
  type SEOConfig,
  type SEOConfigInput,
  type SEOEnvironmentName,
  type SEOIndexingPolicy,
} from './core/config';
export {
  type NormalizedSEODescriptor,
  type SEOAssets,
  type SEODescriptor,
  type SEOMetadataAsset,
  type SEOOpenGraphAsset,
  type SEOResourceType,
  type SEORobotsAsset,
  type SEOSitemapEntry,
  type SEOTwitterAsset,
} from './core/descriptor';
export { buildSEOAssets } from './core/pipeline';
export {
  hasBlockingSEOIssue,
  hasSEOQualityGateIssue,
  isBlockingSEOIssue,
  isSEOQualityGateIssue,
  type SEOIssue,
  type SEOIssueSeverity,
  type SEOResult,
} from './core/result';
export {
  buildStructuredDataGraph,
  composeStructuredDataDescriptor,
  createStructuredDataAssets,
  serializeStructuredData,
  validateStructuredDataGraph,
  type SerializedStructuredData,
  type ProductBookStructuredDataDescriptor,
  type ProductOfferStructuredDataDescriptor,
  type StructuredDataDescriptor,
  type StructuredDataGraph,
  type StructuredDataNamedEntity,
  type StructuredDataNode,
  type StructuredDataNodeInput,
  type StructuredDataPropertyMap,
  type StructuredDataPropertyValue,
  type StructuredDataSEODescriptor,
} from './structured-data';
export { buildSitemap } from './sitemap';
