import type { Balance, ChainId, SignedTx, TxPayload } from '@cmm/shared';

/**
 * The single interface every CMM dApp calls.
 *
 * - `mock` implementation returns deterministic fixtures for dev/demo.
 * - `real` implementation invokes the Snap via `wallet_invokeSnap`.
 */
export interface SnapAdapter {
  /** Is a compatible CMM Snap available in this browser? */
  isInstalled(): Promise<boolean>;

  /** Request MetaMask to install / connect the CMM Snap. */
  connect(): Promise<void>;

  /** Return an address (chain-specific encoding) for the given chain. */
  getAddress(chain: ChainId): Promise<string>;

  /** Return a balance snapshot. */
  getBalance(chain: ChainId): Promise<Balance>;

  /** Request a transaction signature. Triggers a snap_dialog approval. */
  signTransaction(tx: TxPayload): Promise<SignedTx>;

  /** Submit a previously-signed transaction to the chain. */
  submitTransaction(signed: SignedTx): Promise<{ txHash: string }>;
}
