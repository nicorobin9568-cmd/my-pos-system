import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Fetch profile with absolute priority
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Profile fetch error:', error);
    return redirect('/login');
  }

  // Super Admin check first
  if (profile.role === 'super_admin') {
    return redirect('/super-admin');
  }

  if (profile.status === 'pending') {
    return redirect('/pending-approval');
  }

  if (profile.role === 'shop_admin') {
    return redirect('/shop-admin');
  } else if (profile.role === 'cashier') {
    return redirect('/cashier/pos');
  }

  return redirect('/login');
}
