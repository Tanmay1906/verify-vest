import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Grant, Proposal } from '@/lib/types';
import { connectWallet as connectAptosWallet, disconnectWallet as disconnectAptosWallet, getAccount } from '@/lib/wallet';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  grants: Grant[];
  setGrants: (grants: Grant[]) => void;
  proposals: Proposal[];
  setProposals: (proposals: Proposal[]) => void;
  isWalletConnected: boolean;
  setIsWalletConnected: (connected: boolean) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      const acct = await getAccount();
      if (acct?.address) {
        setIsWalletConnected(true);
        setWalletAddress(acct.address);
      }
    })();
  }, []);

  const connectWallet = async () => {
    const acct = await connectAptosWallet();
    setIsWalletConnected(true);
    setWalletAddress(acct.address);
  };

  const disconnectWallet = async () => {
    await disconnectAptosWallet();
    setIsWalletConnected(false);
    setWalletAddress(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        grants,
        setGrants,
        proposals,
        setProposals,
        isWalletConnected,
        setIsWalletConnected,
        walletAddress,
        setWalletAddress,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
