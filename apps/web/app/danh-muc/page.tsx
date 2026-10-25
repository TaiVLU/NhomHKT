import Link from 'next/link';
import {
  buildSEOAssets,
  StructuredDataRenderer,
  toNextMetadata,
  type SEODescriptor,
} from '../../lib/seo/metadata';
import { categoryUrl, getCategories, siteUrl } from '../../services/catalog-client';

export const dynamic = 'force-dynamic';

const descriptor: SEODescriptor = {
  type: 'category',
  title: 'Danh mục sách & Manga',
  description: 'Khám phá sách và manga theo chủ đề, thể loại tại HKT Store',
  canonicalPath: '/danh-muc',
  published: true,
  indexable: true,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid category list SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  const origin = siteUrl();

  const structuredData = buildSEOAssets({
    ...descriptor,
    structuredData: {
      enabled: true,
      collection: {
        name: 'Danh mục sách & Manga',
        description: 'Khám phá sách theo chủ đề và danh mục tại HKT Store',
        items: categories.map((category, index) => ({
          name: category.name,
          url: `${origin}${categoryUrl(category.slug)}`,
          position: index + 1,
        })),
      },
    },
  });

  if (!structuredData.ok) throw new Error('Invalid category list structured data descriptor.');

  return (
    <main className="category-page min-h-screen pb-20">
      {structuredData.ok && (
        <StructuredDataRenderer json={structuredData.value.structuredDataJson} />
      )}

      {/* Header đã tăng kích thước chữ và khoảng cách thoáng mắt */}
      <header className="py-12 md:py-16 px-4 text-center border-b border-slate-100 bg-slate-50/50">
        <span className="inline-block px-4 py-1.5 text-xs md:text-sm font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 rounded-full border border-blue-200/60 mb-4">
          Khám phá theo chủ đề
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
          Danh mục sách & Manga
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Chọn một chủ đề để bắt đầu hành trình tìm kiếm tựa truyện và cuốn sách hợp gu nhất.
        </p>
      </header>

      {/* Grid danh mục có animation mượt mà */}
      <section className="category-card-grid max-w-7xl mx-auto px-4 py-12" aria-label="Danh sách danh mục">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={categoryUrl(category.slug)}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 active:scale-[0.98]"
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-sky-500">
                Danh mục
              </span>
              <strong className="mt-2 block text-xl font-bold text-slate-800 transition-colors group-hover:text-[#0080c8]">
                {category.name}
              </strong>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors group-hover:text-slate-700">
              <span>Khám phá sách</span>
              <span className="inline-block text-sky-600 transition-transform duration-300 ease-out group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
        {!categories.length && (
          <p className="empty-state text-center text-slate-400 py-12">
            Danh mục đang được cập nhật.
          </p>
        )}
      </section>
    </main>
  );
}