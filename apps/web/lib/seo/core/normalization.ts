import type { SEOConfig } from './config';
import type { NormalizedSEODescriptor, SEODescriptor } from './descriptor';
import { seoError, seoIssue, seoOk, type SEOIssue, type SEOResult } from './result';
import { resolveAbsoluteUrl, normalizePath } from './url-resolver';
import { validateSEODescriptor } from './validation';

const compactText = (value: string): string => value.trim().replace(/\s+/g, ' ');

const renderTemplate = (template: string, value: string): string => template.replace(/%s/g, value);

const isoDate = (value: Date | string | undefined): string | undefined => {
  if (!value) return undefined;
  return new Date(value).toISOString();
};

export const normalizeSEODescriptor = (
  descriptor: SEODescriptor,
  config: SEOConfig,
): SEOResult<NormalizedSEODescriptor> => {
  const validated = validateSEODescriptor(descriptor);
  if (!validated.ok) return validated;

  const issues: SEOIssue[] = [...validated.issues];
  const canonicalPath = normalizePath(descriptor.canonicalPath);
  if (!canonicalPath.ok) return seoError([...issues, ...canonicalPath.issues]);
  const canonicalUrl = resolveAbsoluteUrl(config, canonicalPath.value, 'canonicalPath');
  if (!canonicalUrl.ok) return seoError([...issues, ...canonicalUrl.issues]);

  const description = descriptor.description?.trim()
    ? compactText(descriptor.description)
    : renderTemplate(config.descriptionFallbackTemplate, compactText(descriptor.title));
  if (!descriptor.description?.trim()) {
    issues.push(
      seoIssue(
        'SEO_DESCRIPTION_FALLBACK_APPLIED',
        'SEO description fallback was applied.',
        'description',
        'INFO',
      ),
    );
  }

  const imagePath = descriptor.imagePath ?? config.defaultOpenGraphImagePath;
  if (!descriptor.imagePath?.trim()) {
    issues.push(
      seoIssue(
        'SEO_IMAGE_FALLBACK_APPLIED',
        'SEO image fallback was applied.',
        'imagePath',
        'INFO',
      ),
    );
  }
  const imageUrl = resolveAbsoluteUrl(config, imagePath, 'imagePath');
  if (!imageUrl.ok) return seoError([...issues, ...imageUrl.issues]);

  const indexable = descriptor.published && descriptor.indexable && config.indexing.enabled;
  const follow = descriptor.follow ?? (indexable ? config.indexing.defaultFollow : true);
  const noarchive = descriptor.noarchive ?? false;

  const normalized: NormalizedSEODescriptor = {
    ...(descriptor.id ? { id: compactText(descriptor.id) } : {}),
    type: descriptor.type,
    title: compactText(descriptor.title),
    description,
    canonicalPath: canonicalPath.value,
    canonicalUrl: canonicalUrl.value,
    imageUrl: imageUrl.value,
    locale: descriptor.locale?.trim() || config.defaultLocale,
    language: descriptor.language?.trim() || config.defaultLanguage,
    published: descriptor.published,
    indexable,
    follow,
    noarchive,
    sitemapEligible: descriptor.published && indexable,
    ...(descriptor.structuredData ? { structuredData: descriptor.structuredData } : {}),
  };
  const normalizedUpdatedAt = isoDate(descriptor.updatedAt);
  if (normalizedUpdatedAt) normalized.updatedAt = normalizedUpdatedAt;

  return seoOk(normalized, issues);
};
