'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiBaseUrl } from '../../lib/environment';
import { bootstrapSession, getAccessToken } from '../../services/auth-client';

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

type Kind = 'categories' | 'authors' | 'publishers';
type Visibility = 'active' | 'inactive' | 'all';
type Item = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bio?: string | null;
  sortOrder?: number;
  isActive: boolean;
  deletedAt: string | null;
};

const labels: Record<Kind, string> = {
  categories: 'Danh mục',
  authors: 'Tác giả',
  publishers: 'Nhà xuất bản',
};

const isTechnicalFixture = (item: Item): boolean => {
  const identity = `${item.name} ${item.slug}`.toLowerCase();
  return /m[36][ -]?e2e|m3[ -]?ui|cart[ -]?category|checkout|inventory|test|fixture/.test(identity);
};

export function TaxonomyManager({ admin }: { admin: boolean }) {
  const [kind, setKind] = useState<Kind>('categories');
  const [items, setItems] = useState<Item[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('active');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const headers = () => ({
    authorization: `Bearer ${getAccessToken() ?? ''}`,
    'content-type': 'application/json',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    if (!getAccessToken() && !(await bootstrapSession())) {
      setLoading(false);
      setError('Không thể xác thực phiên quản trị.');
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/admin/${kind}`, { headers: headers() });
      if (!response.ok) throw new Error('taxonomy-load');
      const body = (await response.json()) as { data?: Item[] };
      setItems(Array.isArray(body.data) ? body.data : []);
    } catch {
      setError('Không thể tải dữ liệu phân loại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [kind]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const technical = isTechnicalFixture(item);
        if (visibility === 'active') return item.isActive && !item.deletedAt && !technical;
        if (visibility === 'inactive')
          return Boolean(item.deletedAt) || !item.isActive || technical;
        return true;
      }),
    [items, visibility],
  );

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    setError('');
    const form = event.currentTarget;
    try {
      const response = await fetch(`${apiBaseUrl}/admin/${kind}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: field(new FormData(form), 'name') }),
      });
      if (!response.ok) throw new Error('taxonomy-create');
      form.reset();
      setMessage('Đã tạo dữ liệu phân loại.');
      await load();
    } catch {
      setError('Không thể tạo dữ liệu phân loại.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item: Item) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/admin/${kind}/${item.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!response.ok) throw new Error('taxonomy-toggle');
      setMessage(item.isActive ? 'Đã tắt hiển thị dữ liệu.' : 'Đã bật hiển thị dữ liệu.');
      await load();
    } catch {
      setError('Không thể thay đổi trạng thái dữ liệu.');
    } finally {
      setBusy(false);
    }
  };

  const update = async (event: FormEvent<HTMLFormElement>, item: Item) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      name: field(form, 'name'),
      slug: field(form, 'slug'),
      isActive: form.get('isActive') === 'on',
    };
    if (kind === 'authors') body.bio = field(form, 'details') || null;
    else body.description = field(form, 'details') || null;
    if (kind === 'categories') body.sortOrder = Number(form.get('sortOrder'));
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/admin/${kind}/${item.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('taxonomy-update');
      setMessage('Đã cập nhật dữ liệu phân loại.');
      await load();
    } catch {
      setError('Dữ liệu phân loại không hợp lệ hoặc không thể cập nhật.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: Item) => {
    if (!admin || busy || !confirm(`Ẩn ${item.name}?`)) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${apiBaseUrl}/admin/${kind}/${item.id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!response.ok) throw new Error('taxonomy-remove');
      setMessage('Đã ẩn dữ liệu phân loại.');
      await load();
    } catch {
      setError('Không thể ẩn dữ liệu phân loại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-taxonomy-section" aria-labelledby="taxonomy-heading">
      <header className="admin-section-heading">
        <div>
          <h2 id="taxonomy-heading">Quản lý phân loại</h2>
          <p>Quản lý danh mục, tác giả và nhà xuất bản của catalog.</p>
        </div>
        <label className="admin-taxonomy-filter">
          Trạng thái
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as Visibility)}
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã ẩn / QA</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
      </header>
      <div className="admin-taxonomy-tabs" role="tablist" aria-label="Loại dữ liệu phân loại">
        {(Object.keys(labels) as Kind[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            className={kind === value ? 'is-active' : undefined}
            onClick={() => setKind(value)}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {message && (
        <p role="status" className="admin-inline-message">
          {message}
        </p>
      )}
      {error && (
        <div className="admin-inline-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void load()}>
            Thử lại
          </button>
        </div>
      )}
      {admin && (
        <form onSubmit={(event) => void create(event)} className="admin-taxonomy-create">
          <label>
            Tên {labels[kind].toLowerCase()}
            <input name="name" required />
          </label>
          <button type="submit" disabled={busy}>
            Tạo {labels[kind].toLowerCase()}
          </button>
        </form>
      )}
      {loading ? (
        <p aria-busy="true" className="admin-empty-inline">
          Đang tải dữ liệu phân loại…
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="admin-empty-inline">Chưa có dữ liệu trong bộ lọc này.</p>
      ) : (
        <div className="admin-taxonomy-table-wrap">
          <table className="admin-taxonomy-table">
            <caption>{labels[kind]}</caption>
            <thead>
              <tr>
                <th scope="col">Tên</th>
                <th scope="col">Slug</th>
                <th scope="col">{kind === 'authors' ? 'Tiểu sử' : 'Mô tả'}</th>
                {kind === 'categories' && <th scope="col">Thứ tự</th>}
                <th scope="col">Trạng thái</th>
                {admin && <th scope="col">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => {
                const technical = isTechnicalFixture(item);
                return (
                  <tr key={item.id} data-technical-fixture={technical ? 'true' : undefined}>
                    <td data-label="Tên">
                      <strong>{item.name}</strong>
                      {technical && <small className="admin-fixture-badge">QA fixture</small>}
                    </td>
                    <td data-label="Slug" className="admin-taxonomy-slug">
                      {item.slug}
                    </td>
                    <td
                      data-label={kind === 'authors' ? 'Tiểu sử' : 'Mô tả'}
                      className="admin-taxonomy-description"
                    >
                      {(kind === 'authors' ? item.bio : item.description) || 'Chưa có'}
                    </td>
                    {kind === 'categories' && (
                      <td data-label="Thứ tự">
                        {admin ? (
                          <input
                            className="admin-taxonomy-order"
                            form={`taxonomy-edit-${item.id}`}
                            name="sortOrder"
                            type="number"
                            min="0"
                            defaultValue={item.sortOrder ?? 0}
                            aria-label={`Thứ tự ${item.name}`}
                          />
                        ) : (
                          (item.sortOrder ?? 0)
                        )}
                      </td>
                    )}
                    <td data-label="Trạng thái">
                      <span className="admin-taxonomy-status">
                        {item.deletedAt
                          ? 'Đã ẩn'
                          : item.isActive
                            ? 'Đang hoạt động'
                            : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    {admin && (
                      <td data-label="Thao tác">
                        {item.deletedAt ? (
                          <span className="field-help">Đã ẩn</span>
                        ) : (
                          <form
                            id={`taxonomy-edit-${item.id}`}
                            onSubmit={(event) => void update(event, item)}
                            className="admin-taxonomy-edit-form"
                          >
                            <label className="admin-taxonomy-edit-field">
                              <span className="sr-only">Tên {item.name}</span>
                              <input
                                name="name"
                                defaultValue={item.name}
                                required
                                aria-label={`Tên ${item.name}`}
                              />
                            </label>
                            <label className="admin-taxonomy-edit-field">
                              <span className="sr-only">Slug {item.name}</span>
                              <input
                                name="slug"
                                defaultValue={item.slug}
                                required
                                aria-label={`Slug ${item.name}`}
                              />
                            </label>
                            <label className="admin-taxonomy-edit-field">
                              <span className="sr-only">
                                {kind === 'authors' ? 'Tiểu sử' : 'Mô tả'} {item.name}
                              </span>
                              <textarea
                                name="details"
                                defaultValue={
                                  (kind === 'authors' ? item.bio : item.description) ?? ''
                                }
                                aria-label={`${kind === 'authors' ? 'Tiểu sử' : 'Mô tả'} ${item.name}`}
                              />
                            </label>
                            <label className="admin-taxonomy-checkbox">
                              <input
                                name="isActive"
                                type="checkbox"
                                defaultChecked={item.isActive}
                              />
                              <span>Đang hoạt động</span>
                            </label>
                            <div className="admin-taxonomy-actions">
                              <button type="submit" disabled={busy}>
                                Lưu
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void toggle(item)}
                              >
                                Bật/tắt
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void remove(item)}
                              >
                                Ẩn
                              </button>
                            </div>
                          </form>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
