'use client';

import { useState, useEffect, useCallback } from 'react';
import { contractService } from '@/lib/contract';
import { UserRole } from '@/lib/types';

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  role: UserRole;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    account: null,
    role: UserRole.UNKNOWN,
    isLoading: false,
    error: null,
  });

  const determineUserRole = useCallback(async (address: string): Promise<UserRole> => {
    try {
      // Check if user is doctor
      const doctorAddress = await contractService.getDoctorAddress();
      if (address.toLowerCase() === doctorAddress.toLowerCase()) {
        return UserRole.DOCTOR;
      }

      // Check if user is researcher
      const researcherAddress = await contractService.getResearcherAddress();
      if (address.toLowerCase() === researcherAddress.toLowerCase()) {
        return UserRole.RESEARCHER;
      }

      // Check if user is a registered patient by trying to get data count
      try {
        await contractService.getDataCount(address);
        return UserRole.PATIENT;
      } catch (error) {
        // If getDataCount fails, user might not be registered as patient
        return UserRole.UNKNOWN;
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      return UserRole.UNKNOWN;
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const address = await contractService.connect();
      const role = await determineUserRole(address);

      setState({
        isConnected: true,
        account: address,
        role,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Failed to connect wallet',
      }));
    }
  }, [determineUserRole]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: null,
      role: UserRole.UNKNOWN,
      isLoading: false,
      error: null,
    });
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.account) {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
          const role = await determineUserRole(accounts[0]);
          setState(prev => ({
            ...prev,
            account: accounts[0],
            role,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error updating account:', error);
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    const handleChainChanged = () => {
      // Reload the page when chain changes
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.account, determineUserRole, disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connect();
        }
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    };

    autoConnect();
  }, [connect]);

  return {
    ...state,
    connect,
    disconnect,
  };
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}