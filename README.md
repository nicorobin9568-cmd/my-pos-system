# Multi-Tenant POS System

မြန်မာနိုင်ငံ ဆိုင်အမျိုးမျိုးအတွက် Mobile-First Point of Sale System

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Offline Storage**: Dexie.js (IndexedDB)
- **Barcode Scan**: html5-qrcode (Camera-based)
- **PWA**: Service Worker + Web App Manifest

---

## Setup လုပ်နည်း

### 1. Supabase Database Setup

Supabase Dashboard → SQL Editor မှာ `supabase/migrations/001_initial_schema.sql` ဖိုင်ထဲက SQL ကို copy ပြီး run ပါ။

### 2. Super Admin Account ဖွင့်ရန်

1. Supabase Dashboard → Authentication → Users → "Invite user" နဲ့ super admin email ထည့်ပါ
2. SQL Editor မှာ ဒီ query run ပါ (UUID ကို ပြောင်းပါ):

```sql
insert into profiles (id, tenant_id, role, status, name)
values ('YOUR_USER_UUID_HERE', null, 'super_admin', 'approved', 'Super Admin');
```

### 3. Environment Variables

`.env.local` ဖိုင်ထဲမှာ Supabase credentials ထည့်ပါ:

```
NEXT_PUBLIC_SUPABASE_URL=https://tepakpewlhcugvdexkaj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Supabase Dashboard → Settings → API မှာ keys ရနိုင်သည်။

### 4. Install & Run

```bash
pnpm install --ignore-scripts
pnpm dev
```

---

## User Roles

| Role | ဘာလုပ်နိုင်သည် |
|------|--------------|
| **Super Admin** | ဆိုင်အသစ် approve/reject လုပ်ရန် |
| **Shop Admin** | ကုန်ပစ္စည်း CRUD, Cashier approve, Reports |
| **Cashier** | POS ရောင်းချမှု, မှတ်တမ်းကြည့်ရန် |

## Signup Flow

1. **ဆိုင်ပိုင်ရှင်**: /signup → Super Admin approve → login ဝင်နိုင်
2. **Cashier**: /cashier-signup → ဆိုင် ID ထည့် → Shop Admin approve → login ဝင်နိုင်

## Business Types

| Type | မြန်မာ | Expiry Date | Image |
|------|--------|-------------|-------|
| pharmacy | ဆေးဆိုင် | Yes | No |
| bakery | မုန့်ဆိုင် | Yes | Yes |
| grocery | မိုးကုတ်ဆိုင် | Yes | No |
| restaurant | စားသောက်ဆိုင် | Yes | Yes |
| clothing | အဝတ်အထည်ဆိုင် | No | Yes |
| general | အထွေထွေကုန်ဆိုင် | No | No |

## Offline Mode

- Cashier ရောင်းချမှုများကို IndexedDB မှာ သိမ်းသည်
- Internet ပြန်ရလျှင် Supabase ကို auto-sync လုပ်သည်
- Header မှာ sync status badge ပြသည်

## PWA Installation

Mobile browser မှာ "Add to Home Screen" နှိပ်ပြီး install လုပ်နိုင်သည်။
