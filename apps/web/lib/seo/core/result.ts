export type SEOIssueSeverity = 'BLOCKER' | 'MAJOR' | 'MINOR' | 'INFO';

export interface SEOIssue {
  code: string;
  message: string;
  field?: string;
  severity: SEOIssueSeverity;
}

export type SEOResult<T> =
  { ok: true; value: T; issues: SEOIssue[] } | { ok: false; issues: SEOIssue[] };

export const seoOk = <T>(value: T, issues: SEOIssue[] = []): SEOResult<T> => ({
  ok: true,
  value,
  issues,
});

export const seoError = (issues: SEOIssue[]): SEOResult<never> => ({
  ok: false,
  issues,
});

export const isBlockingSEOIssue = (issue: SEOIssue): boolean => issue.severity === 'BLOCKER';

export const hasBlockingSEOIssue = (issues: SEOIssue[]): boolean => issues.some(isBlockingSEOIssue);

export const isSEOQualityGateIssue = (issue: SEOIssue): boolean =>
  issue.severity === 'BLOCKER' || issue.severity === 'MAJOR';

export const hasSEOQualityGateIssue = (issues: SEOIssue[]): boolean =>
  issues.some(isSEOQualityGateIssue);

export const seoIssue = (
  code: string,
  message: string,
  field?: string,
  severity: SEOIssueSeverity = 'BLOCKER',
): SEOIssue => ({
  code,
  message,
  ...(field ? { field } : {}),
  severity,
});
