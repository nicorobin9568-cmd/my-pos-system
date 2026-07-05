import { db } from './db';
import { createClient } from './supabase/client';

let syncInterval: ReturnType<typeof setInterval> | null = null;

export async function syncToSupabase(): Promise<{ synced: number; errors: number }> {
  const supabase = createClient();
  let synced = 0;
  let errors = 0;

  try {
    // Get all pending sales
    const pendingSales = await db.sales
      .where('sync_status')
      .equals('pending')
      .toArray();

    for (const sale of pendingSales) {
      try {
        // Insert sale
        const { error: saleError } = await supabase.from('sales').upsert({
          id: sale.id,
          tenant_id: sale.tenant_id,
          cashier_id: sale.cashier_id,
          total: sale.total,
          payment_method: sale.payment_method,
          created_at: sale.created_at,
        });

        if (saleError) throw saleError;

        // Insert sale items
        const items = await db.sale_items
          .where('sale_id')
          .equals(sale.id)
          .toArray();

        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('sale_items')
            .upsert(
              items.map((item) => ({
                id: item.id,
                sale_id: item.sale_id,
                product_id: item.product_id,
                qty: item.qty,
                unit_price: item.unit_price,
              }))
            );

          if (itemsError) throw itemsError;

          // Decrement stock for each item via RPC
          for (const item of items) {
            await supabase.rpc('decrement_stock', {
              p_product_id: item.product_id,
              p_qty: item.qty,
            });
          }
        }

        // Mark as synced
        await db.sales.update(sale.id, { sync_status: 'synced' });
        synced++;
      } catch (err) {
        console.error('Failed to sync sale:', sale.id, err);
        errors++;
      }
    }
  } catch (err) {
    console.error('Sync error:', err);
  }

  return { synced, errors };
}

export async function pullProductsFromSupabase(tenantId: string): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to pull products:', error);
    return;
  }

  if (data && data.length > 0) {
    await db.products.bulkPut(data);
  }
}

export function startSyncEngine(tenantId: string) {
  // Initial sync on start
  syncToSupabase();
  pullProductsFromSupabase(tenantId);

  // Listen for online event
  window.addEventListener('online', () => {
    syncToSupabase();
    pullProductsFromSupabase(tenantId);
  });

  // Periodic retry every 30s if pending items exist
  syncInterval = setInterval(async () => {
    const pendingCount = await db.sales
      .where('sync_status')
      .equals('pending')
      .count();
    if (pendingCount > 0) {
      syncToSupabase();
    }
  }, 30000);
}

export function stopSyncEngine() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function getPendingCount(): Promise<number> {
  return db.sales.where('sync_status').equals('pending').count();
}
