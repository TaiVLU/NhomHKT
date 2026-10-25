import type { SEOConfig } from './config';
import { seoError, seoIssue, seoOk, type SEOResult } from './result';

const hasControlCharacter = (value: string): boolean =>
  [...value].some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export const normalizePath = (path: string, field = 'canonicalPath'): SEOResult<string> => {
  const trimmed = path.trim();
  if (!trimmed) {
    return seoError([seoIssue('SEO_PATH_REQUIRED', 'SEO path is required.', field)]);
  }
  if (!trimmed.startsWith('/')) {
    return seoError([seoIssue('SEO_PATH_ABSOLUTE_REQUIRED', 'SEO path must start with /.', field)]);
  }
  if (trimmed.startsWith('//') || trimmed.includes('\\')) {
    return seoError([
      seoIssue('SEO_PATH_INVALID', 'SEO path must be a site-relative path.', field),
    ]);
  }
  if (hasControlCharacter(trimmed) || trimmed.includes('#') || trimmed.includes('?')) {
    return seoError([
      seoIssue(
        'SEO_PATH_CLEAN_REQUIRED',
        'SEO path must not contain control chars, query, or hash.',
        field,
      ),
    ]);
  }

  const normalized = trimmed.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
  return seoOk(normalized);
};

export const resolveAbsoluteUrl = (
  config: SEOConfig,
  pathOrUrl: string,
  field = 'url',
): SEOResult<string> => {
  const trimmed = pathOrUrl.trim();
  if (!trimmed)
    return seoError([seoIssue('SEO_URL_REQUIRED', 'SEO URL value is required.', field)]);

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      url.hash = '';
      return seoOk(url.toString());
    }
    const path = normalizePath(trimmed, field);
    if (!path.ok) return path;
    return seoOk(new URL(path.value, config.origin).toString());
  } catch {
    return seoError([seoIssue('SEO_URL_INVALID', 'SEO URL value is invalid.', field)]);
  }
};
