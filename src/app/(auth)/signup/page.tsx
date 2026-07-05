'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';
import { BUSINESS_TYPE_LABELS } from '@/lib/utils';
import type { BusinessType } from '@/types';

export default function ShopSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    businessType: 'general' as BusinessType,
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Password မတူညီပါ');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password အနည်းဆုံး ၆ လုံး ရှိရမည်');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Create tenant (pending)
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          shop_name: form.shopName,
          business_type: form.businessType,
          status: 'pending',
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { name: form.ownerName },
        },
      });

      if (authError) throw authError;

      // 3. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user!.id,
        tenant_id: tenant.id,
        role: 'shop_admin',
        status: 'pending',
        name: form.ownerName,
      });

      if (profileError) throw profileError;

      await supabase.auth.signOut();
      toast.success('မှတ်ပုံတင်မှု အောင်မြင်သည်။ Super Admin ၏ အတည်ပြုချက် စောင့်ပါ။');
      router.push('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'မှတ်ပုံတင်မှု မအောင်မြင်ပါ';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex flex-col items-center mb-6">
        <div className="bg-emerald-500 p-3 rounded-2xl mb-3">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ဆိုင်အသစ် မှတ်ပုံတင်ရန်</h1>
        <p className="text-gray-500 text-sm mt-1">Super Admin ၏ အတည်ပြုချက် လိုအပ်သည်</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ဆိုင်အမည်</label>
          <input
            type="text"
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            placeholder="ဆိုင်အမည်"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ဆိုင်အမျိုးအစား</label>
          <select
            value={form.businessType}
            onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
          >
            {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ပိုင်ရှင်အမည်</label>
          <input
            type="text"
            value={form.ownerName}
            onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            placeholder="သင့်အမည်"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            placeholder="အနည်းဆုံး ၆ လုံး"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password အတည်ပြုရန်</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            placeholder="Password ထပ်ရိုက်ပါ"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {loading ? 'မှတ်ပုံတင်နေသည်...' : 'မှတ်ပုံတင်မည်'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Account ရှိပြီးသားဆိုလျှင်{' '}
        <Link href="/login" className="text-emerald-600 font-medium hover:underline">
          ဝင်ရောက်ပါ
        </Link>
      </p>
    </div>
  );
}
