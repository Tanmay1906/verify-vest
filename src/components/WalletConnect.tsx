import { useMemo, useState } from 'react';
import { Wallet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

function shorten(addr: string) {
  if (!addr) return '';
  return addr.length > 12 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
}

export const WalletConnect = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isWalletConnected, walletAddress, connectWallet, disconnectWallet } = useApp();

  const hasWallet = useMemo(() => !!(window as any).aptos, []);

  const onConnect = async () => {
    if (!hasWallet) {
      toast.error('Aptos wallet not found', {
        description: 'Install Petra Wallet to continue: https://petra.app/',
      });
      return;
    }
    try {
      await connectWallet();
      setIsOpen(false);
      toast.success('Wallet connected');
    } catch (e: any) {
      toast.error('Failed to connect wallet', { description: e?.message });
    }
  };

  const onDisconnect = async () => {
    try {
      await disconnectWallet();
      toast.info('Wallet disconnected');
    } catch (e: any) {
      toast.error('Failed to disconnect wallet', { description: e?.message });
    }
  };

  if (isWalletConnected && walletAddress) {
    return (
      <Button variant="outline" onClick={onDisconnect} size="sm">
        <Check className="h-4 w-4" />
        {shorten(walletAddress)}
      </Button>
    );
  }

  return (
    <>
      <Button variant="gradient" onClick={() => setIsOpen(true)} size="sm" className="animate-glow-pulse">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Connect Your Aptos Wallet
            </DialogTitle>
            <DialogDescription>
              Connect your wallet to interact with the Aptos blockchain and manage grants and proposals.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Petra Wallet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Official wallet for Aptos blockchain.
              </p>
              <Button onClick={onConnect} className="w-full" variant="gradient" disabled={!hasWallet}>
                {hasWallet ? 'Connect Petra' : 'Install Petra to Continue'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
