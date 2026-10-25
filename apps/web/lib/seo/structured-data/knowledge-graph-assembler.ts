import { seoError, seoIssue, seoOk, type SEOResult } from '../core/result';
import type {
  StructuredDataGraph,
  StructuredDataNode,
  StructuredDataNodeInput,
  StructuredDataSchemaNode,
} from './types';
import { validateStructuredDataGraph } from './validation';

const normalizeNode = (node: StructuredDataNodeInput): StructuredDataNode => {
  if (node.kind === 'reference') return { kind: 'reference', '@id': node.id };

  const schemaNode: StructuredDataSchemaNode = {
    kind: 'schema',
    '@type': node.type.trim(),
    ...(node.id ? { '@id': node.id.trim() } : {}),
    ...(node.url ? { url: node.url.trim() } : {}),
    ...(node.name ? { name: node.name.trim() } : {}),
    properties: node.properties ?? {},
  };
  return schemaNode;
};

const nodeSortKey = (node: StructuredDataNode): string =>
  node.kind === 'reference'
    ? `reference|${node['@id']}`
    : ['schema', node['@type'], node['@id'] ?? '', node.url ?? '', node.name ?? ''].join('|');

const freezeNode = (node: StructuredDataNode): StructuredDataNode =>
  node.kind === 'reference'
    ? Object.freeze({ ...node })
    : Object.freeze({
        ...node,
        properties: Object.freeze({ ...node.properties }),
      });

export interface KnowledgeGraphAssembler {
  append(node: StructuredDataNodeInput): KnowledgeGraphAssembler;
  appendMany(nodes: readonly StructuredDataNodeInput[]): KnowledgeGraphAssembler;
  freeze(): SEOResult<StructuredDataGraph>;
}

export const assembleKnowledgeGraph = (
  nodes: readonly StructuredDataNodeInput[],
): SEOResult<StructuredDataGraph> => {
  const normalized = nodes.map(normalizeNode);
  const graph: StructuredDataGraph = Object.freeze({
    '@context': 'https://schema.org',
    '@graph': Object.freeze(
      [...normalized]
        .sort((left, right) => nodeSortKey(left).localeCompare(nodeSortKey(right)))
        .map(freezeNode),
    ),
  });
  const validation = validateStructuredDataGraph(graph);
  if (!validation.ok) {
    return seoError([
      seoIssue(
        'SEO_STRUCTURED_DATA_GRAPH_BUILD_FAILED',
        'Structured data graph could not be built safely.',
        '@graph',
      ),
      ...validation.issues,
    ]);
  }
  return seoOk(validation.value, validation.issues);
};

export const createKnowledgeGraphAssembler = (): KnowledgeGraphAssembler => {
  const nodes: StructuredDataNodeInput[] = [];

  return {
    append(node) {
      nodes.push(node);
      return this;
    },
    appendMany(nextNodes) {
      nodes.push(...nextNodes);
      return this;
    },
    freeze() {
      return assembleKnowledgeGraph(nodes);
    },
  };
};
