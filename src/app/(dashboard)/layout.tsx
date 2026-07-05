import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // If it's the super admin email, we can skip the strict profile/tenant check to ensure access
  if (user.email === 'nicorobin9568@gmail.com') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    return (
      <DashboardShell 
        profile={profile || { id: user.id, name: 'Super Admin', role: 'super_admin', status: 'approved' } as any} 
        tenant={null}
      >
        {children}
      </DashboardShell>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single();

  if (!profile) return redirect('/login');
  if (profile.status === 'pending') return redirect('/pending-approval');

  return (
    <DashboardShell profile={profile} tenant={profile.tenants || null}>
      {children}
    </DashboardShell>
  );
}
