import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMM — Cardano + Midnight in MetaMask',
  description:
    'Open-source MetaMask Snap bringing Cardano ADA and Midnight privacy to the 30M-user EVM wallet.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-cmm-bg text-cmm-text">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
