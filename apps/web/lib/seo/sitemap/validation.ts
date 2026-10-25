import { isLocalOrigin } from '../core/config';
import { seoError, seoIssue, seoOk, type SEOIssue, type SEOResult } from '../core/result';
import type {
  NormalizedSitemapEntry,
  SitemapChangeFrequency,
  SitemapValidationOptions,
} from './types';

const changeFrequencies = new Set<SitemapChangeFrequency>([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]);

const isAbsoluteUrl = (url: string): boolean => /^[a-z][a-z\d+.-]*:\/\//i.test(url);

export const validateSitemapEntries = (
  entries: readonly NormalizedSitemapEntry[],
  options: SitemapValidationOptions = {},
): SEOResult<readonly NormalizedSitemapEntry[]> => {
  const issues: SEOIssue[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (!isAbsoluteUrl(entry.url)) {
      issues.push(
        seoIssue('SEO_SITEMAP_URL_ABSOLUTE_REQUIRED', 'Sitemap URL must be absolute.', 'url'),
      );
      continue;
    }

    try {
      const parsed = new URL(entry.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        issues.push(
          seoIssue(
            'SEO_SITEMAP_URL_PROTOCOL_INVALID',
            'Sitemap URL must use http or https.',
            'url',
          ),
        );
      }
      if (!options.allowLocalhost && isLocalOrigin(parsed.origin)) {
        issues.push(
          seoIssue(
            'SEO_SITEMAP_LOCALHOST_URL',
            'Sitemap URL must not use a localhost origin.',
            'url',
          ),
        );
      }
    } catch {
      issues.push(seoIssue('SEO_SITEMAP_URL_INVALID', 'Sitemap URL must be valid.', 'url'));
      continue;
    }

    if (seen.has(entry.url)) {
      issues.push(
        seoIssue('SEO_SITEMAP_DUPLICATE_URL', 'Sitemap URL must be unique.', 'url', 'MAJOR'),
      );
    }
    seen.add(entry.url);

    if (entry.priority !== undefined && (entry.priority < 0 || entry.priority > 1)) {
      issues.push(
        seoIssue(
          'SEO_SITEMAP_PRIORITY_INVALID',
          'Sitemap priority must be between 0 and 1.',
          'priority',
          'MINOR',
        ),
      );
    }

    if (entry.changeFrequency !== undefined && !changeFrequencies.has(entry.changeFrequency)) {
      issues.push(
        seoIssue(
          'SEO_SITEMAP_CHANGE_FREQUENCY_INVALID',
          'Sitemap changeFrequency is invalid.',
          'changeFrequency',
          'MINOR',
        ),
      );
    }

    if (entry.lastModified) {
      const lastModified = new Date(entry.lastModified);
      if (Number.isNaN(lastModified.getTime())) {
        issues.push(
          seoIssue(
            'SEO_SITEMAP_LAST_MODIFIED_INVALID',
            'Sitemap lastModified must be a valid date.',
            'lastModified',
            'MINOR',
          ),
        );
      }
    } else {
      issues.push(
        seoIssue(
          'SEO_SITEMAP_LAST_MODIFIED_MISSING',
          'Sitemap entry is missing lastModified.',
          'lastModified',
          'INFO',
        ),
      );
    }
  }

  const blocking = issues.some((issue) => issue.severity === 'BLOCKER');
  return blocking ? seoError(issues) : seoOk(entries, issues);
};
