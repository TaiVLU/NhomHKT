const DEFAULT_API_BASE_URL = 'http://127.0.0.1:4000/api/v1';

export const resolveApiBaseUrl = (value: string | undefined): string => {
  const candidate = value?.trim() || DEFAULT_API_BASE_URL;
  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL must be an absolute HTTP(S) URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('NEXT_PUBLIC_API_URL must use HTTP or HTTPS.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('NEXT_PUBLIC_API_URL must not contain credentials, query, or fragment data.');
  }

  const path = parsed.pathname.replace(/\/+$/, '');
  if (path !== '/api/v1') {
    throw new Error('NEXT_PUBLIC_API_URL must include the /api/v1 prefix exactly once.');
  }

  return `${parsed.origin}/api/v1`;
};

export const apiBaseUrl = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
export const publicEnvironment = { NEXT_PUBLIC_API_URL: apiBaseUrl };
