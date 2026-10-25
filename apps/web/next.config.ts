import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/b/isbn/**',
      },
    ],
  },
  redirects() {
    return [
      {
        source: '/san-pham/:slug',
        destination: '/sach/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
