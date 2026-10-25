'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { bootstrapSession, getAccessToken } from '../../services/auth-client';

export function AccountShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const authenticate = getAccessToken() ? Promise.resolve(true) : bootstrapSession();
    void authenticate.then((authenticated) => {
      if (!authenticated) router.replace(`/dang-nhap?returnUrl=${encodeURIComponent(pathname)}`);
      else setReady(true);
    });
  }, [pathname, router]);
  if (!ready) return <main aria-busy="true">Đang xác thực…</main>;
  return (
    <main className="account-page">
      <aside className="account-sidebar">
        <p className="eyebrow">Tài khoản của tôi</p>
        <nav aria-label="Tài khoản">
          <Link href="/tai-khoan" aria-current={pathname === '/tai-khoan' ? 'page' : undefined}>
            Tổng quan
          </Link>
          <Link
            href="/tai-khoan/ho-so"
            aria-current={pathname === '/tai-khoan/ho-so' ? 'page' : undefined}
          >
            Hồ sơ
          </Link>
          <Link
            href="/tai-khoan/dia-chi"
            aria-current={pathname === '/tai-khoan/dia-chi' ? 'page' : undefined}
          >
            Địa chỉ
          </Link>
          <Link
            href="/tai-khoan/don-hang"
            aria-current={pathname.startsWith('/tai-khoan/don-hang') ? 'page' : undefined}
          >
            Đơn hàng
          </Link>
          <Link
            href="/tai-khoan/doi-mat-khau"
            aria-current={pathname === '/tai-khoan/doi-mat-khau' ? 'page' : undefined}
          >
            Đổi mật khẩu
          </Link>
        </nav>
      </aside>
      <div className="account-content">{children}</div>
    </main>
  );
}
