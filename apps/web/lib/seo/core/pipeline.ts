import type { SEOConfig } from './config';
import type { SEOAssets, SEODescriptor } from './descriptor';
import { createSEOAssets } from './asset-factory';
import { validateSEOAssetConsistency } from './consistency';
import { enrichSEODescriptor } from './enrichment';
import { normalizeSEODescriptor } from './normalization';
import { seoError, seoOk, type SEOResult } from './result';

export const buildSEOAssets = (
  descriptor: SEODescriptor,
  config: SEOConfig,
): SEOResult<SEOAssets> => {
  const normalized = normalizeSEODescriptor(descriptor, config);
  if (!normalized.ok) return normalized;

  const enriched = enrichSEODescriptor(normalized.value, config);
  const assets = createSEOAssets(enriched, config);
  if (!assets.ok) return seoError([...normalized.issues, ...assets.issues]);
  const consistent = validateSEOAssetConsistency(assets.value, config);
  if (!consistent.ok) {
    return seoError([...normalized.issues, ...assets.issues, ...consistent.issues]);
  }

  return seoOk(consistent.value, [...normalized.issues, ...assets.issues, ...consistent.issues]);
};
