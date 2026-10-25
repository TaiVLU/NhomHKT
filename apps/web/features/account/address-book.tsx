'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { accountApi, type AddressDto } from '../../services/account-client';

const empty = {
  recipientName: '',
  phone: '',
  line1: '',
  ward: '',
  district: '',
  province: '',
  postalCode: '',
};

export function AddressBook() {
  const [items, setItems] = useState<AddressDto[]>([]);
  const [editing, setEditing] = useState<AddressDto | null>(null);
  const [message, setMessage] = useState('Đang tải địa chỉ…');
  const [loading, setLoading] = useState(true);

  const load = async (clearMessage = true) => {
    try {
      setItems(await accountApi.addresses());
      if (clearMessage) setMessage('');
    } catch {
      setMessage('Không thể tải địa chỉ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const body = {
      recipientName: form.get('recipientName'),
      phone: form.get('phone'),
      line1: form.get('line1'),
      ward: form.get('ward'),
      district: form.get('district'),
      province: form.get('province'),
      postalCode: form.get('postalCode') || null,
    };
    try {
      if (editing) await accountApi.updateAddress(editing.id, body);
      else await accountApi.createAddress(body);
      const successMessage = editing ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.';
      setEditing(null);
      formElement.reset();
      await load(false);
      setMessage(successMessage);
    } catch {
      setMessage('Địa chỉ không hợp lệ.');
    }
  };

  const remove = async (item: AddressDto) => {
    if (!confirm(`Xóa địa chỉ của ${item.recipientName}?`)) return;
    try {
      await accountApi.deleteAddress(item.id);
      await load(false);
      setMessage('Đã xóa địa chỉ.');
    } catch {
      setMessage('Không thể xóa địa chỉ.');
    }
  };

  const setDefault = async (id: string) => {
    try {
      await accountApi.setDefault(id);
      await load(false);
      setMessage('Đã đổi địa chỉ mặc định.');
    } catch {
      setMessage('Không thể đổi địa chỉ mặc định.');
    }
  };

  const values = editing ?? empty;

  return (
    <section className="address-page">
      {message && <p role="status" className="mb-4 text-sm text-slate-600 font-medium">{message}</p>}
      
      {!loading && items.length > 0 && (
        <div className="address-list mb-8">
          {items.map((item) => (
            <article className="address-card" key={item.id} style={{ borderRadius: '12px' }}>
              <h2>
                {item.recipientName} {item.isDefault && <span>— Mặc định</span>}
              </h2>
              <p className="address-phone">{item.phone}</p>
              <p className="address-text">
                {item.line1}, {item.ward}, {item.district}, {item.province}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  style={{ borderRadius: '8px' }}
                  className="border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#0080c8] hover:text-[#0080c8]"
                >
                  Sửa
                </button>
                {!item.isDefault && (
                  <button
                    type="button"
                    onClick={() => void setDefault(item.id)}
                    style={{ borderRadius: '8px' }}
                    className="border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#0080c8] hover:text-[#0080c8]"
                  >
                    Đặt mặc định
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void remove(item)}
                  style={{ borderRadius: '8px' }}
                  className="border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm transition hover:border-rose-400 hover:bg-rose-50"
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="account-card form-card address-form-card" style={{ borderRadius: '16px' }}>
        <h2 className="text-xl font-bold text-slate-800 mb-5">
          {editing ? 'Sửa địa chỉ' : 'Địa chỉ nhận hàng'}
        </h2>
        <form key={editing?.id ?? 'new'} onSubmit={(event) => void submit(event)}>
          <label>
            Người nhận{' '}
            <input
              name="recipientName"
              defaultValue={values.recipientName}
              required
              style={{ fontWeight: 400, borderRadius: '8px' }}
              className="!font-normal text-slate-700"
            />
          </label>
          <label>
            Số điện thoại{' '}
            <input
              name="phone"
              defaultValue={values.phone}
              required
              style={{ fontWeight: 400, borderRadius: '8px' }}
              className="!font-normal text-slate-700"
            />
          </label>
          <label>
            Địa chỉ{' '}
            <input
              name="line1"
              defaultValue={values.line1}
              required
              style={{ fontWeight: 400, borderRadius: '8px' }}
              className="!font-normal text-slate-700"
            />
          </label>
          <label>
            Phường/xã{' '}
            <input
              name="ward"
              defaultValue={values.ward}
              required
              style={{ fontWeight: 400, borderRadius: '8px' }}
              className="!font-normal text-slate-700"
            />
          </label>
          <label>
            Quận/huyện{' '}
            <input
              name="district"
              defaultValue={values.district}
              required
              style={{ fontWeight: 400, borderRadius: '8px' }}
              className="!font-normal text-slate-700"
            />
          </label>
          <label>
            Tỉnh/thành{' '}
            <input
              name="province"
              defaultValue={values.province}
              required
              style={{ fontWeight: 400, borderRadius: '8px' }}
              className="!font-normal text-slate-700"
            />
          </label>
          <label>
            Mã bưu chính{' '}
            <input
              name="postalCode"
              defaultValue={values.postalCode ?? ''}
              style={{ fontWeight: 400, borderRadius: '8px' }}
              className="!font-normal text-slate-700"
            />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', paddingTop: '12px' }}>
            <button
              type="submit"
              style={{
                borderRadius: '8px',
                width: 'fit-content',
                minWidth: '140px',
                height: '42px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="bg-[#0080c8] px-6 text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98]"
            >
              {editing ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                style={{
                  borderRadius: '8px',
                  width: 'fit-content',
                  minWidth: '90px',
                  height: '42px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98]"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </section>
    </section>
  );
}