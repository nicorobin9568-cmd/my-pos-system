'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { CheckCircle, XCircle, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types';

export default function CashiersPage() {
  const { tenant } = useAuthStore();
  const [cashiers, setCashiers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');

  const fetchCashiers = async () => {
    if (!tenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('role', 'cashier')
      .eq('status', filter)
      .order('created_at', { ascending: false });

    setCashiers((data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCashiers();
  }, [tenant, filter]);

  const updateCashierStatus = async (cashierId: string, status: 'approved' | 'pending') => {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', cashierId);

    if (error) {
      toast.error('အပ်ဒိတ်မအောင်မြင်ပါ');
      return;
    }
    toast.success(status === 'approved' ? 'Cashier အတည်ပြုပြီးပါပြီ' : 'Cashier ပိတ်ဆို့ပြီးပါပြီ');
    fetchCashiers();
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">Cashiers စီမံခန့်ခွဲရန်</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {(['pending', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f === 'pending' ? 'စောင့်ဆိုင်း' : 'အတည်ပြုပြီး'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">ဖတ်နေသည်...</div>
      ) : cashiers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Cashier မရှိသေးပါ</div>
      ) : (
        <div className="space-y-3">
          {cashiers.map((cashier) => (
            <div key={cashier.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{cashier.name}</h3>
                  <p className="text-xs text-gray-400">{formatDate(cashier.created_at)}</p>
                </div>
                {cashier.status === 'pending' ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />စောင့်ဆိုင်း
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />အတည်ပြုပြီး
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {cashier.status === 'pending' && (
                  <button
                    onClick={() => updateCashierStatus(cashier.id, 'approved')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    အတည်ပြုမည်
                  </button>
                )}
                {cashier.status === 'approved' && (
                  <button
                    onClick={() => updateCashierStatus(cashier.id, 'pending')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    ပိတ်ဆို့မည်
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
