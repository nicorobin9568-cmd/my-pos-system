'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SaleSummary {
  date: string;
  total: number;
  count: number;
}

interface TopProduct {
  product_id: string;
  name: string;
  total_qty: number;
  total_revenue: number;
}

export default function ReportsPage() {
  const { tenant } = useAuthStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [summaries, setSummaries] = useState<SaleSummary[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    fetchReports();
  }, [tenant, period]);

  const fetchReports = async () => {
    if (!tenant) return;
    setLoading(true);
    const supabase = createClient();

    const now = new Date();
    let startDate: string;

    if (period === 'today') {
      startDate = now.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = weekAgo.toISOString().split('T')[0];
    } else {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      startDate = monthAgo.toISOString().split('T')[0];
    }

    const { data: sales } = await supabase
      .from('sales')
      .select('id, total, created_at')
      .eq('tenant_id', tenant.id)
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (sales) {
      const total = sales.reduce((sum, s) => sum + s.total, 0);
      setTotalRevenue(total);

      // Group by date
      const byDate: Record<string, SaleSummary> = {};
      sales.forEach((s) => {
        const date = s.created_at.split('T')[0];
        if (!byDate[date]) byDate[date] = { date, total: 0, count: 0 };
        byDate[date].total += s.total;
        byDate[date].count += 1;
      });
      setSummaries(Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)));
    }

    // Top products
    const { data: items } = await supabase
      .from('sale_items')
      .select('product_id, qty, unit_price, products(name)')
      .in(
        'sale_id',
        (sales ?? []).map((s) => s.id)
      );

    if (items) {
      const byProduct: Record<string, TopProduct> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items.forEach((item: any) => {
        if (!byProduct[item.product_id]) {
          byProduct[item.product_id] = {
            product_id: item.product_id,
            name: item.products?.name ?? 'Unknown',
            total_qty: 0,
            total_revenue: 0,
          };
        }
        byProduct[item.product_id].total_qty += item.qty;
        byProduct[item.product_id].total_revenue += item.qty * item.unit_price;
      });
      setTopProducts(
        Object.values(byProduct)
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 10)
      );
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">ရောင်းချမှတ်တမ်း</h2>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-4">
        {(['today', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === p ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {p === 'today' ? 'ယနေ့' : p === 'week' ? '၇ ရက်' : '၁ လ'}
          </button>
        ))}
      </div>

      {/* Total Revenue */}
      <div className="bg-emerald-500 rounded-2xl p-5 text-white mb-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 opacity-80" />
          <span className="text-sm opacity-80">စုစုပေါင်းဝင်ငွေ</span>
        </div>
        <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
        <p className="text-sm opacity-70 mt-1">
          {summaries.reduce((sum, s) => sum + s.count, 0)} ကြိမ် ရောင်းချ
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">ဖတ်နေသည်...</div>
      ) : (
        <>
          {/* Daily Breakdown */}
          {summaries.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                နေ့စဉ်မှတ်တမ်း
              </h3>
              <div className="space-y-2">
                {summaries.map((s) => (
                  <div key={s.date} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{formatDate(s.date)}</p>
                      <p className="text-xs text-gray-500">{s.count} ကြိမ်</p>
                    </div>
                    <p className="font-bold text-emerald-600">{formatCurrency(s.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">အရောင်းရဆုံးပစ္စည်းများ</h3>
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={p.product_id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.total_qty} ခု ရောင်းချ</p>
                    </div>
                    <p className="font-bold text-emerald-600 text-sm">{formatCurrency(p.total_revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summaries.length === 0 && (
            <div className="text-center py-10 text-gray-400">ရောင်းချမှတ်တမ်းမရှိသေးပါ</div>
          )}
        </>
      )}
    </div>
  );
}
