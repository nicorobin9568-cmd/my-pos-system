'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { db } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart2, Clock, CheckCircle } from 'lucide-react';
import type { SaleWithItems } from '@/types';

export default function HistoryPage() {
  const { profile } = useAuthStore();
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchHistory();
  }, [profile]);

  const fetchHistory = async () => {
    if (!profile) return;

    // Load from local DB first
    const localSales = await db.sales
      .where('cashier_id')
      .equals(profile.id)
      .reverse()
      .limit(50)
      .toArray();

    const localWithItems: SaleWithItems[] = await Promise.all(
      localSales.map(async (sale) => {
        const items = await db.sale_items.where('sale_id').equals(sale.id).toArray();
        return { ...sale, sale_items: items };
      })
    );
    setSales(localWithItems);
    setLoading(false);

    // Also fetch from Supabase if online
    if (navigator.onLine) {
      const supabase = createClient();
      const { data } = await supabase
        .from('sales')
        .select('*, sale_items(*, products(name))')
        .eq('cashier_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setSales(data as SaleWithItems[]);
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">ရောင်းချမှတ်တမ်း</h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">ဖတ်နေသည်...</div>
      ) : sales.length === 0 ? (
        <div className="text-center py-10 text-gray-400">ရောင်းချမှတ်တမ်းမရှိသေးပါ</div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {sale.sync_status === 'pending' ? (
                    <Clock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(sale.created_at).toLocaleTimeString('my-MM', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(sale.created_at)}</span>
                </div>
                <span className="font-bold text-emerald-600">{formatCurrency(sale.total)}</span>
              </div>

              <div className="space-y-1">
                {sale.sale_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-600">
                    <span>
                      {(item as { product?: { name: string } }).product?.name ?? item.product_id} × {item.qty}
                    </span>
                    <span>{formatCurrency(item.unit_price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {sale.payment_method && (
                <p className="text-xs text-gray-400 mt-2">
                  ငွေပေးချေမှု: {sale.payment_method === 'cash' ? 'ငွေသား' : sale.payment_method === 'card' ? 'ကတ်' : 'အခြား'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
