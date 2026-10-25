'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { accountApi, AccountApiError, type ProfileDto } from '../../services/account-client';

export function ProfileForm({ overview = false }: { overview?: boolean }) {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void accountApi
      .profile()
      .then(setProfile)
      .catch(() => setMessage('Không thể tải hồ sơ.'));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage('Đang lưu…');
    try {
      const updated = await accountApi.updateProfile({
        fullName: form.get('fullName'),
        phone: form.get('phone'),
        birthday: form.get('birthday') || null,
        gender: form.get('gender') || null,
      });
      setProfile(updated);
      setMessage('Đã cập nhật hồ sơ.');
    } catch (error) {
      setMessage(
        error instanceof AccountApiError && error.code === 'PROFILE_PHONE_CONFLICT'
          ? 'Số điện thoại đã được sử dụng.'
          : 'Hồ sơ không hợp lệ.',
      );
    }
  };

  if (!profile) return <section aria-busy="true">{message || 'Đang tải hồ sơ…'}</section>;

  if (overview)
    return (
      <section className="account-card account-overview">
        <p className="eyebrow">Tổng quan</p>
        <h1>Xin chào, {profile.fullName}</h1>
        <div className="account-details">
          <p>
            <span>Email</span>
            {profile.email}
          </p>
          <p>
            <span>Số điện thoại</span>
            {profile.phone}
          </p>
        </div>

        {/* Cả 3 nút đều là nền trắng vuông mềm (8px), chỉ khi rê chuột vào mới sáng xanh */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '8px',
          }}
        >
          <Link
            href="/tai-khoan/ho-so"
            style={{ borderRadius: '8px' }}
            className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0080c8] hover:bg-[#0080c8] hover:text-white hover:shadow-md hover:shadow-[#0080c8]/25 active:scale-[0.98]"
          >
            Cập nhật hồ sơ
          </Link>
          <Link
            href="/tai-khoan/dia-chi"
            style={{ borderRadius: '8px' }}
            className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0080c8] hover:bg-[#0080c8] hover:text-white hover:shadow-md hover:shadow-[#0080c8]/25 active:scale-[0.98]"
          >
            Quản lý địa chỉ
          </Link>
          <Link
            href="/tai-khoan/doi-mat-khau"
            style={{ borderRadius: '8px' }}
            className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#0080c8] hover:bg-[#0080c8] hover:text-white hover:shadow-md hover:shadow-[#0080c8]/25 active:scale-[0.98]"
          >
            Đổi mật khẩu
          </Link>
        </div>
      </section>
    );

  return (
    <section className="account-card form-card">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Hồ sơ cá nhân</h2>
      {message && <p role="status">{message}</p>}
      <form onSubmit={(event) => void submit(event)}>
        <label>
          Họ và tên{' '}
          <input
            name="fullName"
            defaultValue={profile.fullName}
            required
            style={{ fontWeight: 400, borderRadius: '8px' }}
            className="!font-normal text-slate-700"
          />
        </label>
        <label>
          Email{' '}
          <input
            value={profile.email}
            readOnly
            style={{ fontWeight: 400, borderRadius: '8px' }}
            className="!font-normal text-slate-700"
          />
        </label>
        <label>
          Số điện thoại{' '}
          <input
            name="phone"
            defaultValue={profile.phone}
            required
            style={{ fontWeight: 400, borderRadius: '8px' }}
            className="!font-normal text-slate-700"
          />
        </label>
        <label>
          Ngày sinh{' '}
          <input
            name="birthday"
            type="date"
            defaultValue={profile.birthday ?? ''}
            style={{ fontWeight: 400, borderRadius: '8px' }}
            className="!font-normal text-slate-700"
          />
        </label>
        <label>
          Giới tính{' '}
          <select
            name="gender"
            defaultValue={profile.gender ?? ''}
            style={{ fontWeight: 400, borderRadius: '8px' }}
            className="!font-normal text-slate-700"
          >
            <option value="">Không cung cấp</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </label>

        {/* Nút Lưu hồ sơ: Đứng riêng 1 hàng dưới cùng, gọn gàng và có đổ bóng xanh */}
        <div style={{ gridColumn: '1 / -1', paddingTop: '12px' }}>
          <button
            type="submit"
            style={{
              borderRadius: '8px',
              width: 'fit-content',
              minWidth: '130px',
              height: '42px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="bg-[#0080c8] px-6 text-sm font-semibold text-white shadow-md shadow-[#0080c8]/25 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#0070b0] hover:shadow-lg hover:shadow-[#0080c8]/35 active:scale-[0.98]"
          >
            Lưu hồ sơ
          </button>
        </div>
      </form>
    </section>
  );
}