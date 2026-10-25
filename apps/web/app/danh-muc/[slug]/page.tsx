import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '../../../features/catalog/product-card';
import {
  buildSEOAssets,
  StructuredDataRenderer,
  toNextMetadata,
  type SEODescriptor,
} from '../../../lib/seo/metadata';
import {
  categoryUrl,
  getCategory,
  getProducts,
  productUrl,
  siteUrl,
} from '../../../services/catalog-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  const descriptor: SEODescriptor = category
    ? {
        type: 'category',
        title: category.name,
        description: category.description ?? `Sách thuộc danh mục ${category.name} tại RoSach.`,
        canonicalPath: categoryUrl(category.slug),
        published: true,
        indexable: true,
      }
    : {
        type: 'page',
        title: 'Không tìm thấy danh mục',
        description: 'Danh mục bạn đang tìm không tồn tại hoặc đã được cập nhật.',
        canonicalPath: `/danh-muc/${slug}`,
        published: false,
        indexable: false,
        follow: false,
      };
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid category SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, result] = await Promise.all([
    getCategory(slug),
    getProducts(`category=${encodeURIComponent(slug)}&sort=newest&pageSize=24`),
  ]);
  if (!category) notFound();
  const origin = siteUrl();
  const structuredData = buildSEOAssets({
    type: 'category',
    title: category.name,
    description: category.description ?? `SĂ¡ch thuá»™c danh má»¥c ${category.name} táº¡i RoSach.`,
    canonicalPath: categoryUrl(category.slug),
    published: true,
    indexable: true,
    structuredData: {
      enabled: true,
      breadcrumb: {
        items: [
          { name: 'Trang chá»§', url: origin },
          { name: 'Danh má»¥c', url: `${origin}/danh-muc` },
          { name: category.name, url: `${origin}${categoryUrl(category.slug)}` },
        ],
      },
      collection: {
        name: category.name,
        description:
          category.description ?? `SĂ¡ch thuá»™c danh má»¥c ${category.name} táº¡i RoSach.`,
        items: result.data.map((product, index) => ({
          name: product.name,
          url: `${origin}${productUrl(product.slug)}`,
          position: index + 1,
        })),
      },
    },
  });
  if (!structuredData.ok) throw new Error('Invalid category structured data descriptor.');
  return (
    <main className="catalog-page">
      <StructuredDataRenderer json={structuredData.value.structuredDataJson} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <Link href="/danh-muc">Danh mục</Link>
        <span>/</span>
        <span>{category.name}</span>
      </nav>
      <header className="catalog-heading">
        <p className="eyebrow">Danh mục</p>
        <h1>{category.name}</h1>
        {category.description && <p>{category.description}</p>}
      </header>
      <div className="result-summary">
        <p>{result.meta.total} đầu sách</p>
        <Link href={`/san-pham?category=${encodeURIComponent(category.slug)}`}>
          Mở bộ lọc đầy đủ
        </Link>
      </div>
      {result.data.length ? (
        <section className="product-grid">
          {result.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      ) : (
        <p className="empty-state">Danh mục này đang được cập nhật sách.</p>
      )}
    </main>
  );
}
