import { describe, expect, it } from 'vitest';
import { addCartItemSchema, updateCartItemSchema } from '../src/modules/cart/cart.schema.js';
import { hasPermission } from '../src/modules/rbac/permissions.js';

describe('M5C cart validation and RBAC', () => {
  it('accepts only positive integer quantities and string BIGINT IDs', () => {
    expect(addCartItemSchema.parse({ variantId: '1', quantity: 2 })).toEqual({
      variantId: '1',
      quantity: 2,
    });
    expect(updateCartItemSchema.parse({ quantity: 1 })).toEqual({ quantity: 1 });
    expect(() => addCartItemSchema.parse({ variantId: '0', quantity: 1 })).toThrow();
    expect(() => addCartItemSchema.parse({ variantId: '1', quantity: 0 })).toThrow();
    expect(() => updateCartItemSchema.parse({ quantity: 1.5 })).toThrow();
    expect(() =>
      addCartItemSchema.parse({ variantId: '1', quantity: 1, customerId: '2' }),
    ).toThrow();
  });

  it('limits cart access to customers', () => {
    expect(hasPermission('CUSTOMER', 'CART_SELF')).toBe(true);
    expect(hasPermission('STAFF', 'CART_SELF')).toBe(false);
    expect(hasPermission('ADMIN', 'CART_SELF')).toBe(false);
  });
});
