import { seoIssue, seoOk, type SEOIssue, type SEOResult } from '../core/result';
import { createStructuredDataGraphBuilder } from './graph-builder';
import type {
  ProductBookStructuredDataDescriptor,
  ProductOfferStructuredDataDescriptor,
  SiteStructuredDataDescriptor,
  StructuredDataDescriptor,
  StructuredDataGraph,
  StructuredDataNamedEntity,
  StructuredDataNodeInput,
  StructuredDataPropertyMap,
} from './types';

export interface StructuredDataSEODescriptor {
  readonly title?: string;
  readonly description?: string;
  readonly canonicalUrl?: string;
  readonly imageUrl?: string;
  readonly structuredData?: StructuredDataDescriptor;
}

export const composeStructuredDataDescriptor = (
  structuredData?: StructuredDataDescriptor,
): StructuredDataSEODescriptor => (structuredData ? { structuredData } : {});

export const createStructuredDataAssets = (
  descriptor: StructuredDataSEODescriptor,
): SEOResult<StructuredDataGraph | null> => {
  if (!descriptor.structuredData?.enabled) return seoOk(null);
  const nodes = [
    ...(descriptor.structuredData.nodes ?? []),
    ...siteNodes(descriptor.structuredData.site),
    ...breadcrumbNodes(descriptor),
    ...collectionNodes(descriptor),
    ...productBookNodes(descriptor),
  ];
  if (nodes.length === 0) return seoOk(null);
  const graph = createStructuredDataGraphBuilder().appendMany(nodes).freeze();
  if (!graph.ok) return graph;
  return seoOk(graph.value, [
    ...graph.issues,
    ...productBookIssues(descriptor.structuredData.productBook),
  ]);
};

const schemaReference = (id: string): StructuredDataPropertyMap => ({ '@id': id });

const compact = (value: string): string => value.trim().replace(/\s+/g, ' ');

const normalizeIsbn = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.replace(/[\s-]/g, '').toUpperCase();
  return /^(\d{9}[\dX]|\d{13})$/.test(normalized) ? normalized : null;
};

const productBookIssues = (
  productBook: ProductBookStructuredDataDescriptor | undefined,
): SEOIssue[] => {
  const isbns = [
    productBook?.isbn,
    ...(productBook?.variants.map((variant) => variant.isbn) ?? []),
  ].filter((value): value is string => Boolean(value));
  return isbns
    .filter((isbn) => !normalizeIsbn(isbn))
    .map((isbn) =>
      seoIssue(
        'SEO_STRUCTURED_DATA_ISBN_INVALID',
        `Structured data omitted invalid ISBN value ${isbn}.`,
        'isbn',
        'MINOR',
      ),
    );
};

const person = (entity: StructuredDataNamedEntity): StructuredDataPropertyMap => ({
  '@type': 'Person',
  name: compact(entity.name),
});

const publisher = (entity: StructuredDataNamedEntity): StructuredDataPropertyMap => ({
  '@type': 'Organization',
  name: compact(entity.name),
});

const absoluteUrl = (value: string): string | null => (/^https?:\/\//i.test(value) ? value : null);

const siteNodes = (
  site: SiteStructuredDataDescriptor | undefined,
): readonly StructuredDataNodeInput[] => {
  if (!site) return [];
  const siteUrl = absoluteUrl(site.url);
  if (!siteUrl) return [];
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  return [
    {
      kind: 'schema',
      type: 'Organization',
      id: organizationId,
      url: siteUrl,
      name: compact(site.name),
    },
    {
      kind: 'schema',
      type: 'WebSite',
      id: websiteId,
      url: siteUrl,
      name: compact(site.name),
      properties: {
        publisher: schemaReference(organizationId),
      },
    },
  ];
};

const breadcrumbNodes = (
  descriptor: StructuredDataSEODescriptor,
): readonly StructuredDataNodeInput[] => {
  const breadcrumb = descriptor.structuredData?.breadcrumb;
  if (!breadcrumb || !descriptor.canonicalUrl) return [];
  const items = breadcrumb.items
    .map((item, index): StructuredDataPropertyMap | null => {
      const itemUrl = absoluteUrl(item.url);
      if (!itemUrl) return null;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: compact(item.name),
        item: itemUrl,
      };
    })
    .filter((item): item is StructuredDataPropertyMap => Boolean(item));
  if (items.length === 0) return [];

  return [
    {
      kind: 'schema',
      type: 'BreadcrumbList',
      id: `${descriptor.canonicalUrl}#breadcrumb`,
      url: descriptor.canonicalUrl,
      ...(descriptor.title ? { name: descriptor.title } : {}),
      properties: {
        itemListElement: items,
      },
    },
  ];
};

const collectionNodes = (
  descriptor: StructuredDataSEODescriptor,
): readonly StructuredDataNodeInput[] => {
  const collection = descriptor.structuredData?.collection;
  if (!collection || !descriptor.canonicalUrl) return [];
  const itemListId = `${descriptor.canonicalUrl}#item-list`;
  const collectionName = collection.name ?? descriptor.title;
  const items = (collection.items ?? [])
    .map((item, index): StructuredDataPropertyMap | null => {
      const itemUrl = absoluteUrl(item.url);
      if (!itemUrl) return null;
      return {
        '@type': 'ListItem',
        position: item.position ?? index + 1,
        url: itemUrl,
        name: compact(item.name),
      };
    })
    .filter((item): item is StructuredDataPropertyMap => Boolean(item));

  return [
    {
      kind: 'schema',
      type: 'CollectionPage',
      id: `${descriptor.canonicalUrl}#collection`,
      url: descriptor.canonicalUrl,
      ...(collectionName ? { name: collectionName } : {}),
      properties: {
        ...((collection.description ?? descriptor.description)
          ? { description: collection.description ?? descriptor.description }
          : {}),
        mainEntity: schemaReference(itemListId),
      },
    },
    {
      kind: 'schema',
      type: 'ItemList',
      id: itemListId,
      url: descriptor.canonicalUrl,
      ...(collectionName ? { name: collectionName } : {}),
      properties: {
        itemListElement: items,
      },
    },
  ];
};

const offerAvailability = (variant: ProductOfferStructuredDataDescriptor): string =>
  variant.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

const selectedOffer = (
  productBook: ProductBookStructuredDataDescriptor,
): ProductOfferStructuredDataDescriptor | null => {
  const sorted = [...productBook.variants].sort(
    (left, right) =>
      Number(right.inStock) - Number(left.inStock) ||
      left.salePrice - right.salePrice ||
      left.sku.localeCompare(right.sku),
  );
  return sorted[0] ?? null;
};

const productBookNodes = (
  descriptor: StructuredDataSEODescriptor,
): readonly StructuredDataNodeInput[] => {
  const productBook = descriptor.structuredData?.productBook;
  if (!productBook || !descriptor.canonicalUrl || !descriptor.title || !descriptor.description) {
    return [];
  }

  const offer = selectedOffer(productBook);
  if (!offer) return [];

  const canonical = descriptor.canonicalUrl;
  const productId = `${canonical}#product`;
  const bookId = `${canonical}#book`;
  const offerId = `${canonical}#offer`;
  const images = [descriptor.imageUrl, productBook.primaryImage, ...(productBook.images ?? [])]
    .filter((value): value is string => Boolean(value))
    .filter((value) => /^https?:\/\//i.test(value))
    .filter((value, index, values) => values.indexOf(value) === index);
  const isbn = normalizeIsbn(productBook.isbn) ?? normalizeIsbn(offer.isbn);

  const productProperties: StructuredDataPropertyMap = {
    image: images,
    offers: schemaReference(offerId),
    ...(offer.sku ? { sku: compact(offer.sku) } : {}),
    ...(isbn ? { isbn } : {}),
  };
  const bookProperties: StructuredDataPropertyMap = {
    image: images,
    workExample: schemaReference(productId),
    offers: schemaReference(offerId),
    ...(isbn ? { isbn } : {}),
    ...(productBook.authors?.length ? { author: productBook.authors.map(person) } : {}),
    ...(productBook.publisher ? { publisher: publisher(productBook.publisher) } : {}),
    ...(productBook.language ? { inLanguage: compact(productBook.language) } : {}),
    ...(productBook.releaseDate ? { datePublished: productBook.releaseDate } : {}),
    ...(productBook.pageCount ? { numberOfPages: productBook.pageCount } : {}),
  };

  return [
    {
      kind: 'schema',
      type: 'Product',
      id: productId,
      url: canonical,
      name: descriptor.title,
      properties: {
        description: descriptor.description,
        ...productProperties,
      },
    },
    {
      kind: 'schema',
      type: 'Book',
      id: bookId,
      url: canonical,
      name: descriptor.title,
      properties: {
        description: descriptor.description,
        ...bookProperties,
      },
    },
    {
      kind: 'schema',
      type: 'Offer',
      id: offerId,
      url: canonical,
      name: descriptor.title,
      properties: {
        price: offer.salePrice,
        priceCurrency: 'VND',
        availability: offerAvailability(offer),
        sku: compact(offer.sku),
      },
    },
  ];
};
