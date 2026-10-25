'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  adminOrdersApi,
  type AdminOrderListQuery,
  type AdminOrderRow,
} from '../../services/admin-orders-client';
import {
  formatOrderDate,
  money,
  orderStatusOptions,
  paymentMethodOptions,
  paymentStatusOptions,
  sortOptions,
  statusLabel,
} from './admin-order-format';

const pageSize = 10;

const param = (params: URLSearchParams, key: string) => params.get(key)?.trim() || undefined;
const formText = (form: FormData, key: string): string => {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
};

const queryFromParams = (params: URLSearchParams): AdminOrderListQuery => ({
  page: Math.max(1, Number(params.get('page')) || 1),
  pageSize,
  search: param(params, 'search'),
  orderStatus: param(params, 'orderStatus'),
  paymentStatus: param(params, 'paymentStatus'),
  paymentMethod: param(params, 'paymentMethod'),
  dateFrom: param(params, 'dateFrom'),
  dateTo: param(params, 'dateTo'),
  sort: (param(params, 'sort') as AdminOrderListQuery['sort']) ?? 'newest',
});

const toUrl = (query: AdminOrderListQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString();
  return suffix ? `/admin/orders?${suffix}` : '/admin/orders';
};

function getOrderStatusStyle(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PENDING_CONFIRMATION':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CONFIRMED':
    case 'PACKING':
    case 'SHIPPING':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getOrderStatusStyle(
        value,
      )}`}
    >
      {statusLabel(value)}
    </span>
  );
}

function AdminOrdersLoading() {
  return (
    <section className="admin-orders-panel" aria-busy="true" aria-live="polite">
      <div className="skeleton skeleton-title" />
      <div className="order-card skeleton-card" />
      <div className="order-card skeleton-card" />
    </section>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | undefined;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={defaultValue ?? ''}>
        <option value="">Tất cả</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function OrderRow({ order }: { order: AdminOrderRow }) {
  const isPaid = order.paymentStatus === 'PAID';

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
      <th scope="row" className="py-4 px-4 font-mono font-semibold text-slate-900 text-sm">
        <Link href={`/admin/orders/${order.orderNumber}`} className="hover:text-sky-600 transition-colors">
          {order.orderNumber}
        </Link>
      </th>
      <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
        {formatOrderDate(order.createdAt)}
      </td>
      <td className="py-4 px-4 text-sm">
        <strong className="block text-slate-900 font-semibold">{order.recipientName}</strong>
        <span className="block text-xs text-slate-500 font-mono mt-0.5">{order.customerEmail}</span>
      </td>
      <td className="py-4 px-4">
        <StatusBadge value={order.orderStatus} />
      </td>
      <td className="py-4 px-4 text-xs">
        <div className="flex items-center gap-1.5 font-semibold mb-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className={isPaid ? 'text-emerald-700' : 'text-amber-700'}>
            {statusLabel(order.paymentStatus)}
          </span>
        </div>
        <span className="text-slate-400 text-[11px] block">{statusLabel(order.paymentMethod)}</span>
      </td>
      <td className="py-4 px-4 text-center font-medium text-slate-700 text-sm">{order.itemCount}</td>
      <td className="py-4 px-4 text-right font-bold text-slate-900 text-sm font-mono whitespace-nowrap">
        {money(order.grandTotal)}
      </td>
      <td className="py-4 px-4 text-center">
        <Link
          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap"
          href={`/admin/orders/${order.orderNumber}`}
        >
          Xem chi tiết
        </Link>
      </td>
    </tr>
  );
}

function OrderCard({ order }: { order: AdminOrderRow }) {
  return (
    <article className="admin-order-mobile-card">
      <div>
        <p className="eyebrow">Mã đơn</p>
        <h2>
          <Link href={`/admin/orders/${order.orderNumber}`}>{order.orderNumber}</Link>
        </h2>
        <p>{formatOrderDate(order.createdAt)}</p>
      </div>
      <dl>
        <div>
          <dt>Người nhận</dt>
          <dd>{order.recipientName}</dd>
        </div>
        <div>
          <dt>Trạng thái</dt>
          <dd>
            <StatusBadge value={order.orderStatus} />
          </dd>
        </div>
        <div>
          <dt>Thanh toán</dt>
          <dd>{statusLabel(order.paymentStatus)}</dd>
        </div>
        <div>
          <dt>Tổng</dt>
          <dd>{money(order.grandTotal)}</dd>
        </div>
      </dl>
      <Link className="secondary-link" href={`/admin/orders/${order.orderNumber}`}>
        Xem chi tiết
      </Link>
    </article>
  );
}

export function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => queryFromParams(searchParams), [searchParams]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [meta, setMeta] = useState({ page: query.page ?? 1, pageSize, total: 0, totalPages: 1 });
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'error' | 'invalid' | 'unauthorized' | 'forbidden'
  >('loading');
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      setStatus('invalid');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    void adminOrdersApi
      .list(query)
      .then((result) => {
        if (cancelled) return;
        setOrders(result.data);
        setMeta(result.meta);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const code =
          error instanceof Error && 'code' in error && typeof error.code === 'string'
            ? error.code
            : null;
        if (code === 'AUTH_UNAUTHORIZED') setStatus('unauthorized');
        else if (code === 'FORBIDDEN_PERMISSION') setStatus('forbidden');
        else setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [query, retryVersion]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: AdminOrderListQuery = {
      page: 1,
      pageSize,
      search: formText(form, 'search').trim() || undefined,
      orderStatus: formText(form, 'orderStatus') || undefined,
      paymentStatus: formText(form, 'paymentStatus') || undefined,
      paymentMethod: formText(form, 'paymentMethod') || undefined,
      dateFrom: formText(form, 'dateFrom') || undefined,
      dateTo: formText(form, 'dateTo') || undefined,
      sort: (formText(form, 'sort') as AdminOrderListQuery['sort']) || 'newest',
    };
    if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
      setStatus('invalid');
      return;
    }
    router.push(toUrl(next));
  };

  const hasFilters = Boolean(
    query.search ||
      query.orderStatus ||
      query.paymentStatus ||
      query.paymentMethod ||
      query.dateFrom ||
      query.dateTo,
  );

  return (
    <main className="admin-orders-page">
      <header className="orders-heading mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-tight text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu, lọc, xem chi tiết và xử lý trạng thái đơn hàng theo quyền hiện tại.
          </p>
        </div>
        <strong className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
          {status === 'ready' ? `${meta.total} kết quả` : 'Đang đồng bộ'}
        </strong>
      </header>

      <form className="admin-order-filters mb-6" onSubmit={submit}>
        <label className="admin-order-search">
          Tìm kiếm
          <input
            name="search"
            defaultValue={query.search ?? ''}
            placeholder="Mã đơn, người nhận, số điện thoại, email"
          />
        </label>
        <FilterSelect
          label="Trạng thái đơn"
          name="orderStatus"
          defaultValue={query.orderStatus}
          options={orderStatusOptions}
        />
        <FilterSelect
          label="Thanh toán"
          name="paymentStatus"
          defaultValue={query.paymentStatus}
          options={paymentStatusOptions}
        />
        <FilterSelect
          label="Phương thức"
          name="paymentMethod"
          defaultValue={query.paymentMethod}
          options={paymentMethodOptions}
        />
        <label>
          Từ ngày
          <input name="dateFrom" type="date" defaultValue={query.dateFrom ?? ''} />
        </label>
        <label>
          Đến ngày
          <input name="dateTo" type="date" defaultValue={query.dateTo ?? ''} />
        </label>
        <label>
          Sắp xếp
          <select name="sort" defaultValue={query.sort ?? 'newest'}>
            {sortOptions.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-filter-actions">
          <button type="submit">Áp dụng</button>
          {hasFilters && (
            <Link className="secondary-link" href="/admin/orders">
              Xóa bộ lọc
            </Link>
          )}
        </div>
      </form>

      {status === 'loading' && <AdminOrdersLoading />}
      {status === 'invalid' && (
        <section className="orders-empty" role="alert">
          <h2>Khoảng ngày không hợp lệ</h2>
          <p>Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.</p>
        </section>
      )}
      {status === 'error' && (
        <section className="orders-empty" role="alert">
          <h2>Không thể tải dữ liệu đơn hàng.</h2>
          <p>Kết nối dữ liệu tạm thời gián đoạn. Vui lòng thử lại.</p>
          <button type="button" onClick={() => setRetryVersion((value) => value + 1)}>
            Thử lại
          </button>
        </section>
      )}
      {status === 'unauthorized' && (
        <section className="orders-empty" role="alert">
          <h2>Phiên đăng nhập đã hết hạn</h2>
          <p>Vui lòng đăng nhập lại để tiếp tục.</p>
          <Link className="secondary-link" href="/admin/login?returnUrl=/admin/orders">
            Đăng nhập
          </Link>
        </section>
      )}
      {status === 'forbidden' && (
        <section className="orders-empty" role="alert">
          <h2>Không có quyền truy cập</h2>
          <p>Tài khoản hiện tại không có quyền đọc đơn hàng.</p>
        </section>
      )}
      {status === 'ready' && orders.length === 0 && (
        <section className="orders-empty">
          <h2>{hasFilters ? 'Không có đơn hàng phù hợp' : 'Chưa có đơn hàng'}</h2>
          <p>
            {hasFilters
              ? 'Hãy điều chỉnh bộ lọc hoặc tìm kiếm bằng thông tin khác.'
              : 'Các đơn hàng mới từ checkout sẽ xuất hiện tại đây.'}
          </p>
        </section>
      )}
      {status === 'ready' && orders.length > 0 && (
        <>
          <div className="admin-orders-table-wrap overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <table className="admin-orders-table w-full text-left border-collapse">
              <caption className="sr-only">Danh sách đơn hàng</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3 px-4">Mã đơn</th>
                  <th scope="col" className="py-3 px-4">Ngày tạo</th>
                  <th scope="col" className="py-3 px-4">Khách hàng / người nhận</th>
                  <th scope="col" className="py-3 px-4">Trạng thái</th>
                  <th scope="col" className="py-3 px-4">Thanh toán</th>
                  <th scope="col" className="py-3 px-4 text-center">SL</th>
                  <th scope="col" className="py-3 px-4 text-right">Tổng</th>
                  <th scope="col" className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <OrderRow order={order} key={order.orderNumber} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-orders-mobile-list">
            {orders.map((order) => (
              <OrderCard order={order} key={order.orderNumber} />
            ))}
          </div>
          <nav className="pagination mt-6 flex items-center justify-between text-sm" aria-label="Phân trang đơn hàng admin">
            {meta.page > 1 ? (
              <Link href={toUrl({ ...query, page: meta.page - 1 })} className="px-3 py-1.5 border rounded-lg hover:bg-slate-50">
                Trang trước
              </Link>
            ) : <span />}
            <span className="font-medium text-slate-600">
              Trang {meta.page} / {meta.totalPages}
            </span>
            {meta.page < meta.totalPages ? (
              <Link href={toUrl({ ...query, page: meta.page + 1 })} className="px-3 py-1.5 border rounded-lg hover:bg-slate-50">
                Trang sau
              </Link>
            ) : <span />}
          </nav>
        </>
      )}
    </main>
  );
}