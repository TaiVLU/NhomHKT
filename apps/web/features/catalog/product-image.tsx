'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const unusable = (source: string | null | undefined): boolean => {
  const value = source?.trim();
  return !value || /(^fake:|fake\.|\/fake\/|example\.(invalid|test))/i.test(value);
};

export function ProductImage({
  src,
  alt,
  className,
  loading = 'lazy',
  fetchPriority = 'auto',
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(() => unusable(src));
  const source = failed ? '/book-placeholder.svg' : (src?.trim() ?? '/book-placeholder.svg');
  useEffect(() => {
    const image = imageRef.current;
    if (!image || !source.startsWith('https://covers.openlibrary.org/')) return;
    if (image.complete && image.naturalWidth <= 1) setFailed(true);
  }, [source]);
  return (
    <Image
      ref={imageRef}
      className={className}
      src={source}
      alt={failed ? `Bìa mặc định cho ${alt}` : alt}
      fill
      sizes="(max-width: 700px) 50vw, (max-width: 1200px) 25vw, 220px"
      loading={failed ? 'lazy' : loading}
      fetchPriority={failed ? 'auto' : fetchPriority}
      unoptimized={source.startsWith('https://covers.openlibrary.org/') || source.endsWith('.svg')}
      onLoad={(event) => {
        if (
          source.startsWith('https://covers.openlibrary.org/') &&
          event.currentTarget.naturalWidth <= 1
        ) {
          setFailed(true);
        }
      }}
      onError={() => setFailed(true)}
    />
  );
}
