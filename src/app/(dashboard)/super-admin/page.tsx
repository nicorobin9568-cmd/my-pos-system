'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Clock, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { BUSINESS_TYPE_LABELS, formatDate } from '@/lib/utils';
import type { Tenant } from '@/types';

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('pending');

  const fetchTenants = async () => {
    const supabase = createClient();
    let query = supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setTenants((data as Tenant[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, [filter]);

  const updateStatus = async (tenantId: string, status: 'approved' | 'suspended' | 'pending') => {
    const supabase = createClient();
    const { error } = await supabase
      .from('tenants')
      .update({ status })
      .eq('id', tenantId);

    if (error) {
      toast.error('အပ်ဒိတ်မအောင်မြင်ပါ');
      return;
    }

    // Also update shop_admin profile status
    if (status === 'approved') {
      await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('tenant_id', tenantId)
        .eq('role', 'shop_admin');
    }

    toast.success(`ဆိုင် ${status === 'approved' ? 'အတည်ပြုပြီး' : status === 'suspended' ? 'ပိတ်ဆို့ပြီး' : 'pending ပြန်ထားပြီး'}ပါပြီ`);
    fetchTenants();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />စောင့်ဆိုင်း</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />အတည်ပြုပြီး</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />ပိတ်ဆို့ထား</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Store className="w-6 h-6 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">ဆိုင်များ စီမံခန့်ခွဲရန်</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['pending', 'approved', 'suspended', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f === 'pending' ? 'စောင့်ဆိုင်း' : f === 'approved' ? 'အတည်ပြုပြီး' : f === 'suspended' ? 'ပိတ်ဆို့ထား' : 'အားလုံး'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">ဖတ်နေသည်...</div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-10 text-gray-400">ဆိုင်မရှိသေးပါ</div>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{tenant.shop_name}</h3>
                  <p className="text-sm text-gray-500">
                    {BUSINESS_TYPE_LABELS[tenant.business_type] ?? tenant.business_type}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(tenant.created_at)}</p>
                </div>
                {statusBadge(tenant.status)}
              </div>

              <p className="text-xs text-gray-400 mb-3 font-mono break-all">ID: {tenant.id}</p>

              <div className="flex gap-2">
                {tenant.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(tenant.id, 'approved')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    အတည်ပြုမည်
                  </button>
                )}
                {tenant.status === 'approved' && (
                  <button
                    onClick={() => updateStatus(tenant.id, 'suspended')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    ပိတ်ဆို့မည်
                  </button>
                )}
                {tenant.status === 'suspended' && (
                  <button
                    onClick={() => updateStatus(tenant.id, 'pending')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Pending ပြန်ထားမည်
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
