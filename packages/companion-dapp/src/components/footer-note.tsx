import { Github } from 'lucide-react';

export function FooterNote() {
  return (
    <footer className="mt-16 border-t border-cmm-border pt-8 text-center text-sm text-cmm-muted">
      <p>
        CMM · Cardano + Midnight in MetaMask · Open source (Apache-2.0) · Built by
        the sisterhood.
      </p>
      <p className="mt-2 inline-flex items-center gap-2">
        <Github size={14} />
        <span>bytewizard42i/Cardano-native-metamask (private, pre-launch)</span>
      </p>
    </footer>
  );
}
