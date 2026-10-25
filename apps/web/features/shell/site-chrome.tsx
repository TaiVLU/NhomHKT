'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartProvider } from '../cart/cart-provider';
import { TypebotWidget } from '../chatbot/typebot-widget';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return children;
  return (
    <CartProvider>
      <SiteHeader />
      <div className="site-content">{children}</div>
      <SiteFooter />
      <TypebotWidget />
    </CartProvider>
  );
}
