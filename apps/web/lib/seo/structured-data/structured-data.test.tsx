import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StructuredDataScript } from '../adapters/structured-data-renderer';
import { createSEOConfig } from '../core/config';
import type { SEODescriptor } from '../core/descriptor';
import { buildSEOAssets } from '../core/pipeline';
import { hasBlockingSEOIssue, hasSEOQualityGateIssue } from '../core/result';
import { buildStructuredDataGraph } from './graph-builder';
import { createStructuredDataGraphBuilder } from './graph-builder';
import { assembleKnowledgeGraph, createKnowledgeGraphAssembler } from './knowledge-graph-assembler';
import { composeStructuredDataDescriptor, createStructuredDataAssets } from './factory';
import { serializeStructuredData } from './serializer';
import { validateStructuredDataGraph } from './validation';
import type { StructuredDataGraph, StructuredDataNodeInput } from './types';

const config = () => {
  const result = createSEOConfig({
    origin: 'https://hktstore.example',
    environment: 'production',
    indexingEnabled: true,
  });
  if (!result.ok) throw new Error('Expected SEO config to be valid.');
  return result.value;
};

const nodes: readonly StructuredDataNodeInput[] = [
  {
    kind: 'schema',
    type: 'Thing',
    id: 'https://hktstore.example/#thing-b',
    name: 'B',
    properties: { url: 'https://hktstore.example/b' },
  },
  {
    kind: 'schema',
    type: 'Thing',
    id: 'https://hktstore.example/#thing-a',
    name: 'A',
    properties: { nested: { value: 'safe' } },
  },
];

describe('structured data core', () => {
  it('builds graph nodes in deterministic order', () => {
    const result = buildStructuredDataGraph(nodes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value['@graph'].map((node) => node['@id'])).toEqual([
      'https://hktstore.example/#thing-a',
      'https://hktstore.example/#thing-b',
    ]);
    expect(buildStructuredDataGraph([...nodes].reverse())).toEqual(result);
  });

  it('composes graphs incrementally before freezing', () => {
    const result = createStructuredDataGraphBuilder().append(nodes[1]!).append(nodes[0]!).freeze();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value['@graph'].map((node) => node['@id'])).toEqual([
      'https://hktstore.example/#thing-a',
      'https://hktstore.example/#thing-b',
    ]);
  });

  it('assembles immutable knowledge graphs with stable node identity ordering', () => {
    const result = createKnowledgeGraphAssembler().append(nodes[1]!).append(nodes[0]!).freeze();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value['@graph'])).toBe(true);
    expect(result.value['@graph'].map((node) => node['@id'])).toEqual([
      'https://hktstore.example/#thing-a',
      'https://hktstore.example/#thing-b',
    ]);
  });

  it('reports duplicate @id and duplicate node identity with quality-gate severity', () => {
    const result = buildStructuredDataGraph([nodes[0]!, nodes[0]!]);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_DUPLICATE_ID',
          severity: 'MAJOR',
        }),
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_DUPLICATE_NODE',
          severity: 'MAJOR',
        }),
      ]),
    );
    expect(hasBlockingSEOIssue(result.issues)).toBe(false);
    expect(hasSEOQualityGateIssue(result.issues)).toBe(true);
  });

  it('blocks malformed graph URLs with existing SEO issue semantics', () => {
    const result = buildStructuredDataGraph([
      { kind: 'schema', type: 'Thing', id: '/relative', url: 'ftp://hktstore.example/item' },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_GRAPH_BUILD_FAILED',
          severity: 'BLOCKER',
        }),
        expect.objectContaining({ code: 'SEO_STRUCTURED_DATA_ID_INVALID', severity: 'BLOCKER' }),
        expect.objectContaining({ code: 'SEO_STRUCTURED_DATA_URL_INVALID', severity: 'BLOCKER' }),
      ]),
    );
  });

  it('creates structured data assets through descriptor composition', () => {
    const descriptor = composeStructuredDataDescriptor({ enabled: true, nodes });
    const result = createStructuredDataAssets(descriptor);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value?.['@context']).toBe('https://schema.org');
    expect(result.value?.['@graph']).toHaveLength(2);
  });

  it('serializes graphs without validation, enrichment, or mutation', () => {
    const graphResult = buildStructuredDataGraph(nodes);
    expect(graphResult.ok).toBe(true);
    if (!graphResult.ok) return;
    const before = structuredClone(graphResult.value);

    const json = serializeStructuredData(graphResult.value);

    expect(JSON.parse(json)).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Thing',
          '@id': 'https://hktstore.example/#thing-a',
          name: 'A',
          nested: { value: 'safe' },
        },
        {
          '@type': 'Thing',
          '@id': 'https://hktstore.example/#thing-b',
          name: 'B',
          url: 'https://hktstore.example/b',
        },
      ],
    });
    expect(graphResult.value).toEqual(before);
  });

  it('renders only already serialized JSON-LD at the framework boundary', () => {
    render(<StructuredDataScript json='{"@context":"https://schema.org","@graph":[]}' />);

    const script = screen.getByTestId('structured-data-json-ld');
    expect(script.tagName).toBe('SCRIPT');
    expect(script.getAttribute('type')).toBe('application/ld+json');
    expect(script.textContent).toBe('{"@context":"https://schema.org","@graph":[]}');
  });

  it('integrates nullable structured data into SEOAssets without changing metadata output', () => {
    const descriptor: SEODescriptor = {
      type: 'page',
      title: 'Structured Data Test',
      description: 'Structured data infrastructure test',
      canonicalPath: '/structured-data-test',
      published: true,
      indexable: true,
      structuredData: { enabled: true, nodes },
    };

    const result = buildSEOAssets(descriptor, config());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.structuredData?.['@graph']).toHaveLength(2);
    expect(result.value.metadata.alternates.canonical).toBe(
      'https://hktstore.example/structured-data-test',
    );
    expect(result.value.metadata.openGraph.url).toBe(result.value.metadata.alternates.canonical);
  });

  it('generates Product, Book, and deterministic lowest-price purchasable Offer nodes', () => {
    const descriptor: SEODescriptor = {
      type: 'book',
      title: 'Atomic Habits',
      description: 'Small habits, large outcomes',
      canonicalPath: '/sach/atomic-habits',
      imagePath: '/covers/atomic-habits.webp',
      published: true,
      indexable: true,
      structuredData: {
        enabled: true,
        productBook: {
          authors: [{ name: 'James Clear', slug: 'james-clear' }],
          publisher: { name: 'Avery', slug: 'avery' },
          primaryImage: '/covers/atomic-habits.webp',
          language: 'en',
          releaseDate: '2018-10-16',
          pageCount: 320,
          variants: [
            { sku: 'EXPENSIVE', isbn: '9780735211292', salePrice: 245000, inStock: true },
            { sku: 'LOWEST', isbn: '9780735211292', salePrice: 205000, inStock: true },
            { sku: 'OUT-LOWEST', isbn: '9780735211292', salePrice: 100000, inStock: false },
          ],
        },
      },
    };

    const result = buildSEOAssets(descriptor, config());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const graph = JSON.parse(result.value.structuredDataJson ?? '') as {
      '@graph': Array<{
        '@type': string;
        sku?: string;
        price?: number;
        url?: string;
        image?: string[];
      }>;
    };
    const productNode = graph['@graph'].find((node) => node['@type'] === 'Product');
    const bookNode = graph['@graph'].find((node) => node['@type'] === 'Book');
    const offerNode = graph['@graph'].find((node) => node['@type'] === 'Offer');

    expect(productNode).toMatchObject({
      url: 'https://hktstore.example/sach/atomic-habits',
      image: ['https://hktstore.example/covers/atomic-habits.webp'],
    });
    expect(bookNode).toMatchObject({ url: 'https://hktstore.example/sach/atomic-habits' });
    expect(offerNode).toMatchObject({
      url: 'https://hktstore.example/sach/atomic-habits',
      sku: 'LOWEST',
      price: 205000,
    });
    expect(result.value.metadata.openGraph.images[0]?.url).toBe(productNode?.image?.[0]);
    expect(result.value.metadata.twitter.images[0]).toBe(productNode?.image?.[0]);
  });

  it('keeps structured data validation reusable for completed graphs', () => {
    const graph: StructuredDataGraph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          kind: 'schema',
          '@type': 'WebSite',
          '@id': 'https://hktstore.example/#reference',
          url: 'https://hktstore.example',
          name: 'HKT Store',
          properties: {},
        },
      ],
    };

    expect(validateStructuredDataGraph(graph)).toEqual({ ok: true, value: graph, issues: [] });
  });

  it('generates Organization and WebSite global graph nodes without SearchAction', () => {
    const result = buildSEOAssets(
      {
        type: 'home',
        title: 'HKT Store',
        description: 'HKT Store bookstore',
        canonicalPath: '/',
        published: true,
        indexable: true,
        structuredData: {
          enabled: true,
          site: {
            name: 'HKT Store',
            url: 'https://hktstore.example',
          },
        },
      },
      config(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const graph = JSON.parse(result.value.structuredDataJson ?? '') as {
      '@graph': Array<{ '@type': string; '@id': string; url?: string; potentialAction?: unknown }>;
    };
    expect(graph['@graph']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          '@type': 'Organization',
          '@id': 'https://hktstore.example/#organization',
          url: 'https://hktstore.example',
        }),
        expect.objectContaining({
          '@type': 'WebSite',
          '@id': 'https://hktstore.example/#website',
          url: 'https://hktstore.example',
        }),
      ]),
    );
    expect(graph['@graph'].some((node) => node.potentialAction)).toBe(false);
  });

  it('generates BreadcrumbList with terminal URL matching canonical', () => {
    const result = buildSEOAssets(
      {
        type: 'book',
        title: 'Atomic Habits',
        description: 'Small habits, large outcomes',
        canonicalPath: '/sach/atomic-habits',
        published: true,
        indexable: true,
        structuredData: {
          enabled: true,
          breadcrumb: {
            items: [
              { name: 'Home', url: 'https://hktstore.example' },
              { name: 'Books', url: 'https://hktstore.example/san-pham' },
              { name: 'Atomic Habits', url: 'https://hktstore.example/sach/atomic-habits' },
            ],
          },
        },
      },
      config(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const graph = JSON.parse(result.value.structuredDataJson ?? '') as {
      '@graph': Array<{ '@type': string; itemListElement?: Array<{ item: string }> }>;
    };
    const breadcrumb = graph['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
    expect(breadcrumb?.itemListElement?.at(-1)?.item).toBe(
      result.value.metadata.alternates.canonical,
    );
  });

  it('generates CollectionPage and ItemList for collection descriptors', () => {
    const result = buildSEOAssets(
      {
        type: 'category',
        title: 'Van hoc',
        description: 'Books in Van hoc',
        canonicalPath: '/danh-muc/van-hoc',
        published: true,
        indexable: true,
        structuredData: {
          enabled: true,
          collection: {
            items: [
              { name: 'Book A', url: 'https://hktstore.example/sach/book-a' },
              { name: 'Book B', url: 'https://hktstore.example/sach/book-b' },
            ],
          },
        },
      },
      config(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const graph = JSON.parse(result.value.structuredDataJson ?? '') as {
      '@graph': Array<{ '@type': string; url?: string; itemListElement?: unknown[] }>;
    };
    expect(graph['@graph'].find((node) => node['@type'] === 'CollectionPage')).toMatchObject({
      url: 'https://hktstore.example/danh-muc/van-hoc',
    });
    expect(
      Array.isArray(graph['@graph'].find((node) => node['@type'] === 'ItemList')?.itemListElement),
    ).toBe(true);
  });

  it('reports broken references, circular references, and conflicting origins', () => {
    const result = assembleKnowledgeGraph([
      {
        kind: 'schema',
        type: 'Thing',
        id: 'https://hktstore.example/#a',
        properties: { related: { '@id': 'https://hktstore.example/#b' } },
      },
      {
        kind: 'schema',
        type: 'Thing',
        id: 'https://other.example/#b',
        properties: { related: { '@id': 'https://hktstore.example/#a' } },
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_GRAPH_BUILD_FAILED',
          severity: 'BLOCKER',
        }),
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_REFERENCE_BROKEN',
          severity: 'MAJOR',
        }),
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_CONFLICTING_ORIGINS',
          severity: 'BLOCKER',
        }),
      ]),
    );
  });

  it('reports circular graph references without throwing', () => {
    const result = assembleKnowledgeGraph([
      {
        kind: 'schema',
        type: 'Thing',
        id: 'https://hktstore.example/#a',
        properties: { related: { '@id': 'https://hktstore.example/#b' } },
      },
      {
        kind: 'schema',
        type: 'Thing',
        id: 'https://hktstore.example/#b',
        properties: { related: { '@id': 'https://hktstore.example/#a' } },
      },
    ]);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_CIRCULAR_REFERENCE',
          severity: 'MAJOR',
        }),
      ]),
    );
  });

  it('blocks structured data asset output when cross-asset canonical consistency fails', () => {
    const result = buildSEOAssets(
      {
        type: 'page',
        title: 'Broken Breadcrumb',
        description: 'Broken breadcrumb canonical',
        canonicalPath: '/broken',
        published: true,
        indexable: true,
        structuredData: {
          enabled: true,
          breadcrumb: {
            items: [
              { name: 'Home', url: 'https://hktstore.example' },
              { name: 'Broken', url: 'https://hktstore.example/not-broken' },
            ],
          },
        },
      },
      config(),
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'SEO_STRUCTURED_DATA_BREADCRUMB_TERMINAL_MISMATCH',
          severity: 'BLOCKER',
        }),
      ]),
    );
  });
});