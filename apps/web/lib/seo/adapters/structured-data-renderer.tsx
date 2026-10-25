import type { SerializedStructuredData } from '../structured-data';

export function StructuredDataScript({ json }: { readonly json: SerializedStructuredData | null }) {
  if (!json) return null;
  return (
    <script
      type="application/ld+json"
      data-testid="structured-data-json-ld"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export const StructuredDataRenderer = StructuredDataScript;
