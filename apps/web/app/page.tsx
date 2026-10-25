import Link from 'next/link';
import { ProductCard } from '../features/catalog/product-card';
import { FlashSaleCountdown } from '../features/catalog/flash-sale-countdown';
import {
  buildSEOAssets,
  StructuredDataRenderer,
  toNextMetadata,
  type SEODescriptor,
} from '../lib/seo/metadata';
import { categoryUrl, getCategories, getProducts, siteUrl } from '../services/catalog-client';

export const dynamic = 'force-dynamic';

const descriptor: SEODescriptor = {
  type: 'home',
  title: 'HKT Store - Thế Giới Manga & Sách Kỹ Năng',
  description: 'HKT Store - Nền tảng mua sắm truyện tranh Manga, Anime hot nhất và sách phát triển kỹ năng dành cho giới trẻ',
  canonicalPath: '/',
  published: true,
  indexable: true,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid home SEO descriptor.');
  return toNextMetadata(assets.value.metadata);
}

export default async function HomePage() {
  const origin = siteUrl();
  const structuredData = buildSEOAssets({
    ...descriptor,
    structuredData: {
      enabled: true,
      site: { name: 'HKT Store', url: origin },
    },
  });
  if (!structuredData.ok) throw new Error('Invalid home structured data descriptor.');
  
  const [featured, newest, categories] = await Promise.all([
    getProducts('isFeatured=true&sort=newest&pageSize=8'),
    getProducts('sort=newest&pageSize=8'),
    getCategories(),
  ]);

  const featuredBooks = featured.data.length ? featured.data : newest.data.slice(0, 8);
  const flashSaleBooks = newest.data.slice(0, 4);

  return (
    <main>
      <StructuredDataRenderer json={structuredData.value.structuredDataJson} />
      <section
        className="hero-section"
        style={{
          borderRadius: '24px',
          border: '1px solid #e0f2fe',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 45%, #ffffff 100%)',
          boxShadow: '0 4px 20px -2px rgba(0, 128, 200, 0.08)',
          padding: '40px',
        }}
      >
        <div className="hero-main-content">
          <p className="eyebrow text-xs font-bold tracking-wider text-[#0080c8] uppercase">
            THẾ GIỚI MANGA & PHÁT TRIỂN KỸ NĂNG
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-4 leading-tight">
            Khám Phá Vũ Trụ <br />
            Manga & Kho Tàng Kỹ Năng <span className="whitespace-nowrap">Thực Chiến</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 mb-6 leading-relaxed">
            Cập nhật liên tục các tập manga hot nhất cùng tuyển tập sách tư duy, 
            kỹ năng sống giúp bạn nâng cấp bản thân mỗi ngày tại HKT Store
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link
              href="/san-pham"
              style={{
                borderRadius: '8px',
                height: '42px',
                padding: '0 20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              className="bg-[#0080c8] text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98]"
            >
              Xem toàn bộ kho truyện
            </Link>
            <Link
              className="text-sm font-semibold text-slate-700 transition hover:text-[#0080c8]"
              href="#sach-moi"
              style={{ padding: '0 12px' }}
            >
              Ấn phẩm mới về
            </Link>
          </div>
        </div>
        <div className="hero-badges-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            className="hero-badge-card"
            style={{
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              padding: '16px 20px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f97316', letterSpacing: '0.05em' }}>
              🔥 HOT TREND
            </span>
            <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              Shonen & Isekai
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>One Piece, Jujutsu Kaisen, Spy x Family</p>
          </div>

          <div
            className="hero-badge-card"
            style={{
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              padding: '16px 20px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#eab308', letterSpacing: '0.05em' }}>
              💡 TRI THỨC
            </span>
            <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              Phát Triển Kỹ Năng
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>Tư duy phản biện, Quản trị thời gian</p>
          </div>

          <div
            className="hero-badge-card"
            style={{
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              padding: '16px 20px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0080c8', letterSpacing: '0.05em' }}>
              CAM KẾT
            </span>
            <strong style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              Chính Hãng 100%
            </strong>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>Bọc sách cẩn thận, ship hỏa tốc</p>
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gợi ý hôm nay</p>
            <h2 id="featured-title">Ấn phẩm nổi bật</h2>
          </div>
          <Link href="/san-pham?isFeatured=true">Xem tất cả</Link>
        </div>
        <div className="product-grid">
          {featuredBooks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section
        className="home-section"
        style={{
          borderRadius: '20px',
          border: '1px solid #fed7aa',
          background: 'linear-gradient(to bottom, #fffaf5, #ffffff)',
          padding: '28px',
          boxShadow: '0 4px 16px rgba(249, 115, 22, 0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            borderBottom: '1px solid #ffedd5',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-orange-600 tracking-tight flex items-center gap-2">
                GIỜ VÀNG SĂN DEAL
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Ưu đãi giảm giá có hạn trong ngày</p>
            </div>
          </div>
          <FlashSaleCountdown />
        </div>
        <div className="product-grid">
          {flashSaleBooks.map((product) => (
            <ProductCard key={`flash-${product.id}`} product={product} />
          ))}
        </div>
      </section>

      <section className="category-section" id="danh-muc" aria-labelledby="category-title">
        <h2 id="category-title" className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-6">
          Thể loại & Chủ đề
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            width: '100%',
          }}
        >
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={categoryUrl(category.slug)}
              style={{
                borderRadius: '12px',
                padding: '14px 10px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="border border-slate-700/80 bg-slate-900/70 text-sm font-semibold text-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-[#0080c8] hover:bg-[#0080c8] hover:text-white hover:shadow-lg hover:shadow-[#0080c8]/30 active:scale-95"
            >
              <span>{category.name}</span>
            </Link>
          ))}
          {!categories.length && <Link href="/san-pham">Khám phá toàn bộ danh mục</Link>}
        </div>
      </section>

      <section className="home-section" id="sach-moi" aria-labelledby="new-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vừa lên kệ</p>
            <h2 id="new-title">Hàng mới cập bến</h2>
          </div>
          <Link href="/san-pham?sort=newest">Xem tất cả</Link>
        </div>
        <div className="product-grid">
          {newest.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="home-cta">
        <h2>Tựa truyện & Cuốn sách tiếp theo đang chờ bạn</h2>
        <p>Khám phá kho manga bản quyền và sách kỹ năng chọn lọc tại HKT Store</p>
        <Link className="button-link light" href="/san-pham">
          Xem tất cả sản phẩm
        </Link>
      </section>
    </main>
  );
}