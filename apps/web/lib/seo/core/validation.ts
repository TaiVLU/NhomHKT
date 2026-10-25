import type { SEODescriptor } from './descriptor';
import {
  hasBlockingSEOIssue,
  seoError,
  seoIssue,
  seoOk,
  type SEOIssue,
  type SEOResult,
} from './result';
import { normalizePath } from './url-resolver';

const meaningful = (value: string | undefined): boolean => !!value && value.trim().length > 0;

export const validateSEODescriptor = (descriptor: SEODescriptor): SEOResult<SEODescriptor> => {
  const issues: SEOIssue[] = [];

  if (!meaningful(descriptor.title)) {
    issues.push(seoIssue('SEO_TITLE_REQUIRED', 'SEO descriptor title is required.', 'title'));
  }

  const canonicalPath = normalizePath(descriptor.canonicalPath);
  if (!canonicalPath.ok) issues.push(...canonicalPath.issues);

  if (descriptor.imagePath) {
    const imagePath = normalizePath(descriptor.imagePath, 'imagePath');
    if (!imagePath.ok) {
      const trimmedImagePath = descriptor.imagePath.trim();
      if (/^https?:\/\//i.test(trimmedImagePath)) {
        try {
          new URL(trimmedImagePath);
        } catch {
          issues.push(
            seoIssue('SEO_IMAGE_URL_INVALID', 'SEO image URL must be valid.', 'imagePath', 'MAJOR'),
          );
        }
      } else {
        issues.push(...imagePath.issues);
      }
    }
  }

  if (descriptor.updatedAt) {
    const date = new Date(descriptor.updatedAt);
    if (Number.isNaN(date.getTime())) {
      issues.push(
        seoIssue('SEO_UPDATED_AT_INVALID', 'SEO updatedAt must be a valid date.', 'updatedAt'),
      );
    }
  }

  if (!descriptor.published && descriptor.indexable) {
    issues.push(
      seoIssue(
        'SEO_UNPUBLISHED_INDEXABLE',
        'Unpublished descriptors cannot produce indexable SEO assets.',
        'indexable',
        'MAJOR',
      ),
    );
  }

  return hasBlockingSEOIssue(issues) ? seoError(issues) : seoOk(descriptor, issues);
};
