import { useState } from 'react';
import { Hero } from '@/components/hero';
import { ChainCard } from '@/components/chain-card';
import { ModeSwitcher } from '@/components/mode-switcher';
import { FooterNote } from '@/components/footer-note';
import { hasLiveCardanoConfig } from '@/lib/adapter';
import type { AdapterMode } from '@cmm/dapp-sdk';

export function App() {
  const liveAvailable = hasLiveCardanoConfig();
  const [mode, setMode] = useState<AdapterMode>(liveAvailable ? 'live-readonly' : 'mock');

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Hero />

      <ModeSwitcher mode={mode} onChange={setMode} liveAvailable={liveAvailable} />

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <ChainCard
          chain="midnight"
          title="Midnight"
          subtitle="Private by default. ZK-first. Shipping v1."
          accent="bg-cmm-midnight"
          mode={mode}
        />
        <ChainCard
          chain="cardano"
          title="Cardano"
          subtitle="ADA + native assets. Shipping v1.1."
          accent="bg-cmm-cardano"
          mode={mode}
        />
      </section>

      <FooterNote />
    </main>
  );
}
