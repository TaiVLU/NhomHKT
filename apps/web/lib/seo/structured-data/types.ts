export type StructuredDataPrimitive = string | number | boolean | null;

export type StructuredDataPropertyValue =
  StructuredDataPrimitive | StructuredDataPropertyMap | readonly StructuredDataPropertyValue[];

export interface StructuredDataPropertyMap {
  readonly [key: string]: StructuredDataPropertyValue;
}

export type StructuredDataNodeInput =
  StructuredDataSchemaNodeInput | StructuredDataReferenceNodeInput;

export interface StructuredDataSchemaNodeInput {
  readonly kind: 'schema';
  readonly type: string;
  readonly id?: string;
  readonly url?: string;
  readonly name?: string;
  readonly properties?: StructuredDataPropertyMap;
}

export interface StructuredDataReferenceNodeInput {
  readonly kind: 'reference';
  readonly id: string;
}

export type StructuredDataNode = StructuredDataSchemaNode | StructuredDataReferenceNode;

export interface StructuredDataSchemaNode {
  readonly kind: 'schema';
  readonly '@type': string;
  readonly '@id'?: string;
  readonly url?: string;
  readonly name?: string;
  readonly properties: StructuredDataPropertyMap;
}

export interface StructuredDataReferenceNode {
  readonly kind: 'reference';
  readonly '@id': string;
}

export interface StructuredDataGraph {
  readonly '@context': 'https://schema.org';
  readonly '@graph': readonly StructuredDataNode[];
}

export interface StructuredDataDescriptor {
  readonly enabled: boolean;
  readonly nodes?: readonly StructuredDataNodeInput[];
  readonly productBook?: ProductBookStructuredDataDescriptor;
  readonly site?: SiteStructuredDataDescriptor;
  readonly breadcrumb?: BreadcrumbStructuredDataDescriptor;
  readonly collection?: CollectionStructuredDataDescriptor;
}

export type SerializedStructuredData = string;

export interface ProductBookStructuredDataDescriptor {
  readonly authors?: readonly StructuredDataNamedEntity[];
  readonly publisher?: StructuredDataNamedEntity | null;
  readonly variants: readonly ProductOfferStructuredDataDescriptor[];
  readonly images?: readonly string[];
  readonly primaryImage?: string | null;
  readonly sku?: string | null;
  readonly isbn?: string | null;
  readonly language?: string | null;
  readonly releaseDate?: string | null;
  readonly pageCount?: number | null;
}

export interface ProductOfferStructuredDataDescriptor {
  readonly sku: string;
  readonly isbn?: string | null;
  readonly salePrice: number;
  readonly inStock: boolean;
}

export interface StructuredDataNamedEntity {
  readonly name: string;
  readonly slug?: string;
}

export interface SiteStructuredDataDescriptor {
  readonly name: string;
  readonly url: string;
}

export interface BreadcrumbStructuredDataDescriptor {
  readonly items: readonly BreadcrumbStructuredDataItemDescriptor[];
}

export interface BreadcrumbStructuredDataItemDescriptor {
  readonly name: string;
  readonly url: string;
}

export interface CollectionStructuredDataDescriptor {
  readonly name?: string;
  readonly description?: string;
  readonly items?: readonly CollectionStructuredDataItemDescriptor[];
}

export interface CollectionStructuredDataItemDescriptor {
  readonly name: string;
  readonly url: string;
  readonly position?: number;
}
