'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiBaseUrl } from '../../../lib/environment';
import { TaxonomyManager } from '../../../features/catalog/taxonomy-manager';
import { ProductImage } from '../../../features/catalog/product-image';
import { bootstrapSession, getAccessToken, getCurrentRole } from '../../../services/auth-client';

interface Row {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  deletedAt: string | null;
  primaryImage: { url: string; altText: string } | null;
  images: Array<{ url: string; altText: string }>;
  availability: { availableQuantity: number; inStock: boolean; lowStock: boolean };
  variants: Array<{
    id: string;
    sku: string;
    salePrice: number;
    costPrice?: number;
    isActive: boolean;
    inventory?: { availableQuantity: number } | null;
  }>;
}

const minimum = (values: number[]): number => (values.length ? Math.min(...values) : 0);

export default function AdminCatalogPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const load = async (requestedPage = page) => {
    setLoading(true);
    if (!getAccessToken() && !(await bootstrapSession())) {
      router.replace('/admin/login?returnUrl=/admin/catalog');
      return;
    }
    setRole(getCurrentRole());
    const response = await fetch(`${apiBaseUrl}/admin/products?page=${requestedPage}&pageSize=12`, {
      headers: { authorization: `Bearer ${getAccessToken() ?? ''}` },
    });
    setLoading(false);
    if (!response.ok) {
      setError('Không thể tải catalog theo quyền hiện tại.');
      return;
    }
    const body = (await response.json()) as {
      data: Row[];
      meta?: { total?: number; totalPages?: number };
    };
    setRows(Array.isArray(body.data) ? body.data : []);
    setMeta({
      total: body.meta?.total ?? body.data.length,
      totalPages: body.meta?.totalPages ?? 1,
    });
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = data.get('name');
    const shortDescription = data.get('shortDescription');
    const response = await fetch(`${apiBaseUrl}/admin/products`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${getAccessToken() ?? ''}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: typeof name === 'string' ? name : '',
        shortDescription: typeof shortDescription === 'string' ? shortDescription : '',
        categoryIds: [],
        authorIds: [],
        isActive: false,
      }),
    });
    if (!response.ok) {
      setCreating(false);
      setError('Sản phẩm không hợp lệ. Vui lòng nhập tên có ý nghĩa trước khi tạo.');
      return;
    }
    const body = (await response.json()) as { data?: { id?: string } };
    if (!body.data?.id) {
      setCreating(false);
      setError('Đã tạo sản phẩm nhưng chưa nhận được mã để mở trình biên tập.');
      await load();
      return;
    }
    router.push(`/admin/catalog/${body.data.id}?created=1`);
  };

  const remove = async (id: string) => {
    if (!confirm('Ẩn sản phẩm này khỏi catalog?')) return;
    await fetch(`${apiBaseUrl}/admin/products/${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${getAccessToken() ?? ''}` },
    });
    await load();
  };

  const admin = role === 'ADMIN';
  const visibleRows = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      `${row.name} ${row.slug} ${row.variants.map((variant) => variant.sku).join(' ')}`
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <main className="catalog-page admin-catalog-page max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-[44px] font-normal tracking-tight text-slate-900">Quản lý catalog</h1>
          {admin && (
            <p className="text-sm text-slate-500 mt-1">
              Tạo nhanh sản phẩm ở trạng thái chưa hiển thị, sau đó hoàn thiện thông tin, phiên bản và hình ảnh trong trình biên tập.
            </p>
          )}
        </div>
        <strong className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
          {meta.total} sản phẩm
        </strong>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium" role="alert">
          {error}
        </div>
      )}

      {/* Form Tạo nhanh sản phẩm */}
      {admin && (
        <form
          onSubmit={(event) => void create(event)}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-end gap-4"
        >
          <label className="flex-1 min-w-[240px] flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            <span>Tên sản phẩm *</span>
            <input
              required
              name="name"
              placeholder="Nhập tên sách, truyện..."
              className="border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 h-[40px] focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            />
          </label>
          <label className="flex-1 min-w-[240px] flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
            <span>Mô tả ngắn</span>
            <input
              name="shortDescription"
              placeholder="Tóm tắt ngắn nội dung..."
              className="border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 h-[40px] focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            />
          </label>
          <button
            disabled={creating}
            className="px-5 text-sm font-semibold rounded-lg bg-[#0080c8] text-white hover:bg-sky-600 transition-colors shadow-sm h-[40px] flex items-center justify-center cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {creating ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </button>
        </form>
      )}

      {/* Tìm kiếm & Grid sản phẩm */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm font-medium" aria-busy="true">
          Đang tải dữ liệu sản phẩm...
        </div>
      ) : (
        <div className="space-y-6">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 max-w-xl">
            <span>Tìm sản phẩm</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên sách, slug hoặc mã SKU phiên bản..."
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 h-[42px] focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white shadow-sm"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" role="list">
            {visibleRows.map((row) => {
              const statusClass = row.deletedAt
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : row.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';

              const statusText = row.deletedAt
                ? 'Đã ẩn'
                : row.isActive
                ? 'Đang hiển thị'
                : 'Ngừng hiển thị';

              const minSale = minimum(row.variants.map((v) => v.salePrice));
              const costPrices = row.variants.flatMap((v) =>
                v.costPrice === undefined ? [] : [v.costPrice]
              );
              const minCost = minimum(costPrices);

              const totalAvailable =
                row.availability?.availableQuantity ??
                row.variants.reduce(
                  (total, v) => total + (v.inventory?.availableQuantity ?? 0),
                  0
                );

              return (
                <article
                  key={row.id}
                  role="listitem"
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Ảnh bìa sản phẩm */}
                  <div className="w-24 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 relative">
                    <ProductImage
                      src={row.primaryImage?.url ?? row.images?.[0]?.url}
                      alt={row.primaryImage?.altText ?? row.images?.[0]?.altText ?? row.name}
                    />
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="text-base font-semibold text-slate-900 line-clamp-1 hover:text-sky-600 transition-colors">
                          <Link href={`/admin/catalog/${row.id}`} title={row.name}>
                            {row.name}
                          </Link>
                        </h2>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border whitespace-nowrap ${statusClass}`}
                        >
                          {statusText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate mb-3">{row.slug}</p>

                      {/* Thông số grid 2x2 */}
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <dt className="text-slate-400">Phiên bản active</dt>
                          <dd className="font-semibold text-slate-800">
                            {row.variants.filter((v) => v.isActive).length}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Giá bán từ</dt>
                          <dd className="font-semibold text-slate-900 font-mono">
                            {minSale.toLocaleString('vi-VN')} ₫
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Khả dụng</dt>
                          <dd className="font-semibold text-slate-800">{totalAvailable}</dd>
                        </div>
                        {admin && (
                          <div>
                            <dt className="text-slate-400">Giá vốn từ</dt>
                            <dd className="font-semibold text-slate-700 font-mono">
                              {costPrices.length ? `${minCost.toLocaleString('vi-VN')} ₫` : '—'}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <Link
                        className="font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors"
                        href={`/admin/catalog/${row.id}`}
                      >
                        {admin ? 'Chỉnh sửa' : 'Xem chi tiết'}
                      </Link>
                      <Link
                        className="font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                        href={`/sach/${row.slug}`}
                        target="_blank"
                      >
                        Xem trang bán
                      </Link>
                      {admin && (
                        <button
                          type="button"
                          className="font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 px-2.5 py-1.5 rounded-lg transition-colors ml-auto cursor-pointer"
                          onClick={() => void remove(row.id)}
                        >
                          Ẩn
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Phân trang */}
          <nav className="flex items-center justify-between text-sm pt-4" aria-label="Phân trang catalog">
            <button
              type="button"
              className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
              disabled={page <= 1}
              onClick={() => {
                const next = page - 1;
                setPage(next);
                void load(next);
              }}
            >
              Trang trước
            </button>
            <span className="font-medium text-slate-600 text-xs">
              Trang {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700"
              disabled={page >= meta.totalPages}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                void load(next);
              }}
            >
              Trang sau
            </button>
          </nav>
        </div>
      )}

      {/* Quản lý phân loại */}
      <section className="pt-6 border-t border-slate-200">
        <TaxonomyManager admin={admin} />
      </section>
    </main>
  );
}