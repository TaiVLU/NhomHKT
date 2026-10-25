'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  fetchAdminReport,
  reportingPreset,
  type AdminReport,
  type InventoryReportingItem,
  type ReportingProduct,
} from '../../services/admin-reporting-client';

const currency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} ₫`;
const percent = (value: number | null) =>
  value === null ? 'Chưa có kỳ đối chiếu' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const statusLabel: Record<string, string> = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
};

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'COMPLETED':
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'PENDING_CONFIRMATION':
    case 'UNPAID':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'CONFIRMED':
    case 'PACKING':
    case 'SHIPPING':
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function useReport(resource: 'overview' | 'revenue' | 'product-statistics') {
  const initial = useMemo(() => reportingPreset('30d'), []);
  const [range, setRange] = useState(initial);
  const [report, setReport] = useState<AdminReport | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    void fetchAdminReport(resource, range, controller.signal)
      .then((value) => {
        setReport(value);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, [range, resource, version]);

  return { report, status, range, setRange, retry: load };
}

function PageState({
  status,
  retry,
}: {
  status: 'loading' | 'ready' | 'error';
  retry: () => void;
}) {
  if (status === 'loading')
    return (
      <section className="admin-state-grid" aria-busy="true" aria-label="Đang tải báo cáo">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="admin-skeleton-card" key={index} />
        ))}
      </section>
    );
  if (status === 'error')
    return (
      <section className="admin-state-message" role="alert">
        <h2>Không thể tải dữ liệu báo cáo.</h2>
        <p>Phiên đăng nhập hoặc dịch vụ dữ liệu có thể tạm thời gián đoạn.</p>
        <button type="button" onClick={retry}>
          Thử lại
        </button>
      </section>
    );
  return null;
}

function Metric({
  label,
  value,
  note,
  variant,
}: {
  label: string;
  value: string;
  note?: string;
  variant?: 'warning' | 'danger' | 'neutral';
}) {
  const getVariantClass = () => {
    if (variant === 'danger') return '!text-rose-600 font-bold';
    if (variant === 'warning') return '!text-amber-600 font-bold';
    if (variant === 'neutral') return '!text-slate-400';
    return '';
  };

  return (
    <article className="admin-metric-card min-h-[145px] flex flex-col justify-between">
      <div>
        <span className="block text-sm text-slate-500 mb-1">{label}</span>
        <strong className={`text-2xl font-bold tracking-tight block ${getVariantClass()}`}>
          {value}
        </strong>
      </div>
      <div className="mt-3 min-h-[1.25rem]">
        {note ? (
          <small className="text-xs text-slate-500 block leading-tight">{note}</small>
        ) : null}
      </div>
    </article>
  );
}

function RangeControls({
  value,
  onChange,
}: {
  value: { from: string; to: string };
  onChange: (value: { from: string; to: string }) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fromValue = data.get('from');
    const toValue = data.get('to');
    const from = typeof fromValue === 'string' ? fromValue : '';
    const to = typeof toValue === 'string' ? toValue : '';
    if (from && to && from <= to) onChange({ from, to });
  };

  return (
    <form className="admin-range-controls bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6" onSubmit={submit}>
      <div className="admin-range-presets flex flex-wrap items-center gap-1.5" aria-label="Khoảng ngày nhanh">
        {(
          [
            ['today', 'Hôm nay'],
            ['7d', '7 ngày'],
            ['30d', '30 ngày'],
            ['currentMonth', 'Tháng này'],
            ['previousMonth', 'Tháng trước'],
          ] as const
        ).map(([preset, label]) => (
          <button
            type="button"
            key={preset}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300 transition-colors"
            onClick={() => onChange(reportingPreset(preset))}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dùng items-end để chân ô input và 2 nút bấm luôn thẳng hàng tắp lự */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
          <span>Từ ngày</span>
          <input
            name="from"
            type="date"
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 h-[38px] focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            defaultValue={value.from}
            key={`from-${value.from}`}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
          <span>Đến ngày</span>
          <input
            name="to"
            type="date"
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 h-[38px] focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
            defaultValue={value.to}
            key={`to-${value.to}`}
          />
        </label>

        <button
          type="submit"
          className="px-4 text-xs font-semibold rounded-lg bg-[#0080c8] text-white hover:bg-sky-600 transition-colors shadow-sm h-[38px] flex items-center justify-center cursor-pointer"
        >
          Áp dụng
        </button>

        <button
          type="button"
          className="px-4 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors h-[38px] flex items-center justify-center cursor-pointer"
          onClick={() => onChange(reportingPreset('30d'))}
        >
          Đặt lại
        </button>
      </div>
    </form>
  );
}

function RevenueSeries({ report }: { report: AdminReport }) {
  const max = Math.max(1, ...report.revenueSeries.map((row) => row.revenue));
  return (
    <section className="admin-panel">
      <div className="admin-section-heading">
        <div>
          <h2>Doanh thu theo ngày</h2>
        </div>
        <span>{report.range.timezone}</span>
      </div>
      {report.summary.recognizedOrderCount === 0 ? (
        <p className="admin-empty-inline">Chưa có doanh thu được ghi nhận trong khoảng đã chọn.</p>
      ) : (
        <div className="admin-bar-chart" aria-hidden="true">
          {report.revenueSeries.map((row) => (
            <span
              key={row.date}
              style={{ height: `${Math.max(4, (row.revenue / max) * 100)}%` }}
              title={`${row.date}: ${currency(row.revenue)}`}
            />
          ))}
        </div>
      )}
      <div className="admin-table-scroll">
        <table className="admin-data-table w-full">
          <caption>Dữ liệu doanh thu theo ngày</caption>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Doanh thu</th>
              <th>Đơn</th>
              <th>Sản phẩm</th>
            </tr>
          </thead>
          <tbody>
            {report.revenueSeries.map((row) => (
              <tr key={row.date}>
                <th scope="row">{row.date}</th>
                <td>{currency(row.revenue)}</td>
                <td>{row.orderCount}</td>
                <td>{row.itemsSold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProductTable({ title, rows }: { title: string; rows: ReportingProduct[] }) {
  return (
    <section className="admin-panel flex-1">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="admin-empty-inline">Chưa có dữ liệu phù hợp.</p>
      ) : (
        <div className="admin-table-scroll !overflow-x-hidden">
          <table className="admin-data-table !w-full table-auto">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th className="w-12 text-center">Hạng</th>
                <th>Sản phẩm</th>
                <th className="w-20 text-center">Đã bán</th>
                <th className="w-28 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.title}-${row.slug ?? index}`}>
                  <td className="text-center font-medium">{row.rank ?? index + 1}</td>
                  <th scope="row" className="font-normal truncate max-w-[180px]">
                    {row.slug ? (
                      <Link href={`/sach/${row.slug}`} className="hover:underline text-slate-900 font-medium">
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    )}
                  </th>
                  <td className="text-center font-medium">{row.quantitySold}</td>
                  <td className="text-right font-semibold text-slate-800">{currency(row.recognizedRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AdminDashboardPage() {
  const { report, status, retry } = useReport('overview');
  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Tổng quan vận hành</h1>
          <p>Doanh thu đã ghi nhận và các tín hiệu cần xử lý trong một màn hình.</p>
        </div>
      </header>
      <PageState status={status} retry={retry} />
      {status === 'ready' && report && (
        <>
          <section className="admin-metrics-grid">
            <Metric label="Doanh thu hôm nay" value={currency(report.quickRevenue.today)} />
            <Metric label="Doanh thu 7 ngày" value={currency(report.quickRevenue.last7Days)} />
            <Metric label="Doanh thu 30 ngày" value={currency(report.quickRevenue.last30Days)} />
            <Metric label="Đơn trong kỳ" value={String(report.summary.totalOrderCount)} />
            <Metric label="Đơn đang xử lý" value={String(report.summary.processingOrderCount)} />
            <Metric label="Đơn hoàn tất" value={String(report.summary.completedOrderCount)} />
            <Metric
              label="Giá trị đơn trung bình"
              value={currency(report.summary.averageOrderValue)}
            />
            <Metric label="Sản phẩm đã bán" value={String(report.summary.itemsSold)} />
            <Metric
              label="Sắp hết hàng"
              value={String(report.summary.lowStockProductCount)}
              variant={report.summary.lowStockProductCount > 0 ? 'warning' : 'neutral'}
            />
            <Metric
              label="Hết hàng"
              value={String(report.summary.outOfStockProductCount)}
              variant={report.summary.outOfStockProductCount > 0 ? 'danger' : 'neutral'}
            />
          </section>
          <RevenueSeries report={report} />
          <div className="admin-two-columns">
            <section className="admin-panel flex-1">
              <h2>Đơn hàng gần đây</h2>
              {report.latestOrders.length === 0 ? (
                <p className="admin-empty-inline">Chưa có đơn hàng trong kỳ.</p>
              ) : (
                <ul className="admin-order-briefs space-y-2">
                  {report.latestOrders.map((order) => (
                    <li
                      key={order.orderNumber}
                      className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                    >
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="font-medium text-sky-700 hover:underline text-sm font-mono"
                      >
                        {order.orderNumber}
                      </Link>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeStyle(
                          order.orderStatus,
                        )}`}
                      >
                        {statusLabel[order.orderStatus] ?? order.orderStatus}
                      </span>
                      <strong className="text-sm font-semibold text-slate-800">{currency(order.grandTotal)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <ProductTable title="Sản phẩm nổi bật" rows={report.topProductsByRevenue.slice(0, 5)} />
          </div>
          <nav className="admin-shortcuts grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4" aria-label="Lối tắt quản trị">
            <Link
              href="/admin/revenue"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-500 hover:text-sky-600 transition-all text-sm font-medium shadow-sm group"
            >
              <span>Xem doanh thu</span>
              <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-500 transition-transform">→</span>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-500 hover:text-sky-600 transition-all text-sm font-medium shadow-sm group"
            >
              <span>Theo dõi đơn hàng</span>
              <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-500 transition-transform">→</span>
            </Link>
            <Link
              href="/admin/product-statistics"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-500 hover:text-sky-600 transition-all text-sm font-medium shadow-sm group"
            >
              <span>Thống kê sản phẩm</span>
              <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-500 transition-transform">→</span>
            </Link>
            <Link
              href="/admin/inventory"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-500 hover:text-sky-600 transition-all text-sm font-medium shadow-sm group"
            >
              <span>Kiểm tra tồn kho</span>
              <span className="text-slate-400 group-hover:translate-x-1 group-hover:text-sky-500 transition-transform">→</span>
            </Link>
          </nav>
        </>
      )}
    </main>
  );
}

export function AdminRevenuePage() {
  const { report, status, range, setRange, retry } = useReport('revenue');
  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Doanh thu</h1>
          <p>Chỉ ghi nhận đơn hoàn tất từ snapshot lịch sử, không dùng giá catalog hiện tại.</p>
        </div>
      </header>
      <RangeControls value={range} onChange={setRange} />
      <PageState status={status} retry={retry} />
      {status === 'ready' && report && (
        <>
          <section className="admin-metrics-grid">
            <Metric
              label="Doanh thu ghi nhận"
              value={currency(report.summary.recognizedRevenue)}
              note={`${percent(report.summary.revenueChangePercent)} so với kỳ trước`}
            />
            <Metric
              label="Đơn ghi nhận"
              value={String(report.summary.recognizedOrderCount)}
              note={`${percent(report.summary.orderChangePercent)} so với kỳ trước`}
            />
            <Metric
              label="Giá trị đơn trung bình"
              value={currency(report.summary.averageOrderValue)}
            />
            <Metric label="Sản phẩm đã bán" value={String(report.summary.itemsSold)} />
          </section>
          <RevenueSeries report={report} />
          <section className="admin-panel">
            <h2>Phân bố trạng thái đơn</h2>
            <div className="admin-table-scroll">
              <table className="admin-data-table w-full">
                <caption>Phân bố trạng thái đơn trong kỳ</caption>
                <thead>
                  <tr>
                    <th>Trạng thái</th>
                    <th>Số đơn</th>
                    <th>Tổng giá trị</th>
                    <th>Ghi nhận doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orderStatuses.map((row) => (
                    <tr key={row.status}>
                      <th scope="row">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusBadgeStyle(
                            row.status,
                          )}`}
                        >
                          {statusLabel[row.status] ?? row.status}
                        </span>
                      </th>
                      <td>{row.orderCount}</td>
                      <td>{currency(row.totalValue)}</td>
                      <td>{row.revenueEligible ? 'Có · hoàn tất' : 'Không'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="admin-two-columns">
            <ProductTable title="Top theo số lượng" rows={report.topProductsByQuantity} />
            <ProductTable title="Top theo doanh thu" rows={report.topProductsByRevenue} />
          </div>
        </>
      )}
    </main>
  );
}

function InventoryTable({ title, rows }: { title: string; rows: InventoryReportingItem[] }) {
  return (
    <section className="admin-panel">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="admin-empty-inline">Không có sản phẩm trong trạng thái này.</p>
      ) : (
        <div className="admin-table-scroll">
          <table className="admin-data-table w-full">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th>Trong kho</th>
                <th>Đang giữ</th>
                <th>Khả dụng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.sku}>
                  <th scope="row">
                    <Link href={`/sach/${row.productSlug}`}>{row.productName}</Link>
                    <small>{row.variantName}</small>
                  </th>
                  <td>{row.sku}</td>
                  <td>{row.onHandQuantity}</td>
                  <td>{row.reservedQuantity}</td>
                  <td>{row.availableQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AdminProductStatisticsPage() {
  const { report, status, range, setRange, retry } = useReport('product-statistics');
  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Thống kê sản phẩm</h1>
          <p>Phân tích bán hàng từ OrderItem snapshot và tình trạng tồn kho hiện tại.</p>
        </div>
      </header>
      <RangeControls value={range} onChange={setRange} />
      <PageState status={status} retry={retry} />
      {status === 'ready' && report && (
        <>
          <div className="admin-two-columns">
            <ProductTable title="Sản phẩm bán chạy" rows={report.topProductsByQuantity} />
            <ProductTable title="Doanh thu cao" rows={report.topProductsByRevenue} />
            <ProductTable title="Ít bán" rows={report.lowSellingProducts} />
            <section className="admin-panel">
              <h2>Chưa có doanh thu ghi nhận</h2>
              {report.noSalesProducts.length === 0 ? (
                <p className="admin-empty-inline">
                  Mọi sản phẩm active đều đã có doanh thu trong kỳ.
                </p>
              ) : (
                <ul className="admin-link-list">
                  {report.noSalesProducts.map((product) => (
                    <li key={product.slug}>
                      <Link href={`/admin/catalog`}>{product.title}</Link>
                      <span>{product.slug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          <section className="admin-panel">
            <h2>Theo danh mục</h2>
            <div className="admin-table-scroll">
              <table className="admin-data-table w-full">
                <caption>Số lượng và doanh thu theo danh mục</caption>
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th>Đã bán</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.map((row) => (
                    <tr key={row.category}>
                      <th scope="row">{row.category}</th>
                      <td>{row.quantitySold}</td>
                      <td>{currency(row.recognizedRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="admin-two-columns">
            <InventoryTable title="Sắp hết hàng" rows={report.inventory.lowStock} />
            <InventoryTable title="Hết hàng" rows={report.inventory.outOfStock} />
          </div>
        </>
      )}
    </main>
  );
}

export function AdminInventoryPage() {
  const { report, status, retry } = useReport('product-statistics');
  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Tồn kho</h1>
          <p>
            Theo dõi tồn hiện tại. Điều chỉnh vẫn nằm trong trình biên tập sản phẩm và tuân theo
            RBAC hiện có.
          </p>
        </div>
      </header>
      <PageState status={status} retry={retry} />
      {status === 'ready' && report && (
        <>
          <section className="admin-metrics-grid">
            <Metric label="Phiên bản" value={String(report.inventory.totalVariants)} />
            <Metric label="Trong kho" value={String(report.inventory.totalOnHand)} />
            <Metric label="Đang giữ" value={String(report.inventory.totalReserved)} />
            <Metric label="Khả dụng" value={String(report.inventory.totalAvailable)} />
          </section>
          <InventoryTable title="Danh sách tồn kho" rows={report.inventory.items} />
        </>
      )}
    </main>
  );
}