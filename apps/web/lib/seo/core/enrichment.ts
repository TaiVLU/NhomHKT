import type { SEOConfig } from './config';
import type { NormalizedSEODescriptor } from './descriptor';

export const applyTitleTemplate = (title: string, config: SEOConfig): string => {
  if (title.includes(config.siteName)) return title;
  return config.titleTemplate.replace(/%s/g, title);
};

export const enrichSEODescriptor = (
  descriptor: NormalizedSEODescriptor,
  config: SEOConfig,
): NormalizedSEODescriptor => ({
  ...descriptor,
  title: applyTitleTemplate(descriptor.title, config),
  description: descriptor.description || config.defaultDescription,
});
