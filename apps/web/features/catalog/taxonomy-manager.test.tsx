import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TaxonomyManager } from './taxonomy-manager';

vi.mock('../../services/auth-client', () => ({
  bootstrapSession: vi.fn(() => Promise.resolve(true)),
  getAccessToken: vi.fn(() => 'token'),
}));

const payload = {
  data: [
    {
      id: 'category-1',
      name: 'Văn học',
      slug: 'van-hoc',
      description: 'Danh mục đọc sách',
      sortOrder: 2,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 'category-2',
      name: 'M6 E2E Category leaked',
      slug: 'm6-e2e-category-leaked',
      description: 'Fixture',
      sortOrder: 99,
      isActive: true,
      deletedAt: null,
    },
  ],
};

describe('Admin taxonomy manager', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('separates tabs, columns, controls and hides technical fixtures by default', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })),
    );
    render(<TaxonomyManager admin />);

    expect(await screen.findByRole('heading', { name: 'Quản lý phân loại' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Danh mục' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('columnheader', { name: 'Tên' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Slug' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Mô tả' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Thứ tự' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Thao tác' })).toBeInTheDocument();
    expect(screen.getByText('Văn học')).toBeInTheDocument();
    expect(screen.queryByText('M6 E2E Category leaked')).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Thứ tự Văn học' })).toHaveValue(2);
    expect(screen.getByRole('checkbox', { name: 'Đang hoạt động' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bật/tắt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ẩn' })).toBeInTheDocument();
  });

  it('supports inactive and all fixture visibility without concatenated labels', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })),
    );
    render(<TaxonomyManager admin={false} />);
    await screen.findByText('Văn học');
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'all' } });
    expect(screen.getByText('M6 E2E Category leaked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bật/tắt' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tác giả' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Tác giả' }));
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Tác giả' })).toHaveAttribute('aria-selected', 'true'),
    );
  });

  it('renders a retry action when the classification request fails', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false }));
    vi.stubGlobal('fetch', fetchMock);
    render(<TaxonomyManager admin={false} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải dữ liệu phân loại.');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the wide taxonomy table inside its mobile scroll container', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(css).toMatch(/\.admin-taxonomy-table-wrap\s*\{[^}]*contain:\s*paint/s);
  });
});
