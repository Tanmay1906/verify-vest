export type WalletAccount = { address: string };

declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string }>;
      account: () => Promise<{ address: string }>;
      isConnected: () => Promise<boolean>;
      disconnect: () => Promise<void>;
      signAndSubmitTransaction: (tx: any) => Promise<{ hash: string }>;
    };
  }
}

export async function connectWallet(): Promise<WalletAccount> {
  if (!window.aptos) throw new Error('Aptos wallet not found');
  const res = await window.aptos.connect();
  return { address: res.address };
}

export async function getAccount(): Promise<WalletAccount | null> {
  if (!window.aptos) return null;
  try {
    const res = await window.aptos.account();
    return { address: res.address };
  } catch {
    return null;
  }
}

export async function disconnectWallet(): Promise<void> {
  if (!window.aptos) return;
  try {
    await window.aptos.disconnect();
  } catch {}
}

export async function submitEntryFunction(payload: { function: string; type_arguments?: string[]; arguments?: any[] }) {
  if (!window.aptos) throw new Error('Aptos wallet not found');
  const tx = { type: 'entry_function_payload', ...payload };
  return window.aptos.signAndSubmitTransaction(tx);
}
