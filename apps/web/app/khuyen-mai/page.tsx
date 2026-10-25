import Link from 'next/link';
import { buildSEOAssets, toNextMetadata, type SEODescriptor } from '../../lib/seo/metadata';

const descriptor: SEODescriptor = {
  type: 'page',
  title: 'Khuyến mãi',
  description: 'Theo dõi các chương trình ưu đãi và sách mới tại HKT Store',
  canonicalPath: '/khuyen-mai',
  published: true,
  indexable: true,
};

export function generateMetadata() {
  const assets = buildSEOAssets(descriptor);
  if (!assets.ok) throw new Error('Invalid promotion SEO descriptor');
  return toNextMetadata(assets.value.metadata);
}

export default function PromotionPage() {
  return (
    <main className="promotion-page">
      <section className="promotion-hero">
        <p className="eyebrow">HKT Store ưu đãi</p>
        <h1>Chương trình khuyến mãi đang được cập nhật</h1>
        <p>Trong lúc chờ đợi, bạn có thể khám phá những đầu sách mới nhất tại HKT Store</p>
        <Link className="button-link" href="/san-pham">
          Xem sản phẩm
        </Link>
      </section>
      <section className="benefit-grid" aria-label="Quyền lợi HKT Store">
        <article>
          <h2>Freeship linh hoạt</h2>
          <p>Ưu đãi vận chuyển được cập nhật theo từng đợt</p>
        </article>
        <article>
          <h2>Ưu đãi thành viên</h2>
          <p>Theo dõi HKT Store để không bỏ lỡ thông tin mới</p>
        </article>
        <article>
          <h2>Sách mới mỗi tuần</h2>
          <p>Những đầu sách đáng đọc luôn được bổ sung</p>
        </article>
      </section>
    </main>
  );
}