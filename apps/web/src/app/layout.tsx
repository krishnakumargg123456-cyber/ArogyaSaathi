import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ArogyaSaathi — Healthcare Coordination & Appointment Platform',
  description: 'Har Gaon, Har Ghar, Swasth Bharat. Android Mobile Application for Rural Healthcare Workers, Web Admin Console, and Patient Portal.',
};

export const viewport: Viewport = {
  themeColor: '#064E3B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
