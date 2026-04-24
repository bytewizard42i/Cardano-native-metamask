import { Shield, Coins } from 'lucide-react';

export function Hero() {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="flex items-center gap-2 text-cmm-muted">
        <Shield size={16} />
        <span className="text-sm uppercase tracking-widest">Open source · Apache-2.0</span>
        <Coins size={16} />
      </div>
      <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
        <span className="text-cmm-midnight">Midnight</span>
        <span className="text-cmm-muted"> + </span>
        <span className="text-cmm-cardano">Cardano</span>
        <span className="text-cmm-muted"> in </span>
        <span className="text-cmm-text">MetaMask</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-cmm-muted">
        CMM is the open-source MetaMask Snap that brings Cardano ADA and Midnight's
        selective-disclosure privacy to the 30M-user EVM wallet. One Snap, two
        chains, one seed.
      </p>
    </header>
  );
}
