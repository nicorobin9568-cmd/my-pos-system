'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('ထွက်ပြီးပါပြီ');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-100 p-4 rounded-full">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">အတည်ပြုချက် စောင့်ဆိုင်းနေသည်</h1>
        <p className="text-gray-600 mb-6">
          သင့် account ကို စစ်ဆေးနေဆဲဖြစ်သည်။ Admin မှ အတည်ပြုပြီးမှ ဝင်ရောက်နိုင်မည်ဖြစ်သည်။
        </p>
        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
        >
          ထွက်မည်
        </button>
      </div>
    </div>
  );
}
