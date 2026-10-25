export const ROLES = ['CUSTOMER', 'STAFF', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];
export type Permission =
  | 'PROFILE_SELF'
  | 'ADDRESS_SELF'
  | 'CART_SELF'
  | 'CHECKOUT_SELF'
  | 'ORDER_SELF'
  | 'ORDER_READ'
  | 'ORDER_MANAGE'
  | 'ADMIN_ACCESS'
  | 'PRODUCT_READ'
  | 'PRODUCT_MANAGE'
  | 'ARTICLE_MANAGE'
  | 'ARTICLE_MEDIA_UPLOAD'
  | 'FAQ_READ'
  | 'FAQ_MANAGE'
  | 'API_DIAGNOSTICS';

const registry: Record<Role, ReadonlySet<Permission>> = {
  CUSTOMER: new Set(['PROFILE_SELF', 'ADDRESS_SELF', 'CART_SELF', 'CHECKOUT_SELF', 'ORDER_SELF']),
  STAFF: new Set([
    'ADMIN_ACCESS',
    'PROFILE_SELF',
    'ORDER_READ',
    'PRODUCT_READ',
    'ARTICLE_MANAGE',
    'ARTICLE_MEDIA_UPLOAD',
    'FAQ_READ',
  ]),
  ADMIN: new Set([
    'PROFILE_SELF',
    'ADMIN_ACCESS',
    'ORDER_READ',
    'ORDER_MANAGE',
    'PRODUCT_READ',
    'PRODUCT_MANAGE',
    'ARTICLE_MANAGE',
    'ARTICLE_MEDIA_UPLOAD',
    'FAQ_READ',
    'FAQ_MANAGE',
    'API_DIAGNOSTICS',
  ]),
};

export const hasPermission = (role: Role, permission: Permission): boolean =>
  registry[role].has(permission);
export const isRole = (value: string): value is Role => ROLES.includes(value as Role);
