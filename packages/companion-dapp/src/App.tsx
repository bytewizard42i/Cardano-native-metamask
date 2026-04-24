import { Hero } from '@/components/hero';
import { ChainCard } from '@/components/chain-card';
import { FooterNote } from '@/components/footer-note';

export function App() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Hero />

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <ChainCard
          chain="midnight"
          title="Midnight"
          subtitle="Private by default. ZK-first. Shipping v1."
          accent="bg-cmm-midnight"
        />
        <ChainCard
          chain="cardano"
          title="Cardano"
          subtitle="ADA + native assets. Shipping v1.1."
          accent="bg-cmm-cardano"
        />
      </section>

      <FooterNote />
    </main>
  );
}
