import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from './profile-form';
import { AddressBook } from './address-book';
import { PasswordForm } from './password-form';
import { AccountShell } from './account-shell';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  authenticated: true,
  hasToken: false,
  api: {
    profile: vi.fn(),
    updateProfile: vi.fn(),
    addresses: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
    setDefault: vi.fn(),
    changePassword: vi.fn(),
  },
}));
const api = mocks.api;
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => '/tai-khoan',
}));
vi.mock('../../services/auth-client', () => ({
  bootstrapSession: vi.fn(() => Promise.resolve(mocks.authenticated)),
  getAccessToken: vi.fn(() => (mocks.hasToken ? 'token' : null)),
  logout: vi.fn(() => Promise.resolve()),
}));
vi.mock('../../services/account-client', () => ({
  accountApi: mocks.api,
  AccountApiError: class AccountApiError extends Error {
    constructor(public code: string) {
      super(code);
    }
  },
}));

const profile = {
  id: '1',
  username: 'customer',
  fullName: 'Customer',
  email: 'c@test.local',
  phone: '+84901111111',
  birthday: null,
  gender: null,
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
};
const address = {
  id: '2',
  recipientName: 'Customer',
  phone: '+84901111111',
  line1: '1 Main',
  ward: 'W',
  district: 'D',
  province: 'P',
  postalCode: null,
  isDefault: true,
  createdAt: 'x',
  updatedAt: 'x',
};
const secondAddress = { ...address, id: '3', recipientName: 'Second', isDefault: false };

describe('M4 Customer Account UI', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated = true;
    mocks.hasToken = false;
    api.profile.mockResolvedValue(profile);
    api.updateProfile.mockResolvedValue({ ...profile, fullName: 'Updated' });
    api.addresses.mockResolvedValue([address, secondAddress]);
    api.createAddress.mockResolvedValue(address);
    api.updateAddress.mockResolvedValue(address);
    api.deleteAddress.mockResolvedValue(null);
    api.setDefault.mockResolvedValue(address);
    api.changePassword.mockResolvedValue(undefined);
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
  });
  it('renders and submits profile with read-only email', async () => {
    render(<ProfileForm />);
    expect(await screen.findByDisplayValue('c@test.local')).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByText('Lưu hồ sơ'));
    await waitFor(() => expect(api.updateProfile).toHaveBeenCalled());
    expect(await screen.findByText('Đã cập nhật hồ sơ.')).toBeInTheDocument();
  });
  it('creates, edits, defaults and deletes addresses', async () => {
    render(<AddressBook />);
    expect(await screen.findByText(/Mặc định/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Người nhận'), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0909999999' } });
    fireEvent.change(screen.getByLabelText('Địa chỉ'), { target: { value: '3 Main' } });
    fireEvent.change(screen.getByLabelText('Phường/xã'), { target: { value: 'W' } });
    fireEvent.change(screen.getByLabelText('Quận/huyện'), { target: { value: 'D' } });
    fireEvent.change(screen.getByLabelText('Tỉnh/thành'), { target: { value: 'P' } });
    fireEvent.click(screen.getByRole('button', { name: 'Thêm địa chỉ' }));
    await waitFor(() => expect(api.createAddress).toHaveBeenCalled());
    fireEvent.click(screen.getAllByText('Sửa')[0]!);
    fireEvent.change(screen.getByLabelText('Địa chỉ'), { target: { value: '2 Main' } });
    fireEvent.click(screen.getByText('Lưu địa chỉ'));
    await waitFor(() => expect(api.updateAddress).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Đặt mặc định'));
    await waitFor(() => expect(api.setDefault).toHaveBeenCalledWith('3'));
    const deleteButtons = screen.getAllByText('Xóa');
    fireEvent.click(deleteButtons[0]!);
    await waitFor(() => expect(api.deleteAddress).toHaveBeenCalledWith('2'));
  });
  it('changes password and reports confirm errors', async () => {
    render(<PasswordForm />);
    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'Old12345' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'New12345' } });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'Mismatch1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(await screen.findByText('Xác nhận mật khẩu không khớp.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'New12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    await waitFor(() => expect(api.changePassword).toHaveBeenCalledWith('Old12345', 'New12345'));
  });
  it('redirects unauthenticated users', async () => {
    mocks.authenticated = false;
    render(
      <AccountShell>
        <p>Secret</p>
      </AccountShell>,
    );
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/dang-nhap?returnUrl=%2Ftai-khoan'),
    );
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });
  it('shows only account-area navigation', async () => {
    render(
      <AccountShell>
        <p>Account content</p>
      </AccountShell>,
    );
    expect(await screen.findByText('Account content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tổng quan' })).toHaveAttribute('href', '/tai-khoan');
    expect(screen.getByRole('link', { name: 'Hồ sơ' })).toHaveAttribute('href', '/tai-khoan/ho-so');
    expect(screen.getByRole('link', { name: 'Địa chỉ' })).toHaveAttribute(
      'href',
      '/tai-khoan/dia-chi',
    );
    expect(screen.queryByRole('link', { name: 'Trang chủ' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sản phẩm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).not.toBeInTheDocument();
  });
});
