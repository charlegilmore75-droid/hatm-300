import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider, LangProvider } from '@/lib/context';

export const metadata: Metadata = {
  title: 'HATM - منصة الخدمات الرقمية',
  description: 'منصة HATM للخدمات الرقمية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <LangProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
