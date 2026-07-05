import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import PWARegister from '@/components/ui/PWARegister';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'POS System',
  description: 'Multi-tenant Point of Sale System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'POS System',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="my" className={geist.className}>
      <body className="min-h-full antialiased">
        <PWARegister />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px' },
          }}
        />
      </body>
    </html>
  );
}
