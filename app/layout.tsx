import './globals.css';
import type { Metadata, Viewport } from 'next';
import React from 'react';
import { Inter } from 'next/font/google';

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Code Iterator AI Tool',
  description: 'Intelligent AI-powered code modification and improvement tool',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#1E293B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
} 