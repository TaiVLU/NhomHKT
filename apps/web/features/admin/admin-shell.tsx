'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  bootstrapSession,
  getCurrentRole,
  getCurrentUserLabel,
  logout,
  subscribeAuth,
} from '../../services/auth-client';

const navigation = [
  ['/admin/dashboard', 'Tổng quan'],
  ['/admin/revenue', 'Doanh thu'],
  ['/admin/product-statistics', 'Thống kê sản phẩm'],
  ['/admin/orders', 'Đơn hàng'],
  ['/admin/catalog', 'Sản phẩm'],
  ['/admin/inventory', 'Tồn kho'],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>(
    pathname === '/admin/login' ? 'allowed' : 'checking',
  );
  const [, redraw] = useState(0);

  useEffect(() => subscribeAuth(() => redraw((value) => value + 1)), []);
  useEffect(() => {
    if (pathname === '/admin/login' || pathname === '/admin/403') {
      setAccess('allowed');
      return;
    }
    setAccess('checking');
    let active = true;
    void bootstrapSession().then((authenticated) => {
      if (!active) return;
      const role = getCurrentRole();
      if (!authenticated || (role !== 'ADMIN' && role !== 'STAFF')) {
        setAccess('denied');
        router.replace('/');
        return;
      }
      setAccess('allowed');
    });
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (pathname === '/admin/login' || pathname === '/admin/403') return children;
  if (access === 'checking')
    return (
      <main className="admin-gate" aria-busy="true">
        <div className="admin-skeleton-card" />
        <p>Đang xác thực phiên quản trị…</p>
      </main>
    );
  if (access === 'denied')
    return (
      <main className="admin-access-denied">
        <h1>Không có quyền truy cập</h1>
        <p>Bạn không có quyền truy cập khu vực quản trị.</p>
        <Link href="/">Về trang chủ</Link>
      </main>
    );

  const role = getCurrentRole();
  const roleLabel = role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên · chỉ đọc';
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/dashboard">
          <span>HKTStore</span>
          <small>Operations Center</small>
        </Link>
        <div className="admin-identity">
          <strong>{getCurrentUserLabel() ?? roleLabel}</strong>
          <span>{roleLabel}</span>
        </div>
        <nav aria-label="Điều hướng quản trị">
          {navigation.map(([href, label]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="admin-logout"
          onClick={() =>
            void logout().finally(() => {
              router.replace('/admin/login');
            })
          }
        >
          Đăng xuất
        </button>
      </aside>
      <div className="admin-workspace">
        <header className="admin-mobile-header">
          <strong>HKTStore Admin</strong>
          <span>{roleLabel}</span>
        </header>
        <nav className="admin-mobile-nav" aria-label="Điều hướng quản trị di động">
          {navigation.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
