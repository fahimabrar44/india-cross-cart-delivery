export type BrandStatus = 'active' | 'inactive' | 'suspended'
export type UserRole = 'super_admin' | 'brand_admin' | 'order_manager' | 'inventory_manager' | 'sales_agent' | 'account_manager' | 'viewer'
export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'
export type InventoryType = 'stock_in' | 'stock_out' | 'adjustment' | 'damage' | 'return' | 'transfer'
export type NotificationType = 'new_order' | 'low_stock' | 'cancelled_order' | 'return_request' | 'system_alert'

export interface Permission {
  id: string
  name: string
  slug: string
  description?: string
}

export interface IUser {
  _id: string
  name: string
  email: string
  password?: string
  role: UserRole
  avatar?: string
  phone?: string
  brandAccess: string[]
  permissions: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IBrand {
  _id: string
  name: string
  slug: string
  logo?: string
  favicon?: string
  website?: string
  email?: string
  phone?: string
  address?: string
  currency: string
  currencySymbol: string
  invoiceSettings: {
    prefix: string
    nextNumber: number
    footer?: string
    logo?: string
  }
  status: BrandStatus
  createdAt: Date
  updatedAt: Date
}

export interface ICategory {
  _id: string
  name: string
  slug: string
  brand: string
  description?: string
  parent?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IProduct {
  _id: string
  name: string
  sku: string
  barcode?: string
  brand: string
  category?: string
  description?: string
  purchasePrice: number
  sellingPrice: number
  images: string[]
  stockAlertLimit: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IWarehouse {
  _id: string
  name: string
  brand: string
  manager?: string
  phone?: string
  email?: string
  address?: string
  location?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IInventory {
  _id: string
  product: string
  warehouse: string
  brand: string
  openingStock: number
  currentStock: number
  createdAt: Date
  updatedAt: Date
}

export interface IStockTransaction {
  _id: string
  product: string
  warehouse: string
  brand: string
  type: InventoryType
  quantity: number
  previousStock: number
  newStock: number
  reference?: string
  note?: string
  performedBy: string
  createdAt: Date
}

export interface IOrder {
  _id: string
  orderNumber: string
  brand: string
  customer: string
  items: IOrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  codAmount: number
  paidAmount: number
  paymentStatus: PaymentStatus
  status: OrderStatus
  agent?: string
  courierName?: string
  trackingNumber?: string
  dispatchDate?: Date
  deliveryDate?: Date
  notes?: string
  shippingAddress: {
    name: string
    phone: string
    address: string
    district: string
    country: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface IOrderItem {
  product: string
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

export interface ICustomer {
  _id: string
  name: string
  phone: string
  whatsapp?: string
  email?: string
  address?: string
  district?: string
  country?: string
  brand: string
  totalPurchases: number
  totalOrders: number
  isBlacklisted: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ISupplier {
  _id: string
  name: string
  phone: string
  company?: string
  email?: string
  address?: string
  brand: string
  products: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IPurchase {
  _id: string
  invoiceNumber: string
  brand: string
  supplier: string
  items: IPurchaseItem[]
  subtotal: number
  discount: number
  total: number
  paymentStatus: PaymentStatus
  notes?: string
  purchaseDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface IPurchaseItem {
  product: string
  name: string
  sku: string
  quantity: number
  cost: number
  total: number
}

export interface INotification {
  _id: string
  brand: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: Date
}

export interface IAuditLog {
  _id: string
  brand?: string
  user: string
  action: string
  entity: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  createdAt: Date
}

export interface ISettings {
  _id: string
  brand: string
  key: string
  value: unknown
  createdAt: Date
  updatedAt: Date
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  brand?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DashboardStats {
  totalBrands: number
  totalOrders: number
  todayRevenue: number
  pendingOrders: number
  deliveredOrders: number
  cancelledOrders: number
  lowStockProducts: number
  topSellingProducts: { name: string; total: number }[]
  activeCustomers: number
}
