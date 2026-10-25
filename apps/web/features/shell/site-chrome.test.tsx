import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteChrome } from './site-chrome';

const mocks = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }));
vi.mock('../cart/cart-provider', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="cart-provider">{children}</div>
  ),
}));
vi.mock('./site-header', () => ({ SiteHeader: () => <header>Header</header> }));
vi.mock('./site-footer', () => ({ SiteFooter: () => <footer>Footer</footer> }));
vi.mock('../chatbot/typebot-widget', () => ({
  TypebotWidget: () => <button aria-label="Mở Trợ lý HKT Store" />,
}));

describe('SiteChrome chatbot mount', () => {
  afterEach(cleanup);
  beforeEach(() => {
    mocks.pathname = '/';
  });

  it('preserves the public shell and CartProvider while mounting one widget', () => {
    render(
      <SiteChrome>
        <main>Content</main>
      </SiteChrome>,
    );
    expect(screen.getByTestId('cart-provider')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Mở Trợ lý HKT Store' })).toHaveLength(1);
  });

  it.each(['/thanh-toan', '/gio-hang'])('keeps the widget mounted once on %s', (pathname) => {
    mocks.pathname = pathname;
    render(<SiteChrome>Commerce page</SiteChrome>);
    expect(screen.getAllByRole('button', { name: 'Mở Trợ lý HKT Store' })).toHaveLength(1);
    expect(screen.getByTestId('cart-provider')).toBeInTheDocument();
  });

  it('does not mount the public shell or widget on Admin routes', () => {
    mocks.pathname = '/admin/catalog';
    render(<SiteChrome>Admin page</SiteChrome>);
    expect(screen.getByText('Admin page')).toBeInTheDocument();
    expect(screen.queryByTestId('cart-provider')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mở Trợ lý HKT Store' })).not.toBeInTheDocument();
  });
});