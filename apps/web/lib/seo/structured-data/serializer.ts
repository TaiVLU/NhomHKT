import type {
  SerializedStructuredData,
  StructuredDataGraph,
  StructuredDataNode,
  StructuredDataPropertyMap,
  StructuredDataPropertyValue,
} from './types';

const serializeValue = (value: StructuredDataPropertyValue): unknown => {
  if (Array.isArray(value)) return value.map(serializeValue);
  if (isPropertyMap(value)) return serializeProperties(value);
  return value;
};

const isPropertyMap = (value: StructuredDataPropertyValue): value is StructuredDataPropertyMap =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const serializeProperties = (properties: StructuredDataPropertyMap): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, serializeValue(value)]),
  );

const serializeNode = (node: StructuredDataNode): Record<string, unknown> => {
  if (node.kind === 'reference') return { '@id': node['@id'] };
  return {
    '@type': node['@type'],
    ...(node['@id'] ? { '@id': node['@id'] } : {}),
    ...(node.url ? { url: node.url } : {}),
    ...(node.name ? { name: node.name } : {}),
    ...serializeProperties(node.properties),
  };
};

export const serializeStructuredData = (graph: StructuredDataGraph): SerializedStructuredData =>
  JSON.stringify({
    '@context': graph['@context'],
    '@graph': graph['@graph'].map(serializeNode),
  });
