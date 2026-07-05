export type BusinessType =
  | 'pharmacy'
  | 'bakery'
  | 'grocery'
  | 'restaurant'
  | 'clothing'
  | 'general';

export type TenantStatus = 'pending' | 'approved' | 'suspended';
export type UserRole = 'super_admin' | 'shop_admin' | 'cashier';
export type UserStatus = 'pending' | 'approved';
export type SyncStatus = 'pending' | 'synced';
export type PaymentMethod = 'cash' | 'card' | 'other';

export interface Tenant {
  id: string;
  shop_name: string;
  business_type: BusinessType;
  status: TenantStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  role: UserRole;
  status: UserStatus;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  barcode?: string | null;
  price: number;
  cost?: number | null;
  stock_qty: number;
  category?: string | null;
  expiry_date?: string | null;
  image_url?: string | null;
  updated_at: string;
}

export interface Sale {
  id: string;
  tenant_id: string;
  cashier_id: string;
  total: number;
  payment_method?: PaymentMethod | null;
  sync_status: SyncStatus;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface SaleWithItems extends Sale {
  sale_items: (SaleItem & { product?: Product })[];
}
