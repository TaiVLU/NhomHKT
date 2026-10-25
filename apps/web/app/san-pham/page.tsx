import Link from 'next/link';
import { MobileFilterDrawer } from '../../features/catalog/mobile-filter-drawer';
import { ProductCard } from '../../features/catalog/product-card';
import {
  buildSEOAssets,
  StructuredDataRenderer,
  toNextMetadata,
  type SEODescriptor,
} from '../../lib/seo/metadata';
import {
  getAuthors,
  getCategories,
  getProducts,
  getPublishers,
  productUrl,
  siteUrl,
} from '../../services/catalog-client';

const meaningfulCatalogParameters = new Set([
  'q',
  'category',
  'author',
  'publisher',
  'inStock',
  'isNew',
  'isFeatured',
  'minPrice',
  'maxPrice',
  'sort',
  'page',
  'pageSize',
]);

const catalogDescriptor = (
  params: Record<string, string | string[] | undefined> = {},
): SEODescriptor => {
  const query = scalarParams(params);
  const hasMeaningfulQuery = [...query.keys()].some((key) => meaningfulCatalogParameters.has(key));
  return {
    type: 'catalog',
    title: 'Sách',
    description: 'Tìm kiếm, lọc và sắp xếp catalog sách HKT Store',
    canonicalPath: '/san-pham',
    published: true,
    indexable: !hasMeaningfulQuery,
    follow: true,
  };
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const assets = buildSEOAssets(catalogDescriptor(searchParams ? await searchParams : {}));
  if (!assets.ok) throw new Error('Invalid catalog SEO descriptor');
  return toNextMetadata(assets.value.metadata);
}

const allowed = new Set([
  'q',
  'category',
  'author',
  'publisher',
  'inStock',
  'isNew',
  'isFeatured',
  'minPrice',
  'maxPrice',
  'sort',
  'page',
  'pageSize',
]);

const sortOptions = [
  ['newest', 'Mới nhất'],
  ['name-asc', 'Tên A-Z'],
  ['name-desc', 'Tên Z-A'],
  ['price-asc', 'Giá tăng'],
  ['price-desc', 'Giá giảm'],
] as const;

const scalarParams = (params: Record<string, string | string[] | undefined>) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key) || typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) query.set(key, trimmed);
  }
  const min = Number(query.get('minPrice'));
  const max = Number(query.get('maxPrice'));
  if (query.has('minPrice') && (!Number.isSafeInteger(min) || min < 0)) query.delete('minPrice');
  if (query.has('maxPrice') && (!Number.isSafeInteger(max) || max < 0)) query.delete('maxPrice');
  if (query.has('minPrice') && query.has('maxPrice') && min > max) {
    query.delete('minPrice');
    query.delete('maxPrice');
  }
  if (query.get('q')) query.set('q', query.get('q')!.trim());
  return query;
};

const hrefWith = (query: URLSearchParams, changes: Record<string, string | null>) => {
  const next = new URLSearchParams(query);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
  }
  if (!('page' in changes)) next.delete('page');
  const value = next.toString();
  return value ? `/san-pham?${value}` : '/san-pham';
};

const pages = (current: number, total: number): Array<number | 'gap'> => {
  const values = new Set([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const sorted = [...values].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  return sorted.flatMap((page, index) =>
    index > 0 && page - sorted[index - 1]! > 1 ? (['gap', page] as const) : [page],
  );
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = scalarParams(params);
  const [result, categories, authors, publishers] = await Promise.all([
    getProducts(query.toString()),
    getCategories(),
    getAuthors(),
    getPublishers(),
  ]);
  const page = Math.max(1, Number(query.get('page') ?? 1) || 1);
  const totalPages = Math.max(1, Math.ceil(result.meta.total / result.meta.pageSize));
  const labels = new Map<string, string>([
    ...categories.map((item) => [`category:${item.slug}`, item.name] as const),
    ...authors.map((item) => [`author:${item.slug}`, item.name] as const),
    ...publishers.map((item) => [`publisher:${item.slug}`, item.name] as const),
  ]);
  const activeFilters = [...query.entries()].filter(
    ([key]) => !['page', 'pageSize', 'sort'].includes(key),
  );
  const hasMeaningfulQuery = [...query.keys()].some((key) => meaningfulCatalogParameters.has(key));
  const structuredData = !hasMeaningfulQuery
    ? buildSEOAssets({
        ...catalogDescriptor({}),
        structuredData: {
          enabled: true,
          collection: {
            name: 'Sách',
            description: 'Tìm kiếm, lọc và sắp xếp catalog sách HKT Store',
            items: result.data.map((product, index) => ({
              name: product.name,
              url: `${siteUrl()}${productUrl(product.slug)}`,
              position: index + 1,
            })),
          },
        },
      })
    : null;
  if (structuredData && !structuredData.ok) {
    throw new Error('Invalid catalog structured data descriptor');
  }

  const renderFilterForm = () => (
    <form className="space-y-4">
      {query.get('q') && <input type="hidden" name="q" value={query.get('q')!} />}
      {query.get('sort') && <input type="hidden" name="sort" value={query.get('sort')!} />}

      {/* Danh mục */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục</h3>
        <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1 text-sm text-slate-700">
          <label className="flex cursor-pointer items-center gap-2 transition hover:text-sky-600">
            <input
              type="radio"
              name="category"
              value=""
              defaultChecked={!query.get('category')}
              className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>Tất cả</span>
          </label>
          {categories.slice(0, 12).map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2 transition hover:text-sky-600"
            >
              <input
                type="radio"
                name="category"
                value={category.slug}
                defaultChecked={query.get('category') === category.slug}
                className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="truncate">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Tác giả */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tác giả</h3>
        <div className="relative">
          <select
            name="author"
            defaultValue={query.get('author') ?? ''}
            aria-label="Tác giả"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:bg-white"
          >
            <option value="">Tất cả tác giả</option>
            {authors.map((author) => (
              <option value={author.slug} key={author.id}>
                {author.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            ▼
          </span>
        </div>
      </div>

      {/* Nhà xuất bản */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Nhà xuất bản</h3>
        <div className="relative">
          <select
            name="publisher"
            defaultValue={query.get('publisher') ?? ''}
            aria-label="Nhà xuất bản"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-sky-500 focus:bg-white"
          >
            <option value="">Tất cả nhà xuất bản</option>
            {publishers.map((publisher) => (
              <option value={publisher.slug} key={publisher.id}>
                {publisher.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            ▼
          </span>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Khoảng giá */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Khoảng giá (₫)</h3>
        <div className="flex items-center gap-2">
          <input
            name="minPrice"
            inputMode="numeric"
            placeholder="Từ"
            defaultValue={query.get('minPrice') ?? ''}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
          />
          <span className="text-slate-400 font-medium">-</span>
          <input
            name="maxPrice"
            inputMode="numeric"
            placeholder="Đến"
            defaultValue={query.get('maxPrice') ?? ''}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Tình trạng */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tình trạng</h3>
        <div className="space-y-2 text-sm text-slate-700">
          <label className="flex cursor-pointer items-center gap-2 transition hover:text-sky-600">
            <input
              type="checkbox"
              name="inStock"
              value="true"
              defaultChecked={query.get('inStock') === 'true'}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>Còn hàng</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 transition hover:text-sky-600">
            <input
              type="checkbox"
              name="isFeatured"
              value="true"
              defaultChecked={query.get('isFeatured') === 'true'}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>Nổi bật</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 transition hover:text-sky-600">
            <input
              type="checkbox"
              name="isNew"
              value="true"
              defaultChecked={query.get('isNew') === 'true'}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>Sách mới</span>
          </label>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-sky-600 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          Áp dụng
        </button>
        <Link
          href="/san-pham"
          className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          Xóa tất cả
        </Link>
      </div>
    </form>
  );

  return (
    <main className="catalog-page pb-24">
      {structuredData?.ok && (
        <StructuredDataRenderer json={structuredData.value.structuredDataJson} />
      )}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <span>Sách</span>
      </nav>
      <header className="catalog-heading">
        <p className="eyebrow tracking-wider">Kệ sách HKT Store</p>
        <h1>Khám phá sách</h1>
        <p>Tìm theo tên sách, tác giả, ISBN hoặc SKU và lọc theo nhu cầu đọc của bạn</p>
      </header>

      <form className="catalog-toolbar flex items-center gap-3" aria-label="Tìm kiếm và sắp xếp sản phẩm">
        {[
          'category',
          'author',
          'publisher',
          'inStock',
          'isNew',
          'isFeatured',
          'minPrice',
          'maxPrice',
        ].map((key) =>
          query.get(key) ? (
            <input key={key} type="hidden" name={key} value={query.get(key)!} />
          ) : null,
        )}
        <label className="search-field">
          <span>Tìm sách</span>
          <input
            name="q"
            defaultValue={query.get('q') ?? ''}
            placeholder="Tên sách, tác giả, ISBN, SKU"
          />
        </label>
        <label>
          <span>Sắp xếp</span>
          <select name="sort" defaultValue={query.get('sort') ?? 'newest'}>
            {sortOptions.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          style={{ borderRadius: '8px' }}
          className="rounded-lg bg-[#0080c8] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0070b0] active:scale-[0.98]"
        >
          Tìm
        </button>
        {query.get('q') && <Link href={hrefWith(query, { q: null })}>Xóa từ khóa</Link>}
      </form>

      <MobileFilterDrawer activeCount={activeFilters.length}>
        {renderFilterForm()}
      </MobileFilterDrawer>

      <div className="catalog-layout flex flex-col md:flex-row items-start gap-8 mb-28">
        <aside className="catalog-sidebar w-full md:w-64 shrink-0" aria-label="Bộ lọc sản phẩm">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <svg
                className="h-5 w-5 text-sky-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <h2 className="text-base font-bold text-slate-800">
                Bộ lọc {activeFilters.length ? `(${activeFilters.length})` : ''}
              </h2>
            </div>
            {renderFilterForm()}
          </div>
        </aside>

        <section className="catalog-results flex-1 w-full" aria-live="polite">
          <div className="result-summary">
            <p>
              {result.meta.total} kết quả, trang {Math.min(page, totalPages)}/{totalPages}
            </p>
            {activeFilters.length > 0 && (
              <div className="active-filters" aria-label="Bộ lọc đang áp dụng">
                {activeFilters.map(([key, value]) => (
                  <Link href={hrefWith(query, { [key]: null })} key={`${key}-${value}`}>
                    {labels.get(`${key}:${value}`) ??
                      (key === 'q'
                        ? `Từ khóa: ${value}`
                        : key === 'inStock'
                          ? 'Còn hàng'
                          : key === 'isFeatured'
                            ? 'Nổi bật'
                            : key === 'isNew'
                              ? 'Sách mới'
                              : `${key}: ${value}`)}
                    <span aria-hidden="true"> ×</span>
                  </Link>
                ))}
                <Link href="/san-pham">Xóa tất cả</Link>
              </div>
            )}
          </div>
          {result.data.length ? (
            <div className="product-grid">
              {result.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Không tìm thấy sách phù hợp</h2>
              <p>Hãy thử bỏ bớt bộ lọc hoặc tìm bằng từ khóa ngắn hơn</p>
              <Link href="/san-pham">Xem tất cả sách</Link>
            </div>
          )}
          <nav className="pagination" aria-label="Phân trang">
            <Link
              aria-disabled={page <= 1}
              href={
                page <= 1
                  ? hrefWith(query, { page: '1' })
                  : hrefWith(query, { page: String(page - 1) })
              }
            >
              Trang trước
            </Link>
            {pages(Math.min(page, totalPages), totalPages).map((item, index) =>
              item === 'gap' ? (
                <span key={`gap-${index}`} aria-hidden="true">
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  href={hrefWith(query, { page: String(item) })}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={`Trang ${item}`}
                >
                  {item}
                </Link>
              ),
            )}
            <Link
              aria-disabled={page >= totalPages}
              href={
                page >= totalPages
                  ? hrefWith(query, { page: String(totalPages) })
                  : hrefWith(query, { page: String(page + 1) })
              }
            >
              Trang sau
            </Link>
          </nav>
        </section>
      </div>
    </main>
  );
}