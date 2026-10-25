'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  bootstrapSession,
  getAccessToken,
  getCurrentRole,
  subscribeAuth,
} from '../../services/auth-client';
import {
  cartApi,
  getCartProductMetadata,
  type CartDto,
  type CartItemDto,
  type CartProductMetadata,
} from '../../services/cart-client';

type CartStatus = 'loading' | 'ready' | 'guest' | 'error';
type Toast = { id: number; message: string; tone: 'success' | 'error' };
export type EnrichedCartItem = CartItemDto & {
  metadata?: CartProductMetadata | undefined;
};
export type EnrichedCart = Omit<CartDto, 'items'> & { items: EnrichedCartItem[] };

interface CartContextValue {
  cart: EnrichedCart | null;
  status: CartStatus;
  pendingItemIds: ReadonlySet<string>;
  addItem: (variantId: string, productName: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  notify: (message: string, tone?: Toast['tone']) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const recalculate = (cart: EnrichedCart, items: EnrichedCartItem[]): EnrichedCart => ({
  ...cart,
  items,
  totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
  subtotal: items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
});

const mergeMetadata = (next: CartDto, current: EnrichedCart | null): EnrichedCart => {
  const metadataBySlug = new Map(
    current?.items.flatMap((item) =>
      item.metadata ? ([[item.productSlug, item.metadata]] as const) : [],
    ),
  );
  return {
    ...next,
    items: next.items.map((item) => ({ ...item, metadata: metadataBySlug.get(item.productSlug) })),
  };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<EnrichedCart | null>(null);
  const [status, setStatus] = useState<CartStatus>('loading');
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const cartRef = useRef(cart);
  const requestVersion = useRef(0);
  cartRef.current = cart;

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const enrich = useCallback(async (baseCart: EnrichedCart, version: number) => {
    const slugs = [
      ...new Set(baseCart.items.filter((item) => !item.metadata).map((item) => item.productSlug)),
    ];
    if (!slugs.length) return;
    const entries = await Promise.all(
      slugs.map(async (slug) => [slug, await getCartProductMetadata(slug)] as const),
    );
    if (version !== requestVersion.current) return;
    const metadata = new Map(
      entries.filter((entry): entry is [string, CartProductMetadata] => Boolean(entry[1])),
    );
    setCart((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => ({
              ...item,
              metadata: item.metadata ?? metadata.get(item.productSlug),
            })),
          }
        : current,
    );
  }, []);

  const commit = useCallback(
    (next: CartDto) => {
      const version = ++requestVersion.current;
      const merged = mergeMetadata(next, cartRef.current);
      setCart(merged);
      setStatus('ready');
      void enrich(merged, version);
    },
    [enrich],
  );

  const refreshCart = useCallback(async () => {
    if (!getAccessToken() || getCurrentRole() !== 'CUSTOMER') {
      ++requestVersion.current;
      setCart(null);
      setStatus('guest');
      return;
    }
    const version = ++requestVersion.current;
    setStatus('loading');
    try {
      const next = await cartApi.get();
      if (version !== requestVersion.current) return;
      const merged = mergeMetadata(next, cartRef.current);
      setCart(merged);
      setStatus('ready');
      void enrich(merged, version);
    } catch {
      if (version === requestVersion.current) setStatus('error');
    }
  }, [enrich]);

  useEffect(() => {
    const sync = () => void refreshCart();
    const unsubscribe = subscribeAuth(sync);
    if (getAccessToken()) sync();
    else void bootstrapSession().then((authenticated) => !authenticated && setStatus('guest'));
    return unsubscribe;
  }, [refreshCart]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const withPending = useCallback(async (itemId: string, operation: () => Promise<void>) => {
    setPendingItemIds((current) => new Set(current).add(itemId));
    try {
      await operation();
    } finally {
      setPendingItemIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
    }
  }, []);

  const addItem = useCallback(
    async (variantId: string, productName: string, quantity = 1) => {
      try {
        commit(await cartApi.addItem(variantId, quantity));
        notify(`“${productName}” đã được thêm vào giỏ hàng.`);
      } catch (error) {
        notify(
          error instanceof Error ? error.message : 'Không thể thêm sách vào giỏ hàng.',
          'error',
        );
        throw error;
      }
    },
    [commit, notify],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const previous = cartRef.current;
      if (!previous) return;
      setCart(
        recalculate(
          previous,
          previous.items.map((item) =>
            item.id === itemId ? { ...item, quantity, subtotal: quantity * item.unitPrice } : item,
          ),
        ),
      );
      await withPending(itemId, async () => {
        try {
          commit(await cartApi.updateItem(itemId, quantity));
        } catch (error) {
          setCart(previous);
          notify(error instanceof Error ? error.message : 'Không thể đổi số lượng.', 'error');
        }
      });
    },
    [commit, notify, withPending],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const previous = cartRef.current;
      if (!previous) return;
      setCart(
        recalculate(
          previous,
          previous.items.filter((item) => item.id !== itemId),
        ),
      );
      await withPending(itemId, async () => {
        try {
          commit(await cartApi.removeItem(itemId));
          notify('Đã xóa sách khỏi giỏ hàng.');
        } catch (error) {
          setCart(previous);
          notify(error instanceof Error ? error.message : 'Không thể xóa sách.', 'error');
        }
      });
    },
    [commit, notify, withPending],
  );

  const clearCart = useCallback(async () => {
    const previous = cartRef.current;
    if (!previous) return;
    setCart(recalculate(previous, []));
    try {
      commit(await cartApi.clear());
      notify('Giỏ hàng đã được làm trống.');
    } catch (error) {
      setCart(previous);
      notify(error instanceof Error ? error.message : 'Không thể xóa giỏ hàng.', 'error');
    }
  }, [commit, notify]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      status,
      pendingItemIds,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
      notify,
    }),
    [
      addItem,
      cart,
      clearCart,
      notify,
      pendingItemIds,
      refreshCart,
      removeItem,
      status,
      updateQuantity,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className={`toast ${toast.tone}`} key={toast.id} role="status">
            <span aria-hidden="true">{toast.tone === 'success' ? '✓' : '!'}</span>
            {toast.message}
            <button type="button" onClick={() => setToast(null)} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
};
