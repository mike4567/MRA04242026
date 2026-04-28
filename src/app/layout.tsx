"use client";

/**
 * @file layout.tsx
 * @author NMFS West Coast Region - Marine Response Application
 * @date 2026-04-27
 * @purpose Root layout with NextAuth.js SessionProvider.
 */

import { useState, useEffect } from 'react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/Header';
import { IncidentProvider } from '@/context/IncidentContext';
import { NoticeModal } from '@/components/NoticeModal';
import { SessionProvider } from '@/components/providers/SessionProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAcknowledged = sessionStorage.getItem('noticeAcknowledged');
      if (hasAcknowledged !== 'true') {
        setIsNoticeOpen(true);
      }
    }
  }, []);

  const handleAcknowledge = () => {
    sessionStorage.setItem('noticeAcknowledged', 'true');
    setIsNoticeOpen(false);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <SessionProvider>
          <NoticeModal isOpen={isNoticeOpen} onAcknowledge={handleAcknowledge} />
          <IncidentProvider>
              <Header className="print:hidden" />
              <main className="container mx-auto px-4 py-8 print:py-0 print:px-2">
                  {children}
              </main>
              <Toaster />
          </IncidentProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
