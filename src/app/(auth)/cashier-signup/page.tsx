'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import type { Tenant } from '@/types';

export default function CashierSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [shopCode, setShopCode] = useState('');
  const [foundShop, setFoundShop] = useState<Tenant | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const searchShop = async () => {
    if (!shopCode.trim()) return;
    setSearchLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', shopCode.trim())
      .eq('status', 'approved')
      .single();

    if (error || !data) {
      toast.error('ဆိုင် ID မတွေ့ပါ သို့မဟုတ် ဆိုင်မှတ်ပုံမတင်ရသေးပါ');
      setFoundShop(null);
    } else {
      setFoundShop(data as Tenant);
    }
    setSearchLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundShop) {
      toast.error('ဆိုင်ကို အရင်ရှာပါ');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Password မတူညီပါ');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user!.id,
        tenant_id: foundShop.id,
        role: 'cashier',
        status: 'pending',
        name: form.name,
      });

      if (profileError) throw profileError;

      await supabase.auth.signOut();
      toast.success('မှတ်ပုံတင်မှု အောင်မြင်သည်။ Shop Admin ၏ အတည်ပြုချက် စောင့်ပါ။');
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
        <div className="bg-blue-500 p-3 rounded-2xl mb-3">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cashier Account ဖွင့်ရန်</h1>
        <p className="text-gray-500 text-sm mt-1">Shop Admin ၏ အတည်ပြုချက် လိုအပ်သည်</p>
      </div>

      {/* Shop Search */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <label className="block text-sm font-medium text-gray-700 mb-2">ဆိုင် ID ဖြင့် ရှာဖွေပါ</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shopCode}
            onChange={(e) => setShopCode(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="ဆိုင် ID ထည့်ပါ"
          />
          <button
            type="button"
            onClick={searchShop}
            disabled={searchLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:bg-blue-300"
          >
            {searchLoading ? '...' : 'ရှာ'}
          </button>
        </div>
        {foundShop && (
          <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-700 font-medium">✓ {foundShop.shop_name}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">အမည်</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            placeholder="Password ထပ်ရိုက်ပါ"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !foundShop}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {loading ? 'မှတ်ပုံတင်နေသည်...' : 'မှတ်ပုံတင်မည်'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Account ရှိပြီးသားဆိုလျှင်{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          ဝင်ရောက်ပါ
        </Link>
      </p>
    </div>
  );
}
