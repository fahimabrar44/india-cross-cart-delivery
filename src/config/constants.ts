export const APP_NAME = 'MB-OMS'
export const APP_DESCRIPTION = 'Multi Brand Order Management System'

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRAND_ADMIN: 'brand_admin',
  ORDER_MANAGER: 'order_manager',
  INVENTORY_MANAGER: 'inventory_manager',
  SALES_AGENT: 'sales_agent',
  ACCOUNT_MANAGER: 'account_manager',
  VIEWER: 'viewer',
} as const

export const PERMISSIONS = {
  CREATE_ORDER: 'create_order',
  EDIT_ORDER: 'edit_order',
  DELETE_ORDER: 'delete_order',
  MANAGE_STOCK: 'manage_stock',
  MANAGE_PRODUCTS: 'manage_products',
  VIEW_REPORTS: 'view_reports',
  MANAGE_USERS: 'manage_users',
} as const

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.BRAND_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ORDER_MANAGER]: [PERMISSIONS.CREATE_ORDER, PERMISSIONS.EDIT_ORDER, PERMISSIONS.VIEW_REPORTS],
  [ROLES.INVENTORY_MANAGER]: [PERMISSIONS.MANAGE_STOCK, PERMISSIONS.VIEW_REPORTS],
  [ROLES.SALES_AGENT]: [PERMISSIONS.CREATE_ORDER, PERMISSIONS.EDIT_ORDER],
  [ROLES.ACCOUNT_MANAGER]: [PERMISSIONS.VIEW_REPORTS],
  [ROLES.VIEWER]: [PERMISSIONS.VIEW_REPORTS],
}

export const ORDER_STATUS = {
  NEW: 'new',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  [ORDER_STATUS.NEW]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.RETURNED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.RETURNED]: [],
}

export const CURRENCIES = {
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
}

export const CLOUDINARY_FOLDERS = {
  BRANDS: 'mb-oms/brands',
  PRODUCTS: 'mb-oms/products',
  USERS: 'mb-oms/users',
  INVOICES: 'mb-oms/invoices',
}
