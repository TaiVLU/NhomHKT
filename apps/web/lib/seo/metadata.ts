import {
  buildSEOAssets as buildCoreSEOAssets,
  seoRuntimeConfigFromEnvironment,
  StructuredDataRenderer,
  toNextMetadata,
  type SEOAssets,
  type SEODescriptor,
  type SEOResult,
} from './index';

export const buildSEOAssets = (descriptor: SEODescriptor): SEOResult<SEOAssets> => {
  const config = seoRuntimeConfigFromEnvironment();
  if (!config.ok) return config;
  return buildCoreSEOAssets(descriptor, config.value);
};

export { StructuredDataRenderer, toNextMetadata, type SEODescriptor };
