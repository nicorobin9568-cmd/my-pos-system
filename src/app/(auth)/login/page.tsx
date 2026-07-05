'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { ShoppingCart, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('Email သို့မဟုတ် Password မှားနေသည်');
      setLoading(false);
      return;
    }

    // Check profile status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (profile?.status === 'pending') {
        toast.error('သင့် account ကို အတည်ပြုဆဲဖြစ်သည်');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success('ဝင်ရောက်မှု အောင်မြင်သည်');
      router.push('/');
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-emerald-500 p-3 rounded-2xl mb-3">
          <ShoppingCart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
        <p className="text-gray-500 text-sm mt-1">သင့် account ထဲ ဝင်ရောက်ပါ</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl transition-colors text-base"
        >
          {loading ? 'ဝင်နေသည်...' : 'ဝင်ရောက်မည်'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          ဆိုင်အသစ် မှတ်ပုံတင်ရန်{' '}
          <Link href="/signup" className="text-emerald-600 font-medium hover:underline">
            ဤနေရာကို နှိပ်ပါ
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          Cashier account ဖွင့်ရန်{' '}
          <Link href="/cashier-signup" className="text-emerald-600 font-medium hover:underline">
            ဤနေရာကို နှိပ်ပါ
          </Link>
        </p>
      </div>
    </div>
  );
}
