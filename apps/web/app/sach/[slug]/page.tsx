import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { ProductCard } from '../../../features/catalog/product-card';
import { ProductDetailExperience } from '../../../features/catalog/product-detail-experience';
import {
  buildSEOAssets,
  StructuredDataRenderer,
  toNextMetadata,
  type SEODescriptor,
} from '../../../lib/seo/metadata';
import {
  getProduct,
  productUrl,
  siteUrl,
  type ProductDetail,
} from '../../../services/catalog-client';

const productDescriptor = (
  product: ProductDetail,
  options: { readonly includeStructuredData?: boolean } = {},
): SEODescriptor => ({
  type: 'book',
  title: product.seoTitle ?? product.name,
  canonicalPath: productUrl(product.slug),
  published: true,
  indexable: true,
  ...((product.seoDescription ?? product.shortDescription)
    ? { description: product.seoDescription ?? product.shortDescription ?? '' }
    : {}),
  ...(product.primaryImage?.url ? { imagePath: product.primaryImage.url } : {}),
  ...(options.includeStructuredData
    ? {
        structuredData: {
          enabled: true,
          breadcrumb: {
            items: [
              { name: 'Trang chủ', url: siteUrl() },
              { name: 'Sách', url: `${siteUrl()}/san-pham` },
              { name: product.name, url: `${siteUrl()}${productUrl(product.slug)}` },
            ],
          },
          productBook: {
            authors: product.authors,
            publisher: product.publisher,
            variants: product.variants.map((variant) => ({
              sku: variant.sku,
              ...(variant.isbn ? { isbn: variant.isbn } : {}),
              salePrice: variant.salePrice,
              inStock: variant.availability.inStock,
            })),
            images: product.images
              .map((image) => image.url)
              .filter((url): url is string => Boolean(url)),
            primaryImage: product.primaryImage?.url ?? null,
            language: product.language,
            releaseDate: product.releaseDate,
            pageCount: product.pageCount,
          },
        },
      }
    : {}),
});

const missingProductDescriptor = (slug: string): SEODescriptor => ({
  type: 'book',
  title: 'Không tìm thấy sách',
  description: 'Cuốn sách bạn đang tìm không tồn tại hoặc đã được cập nhật',
  canonicalPath: `/sach/${slug}`,
  published: false,
  indexable: false,
  follow: false,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  const descriptor = product ? productDescriptor(product) : missingProductDescriptor(slug);
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid book SEO descriptor');
  return toNextMetadata(assets.value.metadata);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const assets = buildSEOAssets(productDescriptor(product, { includeStructuredData: true }));
  if (!assets.ok) throw new Error('Invalid book structured data descriptor');
  return (
    <main className="product-detail-page">
      <StructuredDataRenderer json={assets.value.structuredDataJson} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/san-pham">Sách</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <ProductDetailExperience product={product} />
      {product.description && (
        <section className="detail-section product-description">
          <h2>Mô tả sản phẩm</h2>
          <div className="markdown">
            <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {product.description}
            </ReactMarkdown>
          </div>
        </section>
      )}
      {!!product.relatedProducts.length && (
        <section className="detail-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cùng gu đọc</p>
              <h2>Sách cùng thể loại</h2>
            </div>
          </div>
          <div className="product-grid">
            {product.relatedProducts.slice(0, 4).map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}