'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { useCart } from '../cart/cart-provider';
import {
  bootstrapSession,
  getAccessToken,
  getCurrentRole,
  getCurrentUserLabel,
  logout,
  subscribeAuth,
} from '../../services/auth-client';

const links = [
  { href: '/', label: 'Trang chủ' },
  { href: '/danh-muc', label: 'Danh mục' },
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/khuyen-mai', label: 'Khuyến mãi' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const navId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [, refresh] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart } = useCart();

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeAuth(() => refresh((value) => value + 1));
    if (!getAccessToken()) {
      void bootstrapSession();
    }
    return unsubscribe;
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const authenticated = Boolean(getAccessToken());
  const role = getCurrentRole();
  const label = getCurrentUserLabel() ?? 'Tài khoản';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-logo" href="/" aria-label="HKT Store — Trang chủ">
          HKT Store
        </Link>
        <button
          ref={menuButtonRef}
          className="site-menu-toggle"
          type="button"
          aria-controls={navId}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span aria-hidden="true">☰</span>
          Menu
        </button>
        <nav id={navId} data-open={menuOpen} aria-label="Điều hướng chính">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={
                pathname === link.href ||
                (link.href === '/san-pham' &&
                  (pathname.startsWith('/san-pham/') || pathname.startsWith('/sach/')))
                  ? 'page'
                  : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div 
          className="header-actions" 
          aria-label="Tài khoản"
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}
        >
          <Link
            className="cart-header-link header-action-item"
            href="/gio-hang"
            aria-label={`Giỏ hàng${cart?.totalQuantity ? `, ${cart.totalQuantity} sản phẩm` : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', lineHeight: 1 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span>Giỏ hàng</span>
            {Boolean(cart?.totalQuantity) && (
              <span className="cart-badge" key={cart?.totalQuantity} aria-hidden="true">
                {cart?.totalQuantity}
              </span>
            )}
          </Link>

          {!mounted ? (
            <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
              Đang kiểm tra…
            </span>
          ) : authenticated ? (
            <>
              {(role === 'ADMIN' || role === 'STAFF') && (
                <Link 
                  href="/admin/dashboard"
                  className="header-action-item"
                  style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
                >
                  {role === 'ADMIN' ? 'Khu vực Admin' : 'Khu vực Staff'}
                </Link>
              )}
              <Link 
                href="/tai-khoan"
                className="header-action-item"
                style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
              >
                {label}
              </Link>
              <button
                type="button"
                className="header-logout-btn"
                onClick={() => {
                  void logout().finally(() => router.replace('/'));
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  font: 'inherit',
                  color: 'inherit',
                  lineHeight: 1,
                }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/dang-nhap"
                className="header-action-item"
                style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}
              >
                Đăng nhập
              </Link>
              <Link className="button-link compact" href="/dang-ky">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}