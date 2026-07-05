import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  if (profile.status === 'pending') {
    redirect('/pending-approval');
  }

  switch (profile.role) {
    case 'super_admin':
      redirect('/super-admin');
    case 'shop_admin':
      redirect('/shop-admin');
    case 'cashier':
      redirect('/cashier/pos');
    default:
      redirect('/login');
  }
}
