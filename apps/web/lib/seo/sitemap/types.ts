export type SitemapChangeFrequency =
  'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export interface SitemapEntry {
  readonly url: string;
  readonly lastModified?: string | Date;
  readonly changeFrequency?: SitemapChangeFrequency;
  readonly priority?: number;
}

export interface NormalizedSitemapEntry {
  readonly url: string;
  readonly lastModified?: string;
  readonly changeFrequency?: SitemapChangeFrequency;
  readonly priority?: number;
}

export interface SitemapProvider {
  readonly name: string;
  getEntries(): Promise<readonly SitemapEntry[]> | readonly SitemapEntry[];
}

export interface SitemapValidationOptions {
  readonly allowLocalhost?: boolean;
}
