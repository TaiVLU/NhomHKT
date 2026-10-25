import Link from 'next/link';
import type { ProductCard as ProductCardData } from '../../services/catalog-client';
import { formatPrice, productUrl } from '../../services/catalog-client';
import { ProductImage } from './product-image';

export function ProductCard({ product }: { product: ProductCardData }) {
  const availability = product.availability ?? {
    availableQuantity: 0,
    inStock: false,
    lowStock: false,
  };
  const status = availability.inStock
    ? availability.lowStock
      ? 'Sắp hết hàng'
      : 'Còn hàng'
    : 'Hết hàng';

  return (
    <article
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#0080c8] hover:shadow-xl hover:shadow-[#0080c8]/10"
      style={{ borderRadius: '16px' }}
    >
      <div>
        <Link className="block overflow-hidden rounded-xl" href={productUrl(product.slug)}>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-50 transition-transform duration-300 group-hover:scale-[1.03]">
            <ProductImage
              src={product.primaryImage?.url}
              alt={product.primaryImage?.altText || product.name}
            />
            {!availability.inStock && (
              <span className="absolute left-2 top-2 rounded-md bg-rose-500/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
                Hết hàng
              </span>
            )}
            {product.isNew && (
              <span className="absolute right-2 top-2 rounded-md bg-[#0080c8] px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                Mới
              </span>
            )}
          </div>
          <h2 className="mt-3 line-clamp-2 text-sm font-bold text-slate-900 transition-colors duration-200 group-hover:text-[#0080c8]">
            {product.name}
          </h2>
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
          {product.authors.map((a) => a.name).join(', ') || 'Đang cập nhật tác giả'}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-baseline justify-between gap-1">
          <strong className="text-base font-extrabold text-[#0080c8]">
            {product.minPrice === product.maxPrice
              ? formatPrice(product.minPrice)
              : `Từ ${formatPrice(product.minPrice)}`}
          </strong>
          {product.maxPrice > product.minPrice && (
            <span className="text-[11px] font-medium text-slate-400">Nhiều bản</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={`text-xs font-semibold ${
              availability.inStock
                ? availability.lowStock
                  ? 'text-amber-600'
                  : 'text-emerald-600'
                : 'text-rose-500'
            }`}
          >
            {status}
          </span>
          <Link
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-[#0080c8] hover:bg-sky-50 hover:text-[#0080c8]"
            href={productUrl(product.slug)}
            style={{ borderRadius: '6px' }}
          >
            <span>Xem chi tiết</span>
            <span aria-hidden="true" className="text-[10px]">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}