'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Package, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalProducts: number;
  pendingCashiers: number;
  todayRevenue: number;
  lowStockCount: number;
}

export default function ShopAdminDashboard() {
  const { tenant } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    pendingCashiers: 0,
    todayRevenue: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    const fetchStats = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const [products, cashiers, sales, lowStock] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('tenant_id', tenant.id),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('tenant_id', tenant.id).eq('role', 'cashier').eq('status', 'pending'),
        supabase.from('sales').select('total').eq('tenant_id', tenant.id).gte('created_at', today),
        supabase.from('products').select('id', { count: 'exact' }).eq('tenant_id', tenant.id).lte('stock_qty', 5),
      ]);

      const todayRevenue = (sales.data ?? []).reduce((sum, s) => sum + (s.total ?? 0), 0);

      setStats({
        totalProducts: products.count ?? 0,
        pendingCashiers: cashiers.count ?? 0,
        todayRevenue,
        lowStockCount: lowStock.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, [tenant]);

  const cards = [
    {
      label: 'ကုန်ပစ္စည်းစုစုပေါင်း',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Cashier (စောင့်ဆိုင်း)',
      value: stats.pendingCashiers.toString(),
      icon: Users,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'ယနေ့ ဝင်ငွေ',
      value: formatCurrency(stats.todayRevenue),
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Stock နည်းသောပစ္စည်း',
      value: stats.lowStockCount.toString(),
      icon: AlertCircle,
      color: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard</h2>

      {loading ? (
        <div className="text-center py-10 text-gray-500">ဖတ်နေသည်...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
