'use client';

import { Wallet, LogOut } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';

export function WalletConnectButton() {
  const { isConnected, account, isLoading, error, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
          {formatAddress(account)}
        </div>
        <button
          onClick={disconnect}
          className="p-2 text-gray-500 hover:text-red-600 transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={connect}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Wallet className="w-4 h-4" />
        <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
      {error && (
        <p className="text-red-600 text-sm max-w-xs">{error}</p>
      )}
    </div>
  );
}