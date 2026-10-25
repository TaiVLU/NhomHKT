import {
  hasBlockingSEOIssue,
  seoError,
  seoIssue,
  seoOk,
  type SEOIssue,
  type SEOResult,
} from '../core/result';
import { isLocalOrigin } from '../core/config';
import type { StructuredDataGraph, StructuredDataNode } from './types';

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const nodeIdentity = (node: StructuredDataNode): string => {
  if (node.kind === 'reference') return `reference:${node['@id']}`;
  return [node['@type'], node['@id'] ?? '', node.url ?? '', node.name ?? ''].join('|');
};

const collectReferenceIds = (value: unknown): string[] => {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectReferenceIds);
  const record = value as Record<string, unknown>;
  return [
    ...(typeof record['@id'] === 'string' ? [record['@id']] : []),
    ...Object.entries(record)
      .filter(([key]) => key !== '@id')
      .flatMap(([, nextValue]) => collectReferenceIds(nextValue)),
  ];
};

const collectNodeUrls = (node: StructuredDataNode): readonly string[] => {
  if (node.kind === 'reference') return [node['@id']];
  const values: string[] = [];
  if (node['@id']) values.push(node['@id']);
  if (node.url) values.push(node.url);
  return values;
};

const nodeReferences = (node: StructuredDataNode): readonly string[] => {
  if (node.kind === 'reference') return [node['@id']];
  return collectReferenceIds(node.properties);
};

export const validateStructuredDataGraph = (
  graph: StructuredDataGraph,
): SEOResult<StructuredDataGraph> => {
  const issues: SEOIssue[] = [];
  const ids = new Set<string>();
  const identities = new Set<string>();
  const references = new Set<string>();
  const graphOrigins = new Set<string>();
  const edges = new Map<string, readonly string[]>();

  if (graph['@context'] !== 'https://schema.org') {
    issues.push(
      seoIssue(
        'SEO_STRUCTURED_DATA_CONTEXT_INVALID',
        'Structured data graph must use the Schema.org context.',
        '@context',
      ),
    );
  }

  const graphNodes: unknown = graph['@graph'];
  if (!Array.isArray(graphNodes)) {
    issues.push(
      seoIssue(
        'SEO_STRUCTURED_DATA_GRAPH_INVALID',
        'Structured data graph must contain an @graph array.',
        '@graph',
      ),
    );
    return seoError(issues);
  }

  const nodes = graphNodes as readonly StructuredDataNode[];
  for (const node of nodes) {
    if (node.kind === 'schema' && !node['@type'].trim()) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_TYPE_REQUIRED',
          'Structured data schema nodes require a type.',
          '@type',
        ),
      );
    }

    const id = node['@id'];
    if (id) {
      if (!isAbsoluteHttpUrl(id)) {
        issues.push(
          seoIssue(
            'SEO_STRUCTURED_DATA_ID_INVALID',
            'Structured data @id must be an absolute HTTP(S) URL.',
            '@id',
          ),
        );
      }
      if (ids.has(id)) {
        issues.push(
          seoIssue(
            'SEO_STRUCTURED_DATA_DUPLICATE_ID',
            'Structured data graph contains duplicate @id values.',
            '@id',
            'MAJOR',
          ),
        );
      }
      ids.add(id);
    }

    if (node.kind === 'schema' && node.url && !isAbsoluteHttpUrl(node.url)) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_URL_INVALID',
          'Structured data URL fields must be absolute HTTP(S) URLs.',
          'url',
        ),
      );
    }

    for (const url of collectNodeUrls(node)) {
      if (isLocalOrigin(url)) {
        issues.push(
          seoIssue(
            'SEO_STRUCTURED_DATA_LOCAL_URL',
            'Structured data graph must not contain localhost URLs.',
            'url',
            'INFO',
          ),
        );
      }
      if (isAbsoluteHttpUrl(url)) graphOrigins.add(new URL(url).origin);
    }

    if (node.kind === 'schema') {
      const nextReferences = collectReferenceIds(node.properties);
      for (const referenceId of nextReferences) references.add(referenceId);
      if (node['@id']) edges.set(node['@id'], nextReferences);
    }
    if (node.kind === 'reference') references.add(node['@id']);

    const identity = nodeIdentity(node);
    if (identities.has(identity)) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_DUPLICATE_NODE',
          'Structured data graph contains duplicate node identity.',
          '@graph',
          'MAJOR',
        ),
      );
    }
    identities.add(identity);
  }

  for (const referenceId of references) {
    if (!isAbsoluteHttpUrl(referenceId)) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_REFERENCE_INVALID',
          'Structured data references must use absolute HTTP(S) @id values.',
          '@id',
        ),
      );
    } else if (!ids.has(referenceId)) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_REFERENCE_BROKEN',
          'Structured data graph contains a reference to a missing node.',
          '@id',
          'MAJOR',
        ),
      );
    }
  }

  const orphanSchemas = nodes.filter(
    (node) =>
      node.kind === 'schema' &&
      node['@id'] &&
      !references.has(node['@id']) &&
      ![
        'Organization',
        'WebSite',
        'Product',
        'Book',
        'BreadcrumbList',
        'CollectionPage',
        'ItemList',
      ].includes(node['@type']),
  );
  if (orphanSchemas.length > 0) {
    issues.push(
      seoIssue(
        'SEO_STRUCTURED_DATA_ORPHAN_NODE',
        'Structured data graph contains schema nodes that are not referenced by the supported graph roots.',
        '@graph',
        'MAJOR',
      ),
    );
  }

  if (graphOrigins.size > 1) {
    issues.push(
      seoIssue(
        'SEO_STRUCTURED_DATA_CONFLICTING_ORIGINS',
        'Structured data graph must not mix URL origins.',
        'url',
      ),
    );
  }

  for (const [source, targets] of edges.entries()) {
    if (targets.includes(source)) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_CIRCULAR_REFERENCE',
          'Structured data graph must not contain circular references.',
          '@graph',
          'MAJOR',
        ),
      );
      break;
    }
    if (
      targets.some((target) =>
        nodeReferences(
          nodes.find((node) => node['@id'] === target) ?? { kind: 'reference', '@id': '' },
        ).includes(source),
      )
    ) {
      issues.push(
        seoIssue(
          'SEO_STRUCTURED_DATA_CIRCULAR_REFERENCE',
          'Structured data graph must not contain circular references.',
          '@graph',
          'MAJOR',
        ),
      );
      break;
    }
  }

  return hasBlockingSEOIssue(issues) ? seoError(issues) : seoOk(graph, issues);
};
