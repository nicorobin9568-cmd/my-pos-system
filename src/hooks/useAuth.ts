'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import type { Profile, Tenant } from '@/types';

export function useAuth() {
  const { profile, tenant, setProfile, setTenant, clear } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        clear();
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);

        if (profileData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .single();

          if (tenantData) setTenant(tenantData as Tenant);
        }
      }

      setLoading(false);
    };

    fetchUserData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clear();
      } else {
        fetchUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { profile, tenant, loading };
}
