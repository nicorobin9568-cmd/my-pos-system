'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Package,
  BarChart2,
  Settings,
  Users,
  Store,
  LogOut,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { useSync } from '@/hooks/useSync';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Profile, Tenant } from '@/types';

interface Props {
  profile: Profile;
  tenant: Tenant | null;
  children: React.ReactNode;
}

const CASHIER_NAV = [
  { href: '/cashier/pos', icon: ShoppingCart, label: 'ရောင်းရန်' },
  { href: '/cashier/history', icon: BarChart2, label: 'မှတ်တမ်း' },
];

const SHOP_ADMIN_NAV = [
  { href: '/shop-admin', icon: BarChart2, label: 'Dashboard' },
  { href: '/shop-admin/products', icon: Package, label: 'ကုန်ပစ္စည်း' },
  { href: '/shop-admin/cashiers', icon: Users, label: 'Cashiers' },
  { href: '/shop-admin/reports', icon: BarChart2, label: 'Report' },
];

const SUPER_ADMIN_NAV = [
  { href: '/super-admin', icon: Store, label: 'ဆိုင်များ' },
];

export default function DashboardShell({ profile, tenant, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { setProfile, setTenant } = useAuthStore();
  const { pendingCount, isOnline } = useSync(tenant?.id ?? null);

  useEffect(() => {
    setProfile(profile);
    if (tenant) setTenant(tenant);
  }, [profile, tenant]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('ထွက်ပြီးပါပြီ');
    router.push('/login');
  };

  const navItems =
    profile.role === 'cashier'
      ? CASHIER_NAV
      : profile.role === 'shop_admin'
      ? SHOP_ADMIN_NAV
      : SUPER_ADMIN_NAV;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-gray-900 text-sm">
            {tenant?.shop_name ?? 'POS System'}
          </h1>
          <p className="text-xs text-gray-500">{profile.name}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                {pendingCount}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="ထွက်မည်"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
                  active
                    ? 'text-emerald-600'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
