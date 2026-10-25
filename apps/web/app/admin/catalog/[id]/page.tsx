'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiBaseUrl } from '../../../../lib/environment';
import { bootstrapSession, getAccessToken, getCurrentRole } from '../../../../services/auth-client';

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

const money = (value?: number): string => (value ?? 0).toLocaleString('vi-VN');
const displayImageUrl = (url: string): string =>
  /example\.(invalid|test)/i.test(url) ? '/book-placeholder.svg' : url;

type Tax = { id: string; name: string; sortOrder?: number; deletedAt?: string | null };
type Variant = {
  id: string;
  sku: string;
  isbn: string | null;
  name: string;
  coverType: string | null;
  costPrice?: number;
  listPrice: number;
  salePrice: number;
  isActive: boolean;
  inventory: {
    onHandQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  } | null;
};
type Image = {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  productVariantId: string | null;
};
type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  releaseDate: string | null;
  pageCount: number | null;
  language: string | null;
  dimensions: string | null;
  weightGrams: number | null;
  publisher: Tax | null;
  categories: Tax[];
  authors: Tax[];
  variants: Variant[];
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};
type InventoryLedgerEntry = {
  id: string;
  adjustmentType: string;
  quantityDelta: number;
  beforeQuantity: number;
  afterQuantity: number;
  reason: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};
type InventoryDetail = {
  variantId: string;
  sku: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  ledger: InventoryLedgerEntry[];
};
type ProductFormState = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  releaseDate: string;
  pageCount: string;
  language: string;
  dimensions: string;
  weightGrams: string;
  publisherId: string;
  categoryIds: string[];
  authorIds: string[];
  authorSort: Record<string, string>;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
};

const adjustmentLabels: Record<string, string> = {
  RECEIVE_STOCK: 'Nhập hàng',
  MANUAL_INCREASE: 'Tăng thủ công',
  MANUAL_DECREASE: 'Giảm thủ công',
  CORRECTION: 'Điều chỉnh kiểm kê',
};

const errorMessages: Record<string, string> = {
  CATALOG_SKU_CONFLICT: 'SKU đã được sử dụng. Vui lòng chọn SKU khác.',
  CATALOG_ISBN_CONFLICT: 'ISBN đã được sử dụng. Vui lòng kiểm tra lại phiên bản.',
  CATALOG_SLUG_CONFLICT: 'Slug đã được sử dụng. Vui lòng chọn slug khác.',
  CATALOG_RELATION_INVALID: 'Danh mục, tác giả hoặc nhà xuất bản không hợp lệ.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra các trường được nhập.',
};

const formFromProduct = (product: Product): ProductFormState => ({
  name: product.name,
  slug: product.slug,
  shortDescription: product.shortDescription ?? '',
  description: product.description ?? '',
  releaseDate: product.releaseDate ?? '',
  pageCount: product.pageCount?.toString() ?? '',
  language: product.language ?? '',
  dimensions: product.dimensions ?? '',
  weightGrams: product.weightGrams?.toString() ?? '',
  publisherId: product.publisher?.id ?? '',
  categoryIds: product.categories.map((category) => category.id),
  authorIds: product.authors.map((author) => author.id),
  authorSort: Object.fromEntries(
    product.authors.map((author, index) => [author.id, String(author.sortOrder ?? index)]),
  ),
  isNew: product.isNew,
  isFeatured: product.isFeatured,
  isActive: product.isActive,
  seoTitle: product.seoTitle ?? '',
  seoDescription: product.seoDescription ?? '',
});

const readApiMessage = async (response: Response): Promise<string> => {
  const body = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string };
  } | null;
  return (
    errorMessages[body?.error?.code ?? ''] ?? body?.error?.message ?? 'Yêu cầu không thành công.'
  );
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-editor-section" aria-labelledby={`section-${title}`}>
      <h2 id={`section-${title}`}>{title}</h2>
      {children}
    </section>
  );
}

function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
  }, []);

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [],
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="admin-transition-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="admin-transition-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-confirm-title"
        onKeyDown={trapFocus}
      >
        <h2 id="catalog-confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="admin-transition-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={busy}>
            Hủy
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryAdjustmentDialog({
  variant,
  inventory,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  variant: Variant;
  inventory: InventoryDetail;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: { type: string; quantity: number; reason: string }) => void;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [type, setType] = useState('RECEIVE_STOCK');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const delta = type === 'MANUAL_DECREASE' ? -quantity : quantity;
  const after = inventory.onHandQuantity + delta;
  const canSubmit = !busy && quantity > 0 && reason.trim().length > 0 && after >= 0;

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('select, input, textarea, button')?.focus();
  }, []);

  const trapFocus = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      formRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      ) ?? [],
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="admin-transition-backdrop" role="presentation">
      <form
        ref={formRef}
        className="admin-transition-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-adjustment-title"
        onKeyDown={trapFocus}
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit({ type, quantity, reason: reason.trim() });
        }}
      >
        <h2 id="inventory-adjustment-title">Điều chỉnh tồn kho</h2>
        <p>
          {variant.sku}: hiện có {inventory.onHandQuantity} cuốn, đang giữ{' '}
          {inventory.reservedQuantity} cuốn.
        </p>
        <label>
          Loại điều chỉnh
          <select value={type} onChange={(event) => setType(event.target.value)} disabled={busy}>
            {Object.entries(adjustmentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Số lượng
          <input
            type="number"
            min="1"
            value={quantity}
            disabled={busy}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>
        <label>
          Lý do
          <textarea
            maxLength={500}
            value={reason}
            disabled={busy}
            required
            aria-invalid={reason.trim().length === 0}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="inventory-preview" aria-live="polite">
          <span>{inventory.onHandQuantity}</span>
          <span>{delta >= 0 ? `+${delta}` : delta}</span>
          <strong>{after}</strong>
        </div>
        {after < 0 && <p role="alert">Không thể điều chỉnh làm tồn kho âm.</p>}
        {error && <p role="alert">{error}</p>}
        <div className="admin-transition-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
            Đóng
          </button>
          <button type="submit" disabled={!canSubmit}>
            {busy ? 'Đang xử lý...' : 'Xác nhận điều chỉnh'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [p, setP] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [cats, setCats] = useState<Tax[]>([]);
  const [authors, setAuthors] = useState<Tax[]>([]);
  const [pubs, setPubs] = useState<Tax[]>([]);
  const [inventoryByVariant, setInventoryByVariant] = useState<Record<string, InventoryDetail>>({});
  const [adjustingVariant, setAdjustingVariant] = useState<Variant | null>(null);
  const [confirming, setConfirming] = useState<
    | { kind: 'variant'; variant: Variant; trigger: HTMLElement | null }
    | { kind: 'image'; image: Image; trigger: HTMLElement | null }
    | null
  >(null);
  const [role, setRole] = useState<string | null>(null);
  const [message, setMessage] = useState(
    searchParams.get('created')
      ? 'Đã tạo sản phẩm mới. Hãy hoàn thiện các mục bắt buộc trước khi bật hiển thị.'
      : '',
  );
  const [error, setError] = useState('');
  const [adjustmentError, setAdjustmentError] = useState('');
  const [busy, setBusy] = useState(false);
  const [variantBusy, setVariantBusy] = useState('');
  const [imageBusy, setImageBusy] = useState('');

  const admin = role === 'ADMIN';
  const headers = () => ({
    authorization: `Bearer ${getAccessToken() ?? ''}`,
    'content-type': 'application/json',
  });

  const load = async () => {
    if (!getAccessToken() && !(await bootstrapSession())) {
      router.replace(`/admin/login?returnUrl=${encodeURIComponent(`/admin/catalog/${id}`)}`);
      return;
    }
    setRole(getCurrentRole());
    const [productResponse, imageResponse, categoryResponse, authorResponse, publisherResponse] =
      await Promise.all([
        fetch(`${apiBaseUrl}/admin/products/${id}`, { headers: headers() }),
        fetch(`${apiBaseUrl}/admin/products/${id}/images`, { headers: headers() }),
        fetch(`${apiBaseUrl}/admin/categories`, { headers: headers() }),
        fetch(`${apiBaseUrl}/admin/authors`, { headers: headers() }),
        fetch(`${apiBaseUrl}/admin/publishers`, { headers: headers() }),
      ]);
    if (productResponse.ok) {
      const product = ((await productResponse.json()) as { data: Product }).data;
      setP(product);
      setForm((current) => current ?? formFromProduct(product));
      const inventoryPairs = await Promise.all(
        product.variants.map(async (variant) => {
          const response = await fetch(`${apiBaseUrl}/admin/inventory/variants/${variant.id}`, {
            headers: headers(),
          });
          if (!response.ok) return [variant.id, null] as const;
          return [variant.id, ((await response.json()) as { data: InventoryDetail }).data] as const;
        }),
      );
      setInventoryByVariant(
        Object.fromEntries(
          inventoryPairs.filter((pair): pair is [string, InventoryDetail] => Boolean(pair[1])),
        ),
      );
    }
    if (imageResponse.ok) setImages(((await imageResponse.json()) as { data: Image[] }).data);
    if (categoryResponse.ok)
      setCats(
        ((await categoryResponse.json()) as { data: Tax[] }).data.filter((x) => !x.deletedAt),
      );
    if (authorResponse.ok)
      setAuthors(
        ((await authorResponse.json()) as { data: Tax[] }).data.filter((x) => !x.deletedAt),
      );
    if (publisherResponse.ok)
      setPubs(
        ((await publisherResponse.json()) as { data: Tax[] }).data.filter((x) => !x.deletedAt),
      );
  };

  useEffect(() => {
    void load();
  }, [id]);

  const checklist = useMemo(() => {
    if (!p) return [];
    return [
      { label: 'Thông tin cơ bản', done: Boolean(p.name.trim() && p.slug.trim()) },
      { label: 'Phân loại', done: p.categories.length > 0 },
      { label: 'Phiên bản và giá bán', done: p.variants.some((variant) => variant.isActive) },
      { label: 'Hình ảnh', done: images.length > 0 },
      { label: 'Đang hiển thị', done: p.isActive },
    ];
  }, [p, images.length]);

  const updateForm = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const patch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || busy) return;
    setMessage('');
    setError('');
    if (!form.name.trim()) {
      setError('Tên sản phẩm là bắt buộc.');
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      setError('Slug chỉ nên gồm chữ thường, số và dấu gạch ngang.');
      return;
    }
    if (form.categoryIds.length === 0) {
      setError('Cần chọn ít nhất một category trước khi lưu.');
      return;
    }
    setBusy(true);
    const body = {
      name: form.name,
      slug: form.slug,
      shortDescription: form.shortDescription,
      description: form.description,
      releaseDate: form.releaseDate || null,
      pageCount: form.pageCount ? Number(form.pageCount) : null,
      language: form.language || null,
      dimensions: form.dimensions || null,
      weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
      publisherId: form.publisherId || null,
      categoryIds: [...new Set(form.categoryIds)],
      primaryCategoryId: form.categoryIds[0] ?? null,
      authorRelations: [...new Set(form.authorIds)].map((authorId, index) => ({
        authorId,
        sortOrder: Number(form.authorSort[authorId] ?? index),
      })),
      isNew: form.isNew,
      isFeatured: form.isFeatured,
      publicationState: form.isActive ? 'ACTIVE' : 'INACTIVE',
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
    };
    const response = await fetch(`${apiBaseUrl}/admin/products/${id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      setError(await readApiMessage(response));
      return;
    }
    setMessage('Đã lưu sản phẩm');
    setForm(null);
    await load();
  };

  const createVariant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (variantBusy) return;
    setMessage('');
    setError('');
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const listPrice = Number(data.get('listPrice'));
    const salePrice = Number(data.get('salePrice'));
    if (
      !Number.isFinite(listPrice) ||
      !Number.isFinite(salePrice) ||
      listPrice <= 0 ||
      salePrice <= 0
    ) {
      setError('Giá niêm yết và giá bán phải lớn hơn 0.');
      return;
    }
    if (salePrice > listPrice) {
      setError('Giá bán không được cao hơn giá niêm yết.');
      return;
    }
    setVariantBusy('create');
    const response = await fetch(`${apiBaseUrl}/admin/products/${id}/variants`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        sku: field(data, 'sku'),
        name: field(data, 'name'),
        isbn: field(data, 'isbn') || null,
        costPrice: Number(data.get('costPrice')),
        listPrice,
        salePrice,
        isActive: true,
      }),
    });
    setVariantBusy('');
    if (!response.ok) {
      setError(await readApiMessage(response));
      return;
    }
    setMessage('Đã tạo phiên bản');
    formElement.reset();
    await load();
  };

  const toggleVariant = async (variant: Variant) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setError('');
    const response = await fetch(`${apiBaseUrl}/admin/products/${id}/variants/${variant.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ isActive: !variant.isActive }),
    });
    setBusy(false);
    setConfirming(null);
    if (!response.ok) {
      setError(await readApiMessage(response));
      return;
    }
    setMessage(variant.isActive ? 'Đã ngừng hiển thị phiên bản' : 'Đã kích hoạt phiên bản');
    await load();
  };

  const updateVariant = async (event: FormEvent<HTMLFormElement>, variantId: string) => {
    event.preventDefault();
    if (variantBusy) return;
    setMessage('');
    setError('');
    const data = new FormData(event.currentTarget);
    const listPrice = Number(data.get('listPrice'));
    const salePrice = Number(data.get('salePrice'));
    if (
      !Number.isFinite(listPrice) ||
      !Number.isFinite(salePrice) ||
      listPrice <= 0 ||
      salePrice <= 0
    ) {
      setError('Giá của phiên bản không hợp lệ.');
      return;
    }
    setVariantBusy(variantId);
    const response = await fetch(`${apiBaseUrl}/admin/products/${id}/variants/${variantId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        isbn: field(data, 'isbn') || null,
        name: field(data, 'name'),
        coverType: field(data, 'coverType') || null,
        costPrice: Number(data.get('costPrice')),
        listPrice,
        salePrice,
        isActive: data.get('isActive') === 'on',
      }),
    });
    setVariantBusy('');
    if (!response.ok) {
      setError(await readApiMessage(response));
      return;
    }
    setMessage('Đã lưu phiên bản');
    await load();
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (imageBusy) return;
    setMessage('');
    setError('');
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const file = data.get('file');
    if (!(file instanceof File) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      setError('Ảnh không hợp lệ hoặc quá 5 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
      return;
    }
    data.set('uploadPurpose', 'PRODUCT');
    data.set('productId', id);
    data.set('isPrimary', data.get('isPrimary') === 'on' ? 'true' : 'false');
    setImageBusy('upload');
    const response = await fetch(`${apiBaseUrl}/admin/uploads/images`, {
      method: 'POST',
      headers: { authorization: `Bearer ${getAccessToken() ?? ''}` },
      body: data,
    });
    setImageBusy('');
    if (!response.ok) {
      setError(await readApiMessage(response));
      return;
    }
    setMessage('Da upload anh');
    formElement.reset();
    await load();
  };

  const imageAction = async (image: Image, body: object) => {
    if (imageBusy) return;
    setImageBusy(image.id);
    setMessage('');
    setError('');
    const response = await fetch(`${apiBaseUrl}/admin/products/${id}/images/${image.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    });
    setImageBusy('');
    if (!response.ok) {
      setError(await readApiMessage(response));
      return;
    }
    setMessage('Đã lưu ảnh');
    await load();
  };

  const deleteImage = async (image: Image) => {
    if (imageBusy) return;
    setImageBusy(image.id);
    setMessage('');
    setError('');
    const response = await fetch(`${apiBaseUrl}/admin/products/${id}/images/${image.id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    setImageBusy('');
    setConfirming(null);
    if (!response.ok) {
      setError(await readApiMessage(response));
      return;
    }
    setMessage('Da xoa anh');
    await load();
  };

  const adjustInventory = async (
    variant: Variant,
    input: { type: string; quantity: number; reason: string },
  ) => {
    const inventory = inventoryByVariant[variant.id];
    if (!inventory) return;
    setBusy(true);
    setAdjustmentError('');
    const response = await fetch(`${apiBaseUrl}/admin/inventory/adjustments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        variantId: variant.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        expectedOnHandQuantity: inventory.onHandQuantity,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      const messages: Record<string, string> = {
        INVENTORY_NEGATIVE_STOCK: 'Không thể điều chỉnh làm tồn kho âm.',
        INVENTORY_ADJUSTMENT_CONFLICT: 'Tồn kho vừa được cập nhật ở phiên khác. Vui lòng tải lại.',
        FORBIDDEN_PERMISSION: 'Tài khoản hiện tại không có quyền điều chỉnh tồn kho.',
      };
      setAdjustmentError(messages[body?.error?.code ?? ''] ?? 'Không thể điều chỉnh tồn kho.');
      if (body?.error?.code === 'INVENTORY_ADJUSTMENT_CONFLICT') await load();
      return;
    }
    const body = (await response.json()) as { data: { inventory: InventoryDetail } };
    setInventoryByVariant((current) => ({ ...current, [variant.id]: body.data.inventory }));
    setAdjustingVariant(null);
    setMessage('Đã ghi nhận điều chỉnh tồn kho');
    await load();
  };

  const restoreFocus = () => {
    confirming?.trigger?.focus();
    setConfirming(null);
  };

  if (!p || !form)
    return (
      <main className="catalog-page" aria-busy="true">
        Đang tải sản phẩm...
      </main>
    );

  return (
    <main className="catalog-page admin-product-editor">
      <header className="admin-editor-header">
        <div>
          <Link className="detail-link" href="/admin/catalog">
            Quay lại catalog
          </Link>
          <h1>Chỉnh sửa sản phẩm</h1>
          <p>{p.name}</p>
        </div>
        <span className={p.isActive ? 'order-status-badge paid' : 'order-status-badge cancelled'}>
          {p.isActive ? 'Đang hiển thị' : 'Chưa hiển thị'}
        </span>
      </header>

      <p>{admin ? 'Quản trị đang chỉnh sửa' : 'Nhân viên - chỉ đọc'}</p>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <section className="admin-completion-panel" aria-labelledby="completion-title">
        <h2 id="completion-title">Checklist hoàn thiện</h2>
        <ul>
          {checklist.map((item) => (
            <li key={item.label} data-done={item.done}>
              <span aria-hidden="true">{item.done ? '✓' : '!'}</span>
              {item.label}
            </li>
          ))}
        </ul>
        <p>
          Sản phẩm mới được giữ chưa hiển thị cho đến khi thông tin, phiên bản và hình ảnh sẵn sàng.
        </p>
      </section>

      {admin ? (
        <form className="admin-editor-form" onSubmit={(event) => void patch(event)}>
          <Section title="Thông tin cơ bản">
            <label>
              Tên sản phẩm
              <input
                name="name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                required
              />
            </label>
            <label>
              Slug
              <input
                name="slug"
                value={form.slug}
                onChange={(event) => updateForm('slug', event.target.value)}
                required
              />
            </label>
            <label>
              Mô tả ngắn
              <input
                name="shortDescription"
                value={form.shortDescription}
                maxLength={1000}
                onChange={(event) => updateForm('shortDescription', event.target.value)}
              />
            </label>
          </Section>

          <Section title="Mô tả">
            <label>
              Mô tả Markdown
              <textarea
                name="description"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
              />
            </label>
          </Section>

          <Section title="Phân loại">
            <label>
              Nhà xuất bản
              <select
                name="publisherId"
                value={form.publisherId}
                onChange={(event) => updateForm('publisherId', event.target.value)}
              >
                <option value="">Chưa chọn nhà xuất bản</option>
                {pubs.map((publisher) => (
                  <option key={publisher.id} value={publisher.id}>
                    {publisher.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Danh mục</legend>
              {cats.map((category) => (
                <label key={category.id}>
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={category.id}
                    checked={form.categoryIds.includes(category.id)}
                    onChange={(event) =>
                      updateForm(
                        'categoryIds',
                        event.target.checked
                          ? [...form.categoryIds, category.id]
                          : form.categoryIds.filter((idValue) => idValue !== category.id),
                      )
                    }
                  />
                  {category.name}
                </label>
              ))}
            </fieldset>
          </Section>

          <Section title="Tác giả và nhà xuất bản">
            <fieldset>
              <legend>Tác giả</legend>
              {authors.map((author, index) => (
                <div key={author.id} className="admin-author-row">
                  <label>
                    <input
                      type="checkbox"
                      name="authorIds"
                      value={author.id}
                      checked={form.authorIds.includes(author.id)}
                      onChange={(event) =>
                        updateForm(
                          'authorIds',
                          event.target.checked
                            ? [...form.authorIds, author.id]
                            : form.authorIds.filter((idValue) => idValue !== author.id),
                        )
                      }
                    />
                    {author.name}
                  </label>
                  <label>
                    Thứ tự
                    <input
                      name={`authorSort-${author.id}`}
                      type="number"
                      min="0"
                      value={form.authorSort[author.id] ?? index}
                      onChange={(event) =>
                        updateForm('authorSort', {
                          ...form.authorSort,
                          [author.id]: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              ))}
            </fieldset>
            <label>
              Ngày phát hành
              <input
                name="releaseDate"
                type="date"
                value={form.releaseDate}
                onChange={(event) => updateForm('releaseDate', event.target.value)}
              />
            </label>
            <label>
              Số trang
              <input
                name="pageCount"
                type="number"
                min="1"
                value={form.pageCount}
                onChange={(event) => updateForm('pageCount', event.target.value)}
              />
            </label>
            <label>
              Ngôn ngữ
              <input
                name="language"
                value={form.language}
                onChange={(event) => updateForm('language', event.target.value)}
              />
            </label>
            <label>
              Kích thước
              <input
                name="dimensions"
                value={form.dimensions}
                onChange={(event) => updateForm('dimensions', event.target.value)}
              />
            </label>
            <label>
              Khối lượng (gram)
              <input
                name="weightGrams"
                type="number"
                min="1"
                value={form.weightGrams}
                onChange={(event) => updateForm('weightGrams', event.target.value)}
              />
            </label>
          </Section>

          <Section title="Hiển thị và trạng thái">
            <label>
              <input
                type="checkbox"
                name="isNew"
                checked={form.isNew}
                onChange={(event) => updateForm('isNew', event.target.checked)}
              />
              Sách mới
            </label>
            <label>
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={(event) => updateForm('isFeatured', event.target.checked)}
              />
              Nổi bật
            </label>
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={(event) => updateForm('isActive', event.target.checked)}
              />
              Đang hiển thị
            </label>
            <label>
              Tiêu đề SEO
              <input
                name="seoTitle"
                value={form.seoTitle}
                maxLength={70}
                onChange={(event) => updateForm('seoTitle', event.target.value)}
              />
            </label>
            <label>
              Mô tả SEO
              <input
                name="seoDescription"
                value={form.seoDescription}
                maxLength={170}
                onChange={(event) => updateForm('seoDescription', event.target.value)}
              />
            </label>
          </Section>

          <button disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
        </form>
      ) : (
        <section className="admin-editor-section">
          <h2>Thông tin sản phẩm</h2>
          <dl className="admin-readonly-grid">
            <div>
              <dt>Tên</dt>
              <dd>{p.name}</dd>
            </div>
            <div>
              <dt>Slug</dt>
              <dd>{p.slug}</dd>
            </div>
            <div>
              <dt>Danh mục</dt>
              <dd>{p.categories.map((category) => category.name).join(', ') || 'Chưa có'}</dd>
            </div>
          </dl>
        </section>
      )}

      <Section title="Phiên bản và giá bán">
        {p.variants.map((variant) => (
          <article className="variant-editor-card" key={variant.id}>
            <section className="inventory-panel" aria-labelledby={`inventory-${variant.id}`}>
              <h3 id={`inventory-${variant.id}`}>Tồn kho {variant.sku}</h3>
              <dl className="inventory-summary">
                <div>
                  <dt>Hiện có</dt>
                  <dd>
                    {inventoryByVariant[variant.id]?.onHandQuantity ??
                      variant.inventory?.onHandQuantity ??
                      0}
                  </dd>
                </div>
                <div>
                  <dt>Đang giữ</dt>
                  <dd>
                    {inventoryByVariant[variant.id]?.reservedQuantity ??
                      variant.inventory?.reservedQuantity ??
                      0}
                  </dd>
                </div>
                <div>
                  <dt>Có thể bán</dt>
                  <dd>
                    {inventoryByVariant[variant.id]?.availableQuantity ??
                      variant.inventory?.availableQuantity ??
                      0}
                  </dd>
                </div>
              </dl>
              {admin && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setAdjustmentError('');
                    setAdjustingVariant(variant);
                  }}
                >
                  Điều chỉnh tồn kho
                </button>
              )}
              {inventoryByVariant[variant.id]?.ledger.length ? (
                <div className="inventory-ledger" aria-label={`Lịch sử tồn kho ${variant.sku}`}>
                  <h4>Lịch sử điều chỉnh</h4>
                  <ol>
                    {inventoryByVariant[variant.id]!.ledger.map((entry) => (
                      <li key={entry.id}>
                        <time dateTime={entry.createdAt}>
                          {new Date(entry.createdAt).toLocaleString('vi-VN')}
                        </time>
                        <strong>
                          {adjustmentLabels[entry.adjustmentType] ?? entry.adjustmentType}
                        </strong>
                        <span>{entry.actorName ?? 'Hệ thống'}</span>
                        <span>
                          {entry.beforeQuantity} -{' '}
                          {entry.quantityDelta > 0
                            ? `+${entry.quantityDelta}`
                            : entry.quantityDelta}{' '}
                          - {entry.afterQuantity}
                        </span>
                        <p>{entry.reason}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p>Chưa có lịch sử điều chỉnh kho.</p>
              )}
            </section>

            {admin ? (
              <form onSubmit={(event) => void updateVariant(event, variant.id)}>
                <label>
                  SKU
                  <input value={variant.sku} readOnly />
                </label>
                <label>
                  ISBN
                  <input name="isbn" defaultValue={variant.isbn ?? ''} />
                </label>
                <label>
                  Tên
                  <input name="name" defaultValue={variant.name} required />
                </label>
                <label>
                  Loại bìa
                  <input name="coverType" defaultValue={variant.coverType ?? ''} />
                </label>
                <label>
                  Giá vốn
                  <input
                    name="costPrice"
                    type="number"
                    min="0"
                    defaultValue={variant.costPrice}
                    required
                  />
                </label>
                <label>
                  Giá niêm yết
                  <input
                    name="listPrice"
                    type="number"
                    min="1"
                    defaultValue={variant.listPrice}
                    required
                  />
                </label>
                <label>
                  Giá bán
                  <input
                    name="salePrice"
                    type="number"
                    min="1"
                    defaultValue={variant.salePrice}
                    required
                  />
                </label>
                <label>
                  <input name="isActive" type="checkbox" defaultChecked={variant.isActive} />
                  Đang hiển thị
                </label>
                <button disabled={variantBusy === variant.id}>
                  {variantBusy === variant.id ? 'Đang lưu...' : 'Lưu phiên bản'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={(event) =>
                    setConfirming({ kind: 'variant', variant, trigger: event.currentTarget })
                  }
                >
                  {variant.isActive ? 'Ngừng hiển thị' : 'Kích hoạt lại'}
                </button>
              </form>
            ) : (
              <dl className="admin-readonly-grid">
                <div>
                  <dt>SKU</dt>
                  <dd>{variant.sku}</dd>
                </div>
                <div>
                  <dt>Tên</dt>
                  <dd>{variant.name}</dd>
                </div>
                <div>
                  <dt>Giá bán</dt>
                  <dd>{money(variant.salePrice)}đ</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{variant.isActive ? 'Đang hiển thị' : 'Ngừng hiển thị'}</dd>
                </div>
              </dl>
            )}
          </article>
        ))}

        {admin && (
          <form className="variant-editor-card" onSubmit={(event) => void createVariant(event)}>
            <h3>Tạo phiên bản mới</h3>
            <label>
              SKU
              <input name="sku" placeholder="SKU" required />
            </label>
            <label>
              ISBN
              <input name="isbn" placeholder="ISBN" />
            </label>
            <label>
              Tên phiên bản
              <input name="name" placeholder="Tên phiên bản" required />
            </label>
            <label>
              Giá vốn mới
              <input name="costPrice" type="number" min="0" required />
            </label>
            <label>
              Giá niêm yết mới
              <input name="listPrice" type="number" min="1" required />
            </label>
            <label>
              Giá bán mới
              <input name="salePrice" type="number" min="1" required />
            </label>
            <button disabled={variantBusy === 'create'}>
              {variantBusy === 'create' ? 'Đang tạo...' : 'Tạo phiên bản'}
            </button>
          </form>
        )}
      </Section>

      <Section title="Hình ảnh">
        <div className="image-editor-grid">
          {images.length === 0 ? (
            <div className="product-image">RoSach</div>
          ) : (
            images.map((image) => (
              <article className="image-editor-card" key={image.id}>
                <img src={displayImageUrl(image.url)} alt={image.altText} width="100" />
                {image.isPrimary && <b>Ảnh chính</b>}
                {admin ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      void imageAction(image, {
                        altText: field(data, 'altText'),
                        sortOrder: Number(data.get('sortOrder')),
                      });
                    }}
                  >
                    <label>
                      Mô tả ảnh
                      <input name="altText" defaultValue={image.altText} placeholder="Mô tả ảnh" />
                    </label>
                    <label>
                      Thứ tự hiển thị
                      <input
                        name="sortOrder"
                        type="number"
                        min="0"
                        defaultValue={image.sortOrder}
                      />
                    </label>
                    <button disabled={imageBusy === image.id}>Lưu ảnh</button>
                    <button
                      type="button"
                      disabled={imageBusy === image.id || image.isPrimary}
                      onClick={() => void imageAction(image, { isPrimary: true })}
                    >
                      Đặt làm ảnh chính
                    </button>
                    <button
                      type="button"
                      disabled={imageBusy === image.id}
                      onClick={(event) =>
                        setConfirming({ kind: 'image', image, trigger: event.currentTarget })
                      }
                    >
                      Gỡ ảnh
                    </button>
                  </form>
                ) : (
                  <p>
                    Thứ tự {image.sortOrder} - {image.isPrimary ? 'Ảnh chính' : 'Ảnh phụ'}
                  </p>
                )}
              </article>
            ))
          )}
        </div>

        {admin && (
          <form className="image-upload-form" onSubmit={(event) => void upload(event)}>
            <label>
              Chọn ảnh
              <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
            </label>
            <label>
              Phiên bản
              <select name="productVariantId">
                <option value="">Ảnh chung của sản phẩm</option>
                {p.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.sku}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mô tả ảnh
              <input name="altText" placeholder="Mô tả ảnh" />
            </label>
            <label>
              Thứ tự hiển thị
              <input name="sortOrder" type="number" min="0" defaultValue="0" />
            </label>
            <label>
              <input name="isPrimary" type="checkbox" />
              Ảnh chính
            </label>
            <button disabled={imageBusy === 'upload'}>
              {imageBusy === 'upload' ? 'Đang tải ảnh...' : 'Tải ảnh lên (tối đa 5 MB)'}
            </button>
          </form>
        )}
      </Section>

      <Section title="Tồn kho">
        <p>
          Tồn kho chỉ được thay đổi qua luồng điều chỉnh có audit. Trình biên tập sản phẩm không có
          trường nhập số lượng trực tiếp.
        </p>
      </Section>

      {adjustingVariant && inventoryByVariant[adjustingVariant.id] && (
        <InventoryAdjustmentDialog
          variant={adjustingVariant}
          inventory={inventoryByVariant[adjustingVariant.id]!}
          busy={busy}
          error={adjustmentError}
          onClose={() => setAdjustingVariant(null)}
          onSubmit={(input) => void adjustInventory(adjustingVariant, input)}
        />
      )}

      {confirming?.kind === 'variant' && (
        <ConfirmationDialog
          title={confirming.variant.isActive ? 'Ngừng hiển thị phiên bản' : 'Kích hoạt phiên bản'}
          description={`${confirming.variant.sku} sẽ ${
            confirming.variant.isActive ? 'biến mất khỏi trang công khai' : 'được mở lại'
          }. Dữ liệu lịch sử đơn hàng và audit được giữ nguyên, không hard-delete.`}
          confirmLabel={confirming.variant.isActive ? 'Ngừng hiển thị' : 'Kích hoạt lại'}
          busy={busy}
          onCancel={restoreFocus}
          onConfirm={() => void toggleVariant(confirming.variant)}
        />
      )}

      {confirming?.kind === 'image' && (
        <ConfirmationDialog
          title="Xóa ảnh sản phẩm"
          description="Ảnh sẽ bị gỡ khỏi sản phẩm và thư viện công khai sau khi server xác nhận. Không xóa sản phẩm hay phiên bản."
          confirmLabel="Gỡ ảnh"
          busy={imageBusy === confirming.image.id}
          onCancel={restoreFocus}
          onConfirm={() => void deleteImage(confirming.image)}
        />
      )}
    </main>
  );
}
