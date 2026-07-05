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

  // HARDCODE BYPASS: If it's the owner's email, go straight to super-admin
  // This bypasses any potential profiles table or RLS issues
  if (user.email === 'nicorobin9568@gmail.com') {
    return redirect('/super-admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return redirect('/login');
  }

  if (profile.status === 'pending') {
    return redirect('/pending-approval');
  }

  if (profile.role === 'super_admin') {
    return redirect('/super-admin');
  } else if (profile.role === 'shop_admin') {
    return redirect('/shop-admin');
  } else if (profile.role === 'cashier') {
    return redirect('/cashier/pos');
  }

  return redirect('/login');
}
