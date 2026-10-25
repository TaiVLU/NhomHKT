import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogDetail from './page';

let role = 'ADMIN';
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '10' }),
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams('created=1'),
}));
vi.mock('../../../../services/auth-client', () => ({
  bootstrapSession: vi.fn(() => Promise.resolve(true)),
  getAccessToken: vi.fn(() => 'token'),
  getCurrentRole: vi.fn(() => role),
}));

const product = {
  id: '10',
  name: 'Clean Code',
  slug: 'clean-code',
  shortDescription: 'Sach',
  description: 'Markdown',
  releaseDate: '2008-08-01',
  pageCount: 464,
  language: 'vi',
  dimensions: '16x24',
  weightGrams: 500,
  publisher: { id: '20', name: 'NXB Tre' },
  categories: [{ id: '30', name: 'CNTT' }],
  authors: [{ id: '40', name: 'Robert Martin', sortOrder: 0 }],
  isNew: true,
  isFeatured: false,
  isActive: true,
  seoTitle: 'Clean Code',
  seoDescription: 'Sach lap trinh',
  variants: [
    {
      id: '50',
      sku: 'CLEAN_HC',
      isbn: '9780132350884',
      name: 'Bia cung',
      coverType: 'HC',
      costPrice: 100,
      listPrice: 200,
      salePrice: 180,
      isActive: true,
      inventory: { onHandQuantity: 12, reservedQuantity: 2, availableQuantity: 10 },
    },
  ],
};
type MockResponse = { ok: boolean; json: () => Promise<unknown> };
const ok = (data: unknown): Promise<MockResponse> =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ data }) });
const fail = (code: string) =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ error: { code, message: code } }),
  } satisfies MockResponse);
const requestHref = (url: string | URL | Request): string =>
  typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;

const mockFetch = () =>
  vi.fn((input: string | URL | Request, init?: RequestInit): Promise<MockResponse> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.endsWith('/images') && init?.method !== 'POST')
      return ok([
        {
          id: '60',
          url: 'https://example.com/a.webp',
          altText: 'Bia',
          sortOrder: 0,
          isPrimary: true,
          productVariantId: null,
        },
        {
          id: '61',
          url: 'https://example.com/b.webp',
          altText: 'Bia phu',
          sortOrder: 1,
          isPrimary: false,
          productVariantId: null,
        },
      ]);
    if (url.endsWith('/categories')) return ok([{ id: '30', name: 'CNTT', deletedAt: null }]);
    if (url.endsWith('/authors')) return ok([{ id: '40', name: 'Robert Martin', deletedAt: null }]);
    if (url.endsWith('/publishers')) return ok([{ id: '20', name: 'NXB Tre', deletedAt: null }]);
    if (url.includes('/admin/inventory/variants/50'))
      return ok({
        variantId: '50',
        sku: 'CLEAN_HC',
        onHandQuantity: 12,
        reservedQuantity: 2,
        availableQuantity: 10,
        ledger: [
          {
            id: '70',
            adjustmentType: 'RECEIVE_STOCK',
            quantityDelta: 12,
            beforeQuantity: 0,
            afterQuantity: 12,
            reason: 'Nhập kho ban đầu',
            actorName: 'Admin',
            actorEmail: 'admin@example.com',
            createdAt: '2026-07-19T10:00:00.000Z',
          },
        ],
      });
    if (url.endsWith('/admin/inventory/adjustments'))
      return ok({
        inventory: {
          variantId: '50',
          sku: 'CLEAN_HC',
          onHandQuantity: 10,
          reservedQuantity: 2,
          availableQuantity: 8,
          ledger: [],
        },
      });
    return ok(product);
  });

describe('Admin catalog detail role UI', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    vi.stubGlobal('fetch', mockFetch());
  });

  it('shows full Admin mutation controls and keeps SKU read-only', async () => {
    role = 'ADMIN';
    render(<CatalogDetail />);
    expect(await screen.findByText('Quản trị đang chỉnh sửa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CLEAN_HC')).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Lưu phiên bản' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Lưu ảnh/ })).toHaveLength(2);
    expect(screen.getByText('Tải ảnh lên (tối đa 5 MB)')).toBeInTheDocument();
    expect(await screen.findByText('Điều chỉnh tồn kho')).toBeInTheDocument();
    expect(screen.getByText('Nhập kho ban đầu')).toBeInTheDocument();
    expect(screen.getByText('Checklist hoàn thiện')).toBeInTheDocument();
  });

  it('saves metadata with a submit lock and validation mapping', async () => {
    role = 'ADMIN';
    render(<CatalogDetail />);
    await screen.findByText('Quản trị đang chỉnh sửa');
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'Clean Code 2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }));
    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(([url, init]) => {
          const href = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
          return href.endsWith('/admin/products/10') && init?.method === 'PATCH';
        }),
      ).toBe(true);
    });
    const patchCall = vi.mocked(fetch).mock.calls.find(([url, init]) => {
      const href = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
      return href.endsWith('/admin/products/10') && init?.method === 'PATCH';
    });
    const patchBody = patchCall?.[1]?.body;
    expect(typeof patchBody).toBe('string');
    expect(JSON.parse(patchBody as string)).toMatchObject({
      primaryCategoryId: '30',
      publicationState: 'ACTIVE',
    });
  });

  it('adds a variant and maps duplicate SKU errors', async () => {
    role = 'ADMIN';
    const fetchMock = mockFetch();
    fetchMock.mockImplementationOnce(mockFetch()).mockImplementation((input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.endsWith('/variants') && init?.method === 'POST') return fail('CATALOG_SKU_CONFLICT');
      return mockFetch()(input, init);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<CatalogDetail />);
    await screen.findByText('Tạo phiên bản mới');
    fireEvent.change(screen.getByPlaceholderText('SKU'), { target: { value: 'CLEAN_HC' } });
    fireEvent.change(screen.getByPlaceholderText('Tên phiên bản'), {
      target: { value: 'Paperback' },
    });
    fireEvent.change(screen.getByLabelText('Giá vốn mới'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Giá niêm yết mới'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Giá bán mới'), { target: { value: '90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo phiên bản' }));
    expect(await screen.findByText(/SKU đã được sử dụng/)).toBeInTheDocument();
  });

  it('blocks invalid variant price before mutation', async () => {
    role = 'ADMIN';
    render(<CatalogDetail />);
    await screen.findByText('Tạo phiên bản mới');
    fireEvent.change(screen.getByPlaceholderText('SKU'), { target: { value: 'NEW_SKU' } });
    fireEvent.change(screen.getByPlaceholderText('Tên phiên bản'), {
      target: { value: 'Paperback' },
    });
    fireEvent.change(screen.getByLabelText('Giá vốn mới'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Giá niêm yết mới'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Giá bán mới'), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo phiên bản' }));
    expect(await screen.findByText(/Giá bán không được/)).toBeInTheDocument();
  });

  it('uses confirmation dialogs for variant deactivation and image removal', async () => {
    role = 'ADMIN';
    render(<CatalogDetail />);
    await screen.findByText('Quản trị đang chỉnh sửa');
    fireEvent.click(screen.getByRole('button', { name: 'Ngừng hiển thị' }));
    expect(screen.getByRole('dialog', { name: 'Ngừng hiển thị phiên bản' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Ngừng hiển thị phiên bản' }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Gỡ ảnh' })[0]!);
    expect(screen.getByRole('dialog', { name: 'Xóa ảnh sản phẩm' })).toBeInTheDocument();
  });

  it('rejects invalid image uploads before submit', async () => {
    role = 'ADMIN';
    render(<CatalogDetail />);
    await screen.findByText('Quản trị đang chỉnh sửa');
    const fileInput = screen.getByLabelText('Chọn ảnh');
    const uploadForm = fileInput.closest('form');
    expect(uploadForm).not.toBeNull();
    fireEvent.change(fileInput, {
      target: { files: [new File(['not-image'], 'bad.txt', { type: 'text/plain' })] },
    });
    fireEvent.submit(uploadForm!);
    expect(await screen.findByText(/Ảnh không hợp lệ|Chỉ hỗ trợ ảnh/)).toBeInTheDocument();
  });

  it('sets primary image, saves sort order, and confirms removal', async () => {
    role = 'ADMIN';
    render(<CatalogDetail />);
    await screen.findByText('Quản trị đang chỉnh sửa');
    fireEvent.click(screen.getAllByRole('button', { name: 'Đặt làm ảnh chính' })[1]!);
    await waitFor(() =>
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(
            ([url, init]) => requestHref(url).includes('/images/61') && init?.method === 'PATCH',
          ),
      ).toBe(true),
    );
    fireEvent.change(screen.getAllByLabelText('Thứ tự hiển thị')[0]!, { target: { value: '5' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu ảnh' })[0]!);
    await waitFor(() =>
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(
            ([url, init]) => requestHref(url).includes('/images/60') && init?.method === 'PATCH',
          ),
      ).toBe(true),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Gỡ ảnh' })[0]!);
    expect(screen.getByRole('dialog', { name: 'Xóa ảnh sản phẩm' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('dialog').querySelector('button:last-child') as HTMLElement);
    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      expect(
        calls.some(
          ([url, init]) => requestHref(url).includes('/images/61') && init?.method === 'PATCH',
        ),
      ).toBe(true);
      expect(
        calls.some(
          ([url, init]) => requestHref(url).includes('/images/60') && init?.method === 'PATCH',
        ),
      ).toBe(true);
      expect(
        calls.some(
          ([url, init]) => requestHref(url).includes('/images/60') && init?.method === 'DELETE',
        ),
      ).toBe(true);
    });
  });

  it('submits an accessible inventory adjustment dialog with expected stock', async () => {
    role = 'ADMIN';
    render(<CatalogDetail />);
    fireEvent.click(await screen.findByText('Điều chỉnh tồn kho'));
    expect(screen.getByRole('dialog', { name: 'Điều chỉnh tồn kho' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Loại điều chỉnh'), {
      target: { value: 'MANUAL_DECREASE' },
    });
    fireEvent.change(screen.getByLabelText('Số lượng'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Lý do'), { target: { value: 'Kiểm kê thiếu' } });
    fireEvent.click(screen.getByText('Xác nhận điều chỉnh'));
    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(([url, init]) => {
          const href = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
          const body = typeof init?.body === 'string' ? init.body : '';
          return (
            href.endsWith('/admin/inventory/adjustments') &&
            init?.method === 'POST' &&
            body.includes('expectedOnHandQuantity')
          );
        }),
      ).toBe(true);
    });
  });

  it('renders Staff as read-only without mutation controls or cost price', async () => {
    role = 'STAFF';
    render(<CatalogDetail />);
    expect(await screen.findByText(/Nhân viên - chỉ đọc/)).toBeInTheDocument();
    expect(screen.queryByText(/Lưu sản phẩm/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lưu phiên bản/)).not.toBeInTheDocument();
    expect(screen.queryByText('Tải ảnh lên (tối đa 5 MB)')).not.toBeInTheDocument();
    expect(screen.queryByText('Điều chỉnh tồn kho')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('100')).not.toBeInTheDocument();
  });
});
