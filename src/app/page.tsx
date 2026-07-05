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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // If auth user exists but profile doesn't, something is wrong, back to login
    return redirect('/login');
  }

  if (profile.status === 'pending') {
    return redirect('/pending-approval');
  }

  // Use absolute paths for redirects to be safe
  if (profile.role === 'super_admin') {
    return redirect('/super-admin');
  } else if (profile.role === 'shop_admin') {
    return redirect('/shop-admin');
  } else if (profile.role === 'cashier') {
    return redirect('/cashier/pos');
  }

  return redirect('/login');
}
