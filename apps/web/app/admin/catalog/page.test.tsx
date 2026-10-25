import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminCatalogPage from './page';

let role = 'ADMIN';
const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));
vi.mock('../../../services/auth-client', () => ({
  bootstrapSession: vi.fn(() => Promise.resolve(true)),
  getAccessToken: vi.fn(() => 'token'),
  getCurrentRole: vi.fn(() => role),
}));

const response = (admin: boolean) => ({
  ok: true,
  json: () =>
    Promise.resolve({
      data: [
        {
          id: '1',
          name: 'Sach demo',
          slug: 'sach-demo',
          isActive: true,
          deletedAt: null,
          variants: [
            { id: '2', sku: 'SKU_DEMO', salePrice: 100000, ...(admin ? { costPrice: 50000 } : {}) },
          ],
        },
      ],
    }),
});

const catalogFetch = (admin: boolean) =>
  vi.fn((input: string | URL | Request) => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    return Promise.resolve(
      requestUrl.includes('/admin/categories')
        ? { ok: true, json: () => Promise.resolve({ data: [] }) }
        : response(admin),
    );
  });

describe('Admin Catalog role UI', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    replace.mockReset();
  });

  it('shows mutation controls and costPrice for Admin', async () => {
    role = 'ADMIN';
    vi.stubGlobal('fetch', catalogFetch(true));
    render(<AdminCatalogPage />);
    expect(await screen.findByText('Chế độ quản trị')).toBeInTheDocument();
    expect(screen.getByText('Tạo sản phẩm')).toBeInTheDocument();
    expect(await screen.findByText(/Giá vốn/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue('SKU_DEMO')).not.toBeInTheDocument();
  });

  it('redirects after minimal creation and keeps the product inactive', async () => {
    role = 'ADMIN';
    const fetchMock = vi.fn((_input: string | URL | Request, init?: RequestInit) =>
      Promise.resolve(
        init?.method === 'POST'
          ? {
              ok: true,
              json: () => Promise.resolve({ data: { id: '99', slug: 'new-product' } }),
            }
          : response(true),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<AdminCatalogPage />);
    await screen.findByText('Chế độ quản trị');
    fireEvent.change(screen.getByLabelText('Tên sản phẩm'), { target: { value: 'New Product' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo sản phẩm' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/catalog/99?created=1'));
    const createCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(createCall).toBeTruthy();
    const requestBody = createCall?.[1]?.body;
    expect(typeof requestBody).toBe('string');
    expect(JSON.parse(requestBody as string)).toMatchObject({ isActive: false });
  });

  it('is read-only and hides costPrice for Staff', async () => {
    role = 'STAFF';
    vi.stubGlobal('fetch', catalogFetch(false));
    render(<AdminCatalogPage />);
    expect(await screen.findByText(/nhân viên - chỉ đọc/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Sach demo')).toBeInTheDocument());
    expect(screen.queryByText('Tạo sản phẩm')).not.toBeInTheDocument();
    expect(screen.queryByText(/Giá vốn/)).not.toBeInTheDocument();
    expect(screen.queryByText('Ẩn sản phẩm')).not.toBeInTheDocument();
  });
});
