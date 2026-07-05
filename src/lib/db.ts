import Dexie, { type EntityTable } from 'dexie';
import type { Product, Sale, SaleItem } from '@/types';

export interface LocalSale extends Sale {
  sync_status: 'pending' | 'synced';
}

export interface LocalSaleItem extends SaleItem {
  synced?: boolean;
}

class POSDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>;
  sales!: EntityTable<LocalSale, 'id'>;
  sale_items!: EntityTable<LocalSaleItem, 'id'>;

  constructor() {
    super('pos_db');
    this.version(1).stores({
      products: 'id, tenant_id, barcode, name, category, updated_at',
      sales: 'id, tenant_id, cashier_id, sync_status, created_at',
      sale_items: 'id, sale_id, product_id',
    });
  }
}

export const db = new POSDatabase();
