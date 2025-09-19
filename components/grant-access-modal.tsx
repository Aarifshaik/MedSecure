'use client';

import { useState } from 'react';
import { X, Share, Loader2, Shield } from 'lucide-react';
import { useContract } from '@/hooks/use-contract';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from './ui/toast';
import { PrototypeKeySharing } from '@/lib/prototype-key-sharing';

interface GrantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GrantAccessModal({ isOpen, onClose, onSuccess }: GrantAccessModalProps) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  
  const { grantAccess, revokeAccess, waitForTransaction } = useContract();
  const { account } = useWallet();
  const { addToast } = useToast();

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleGrantAccess = async () => {
    if (!isValidAddress(recipientAddress)) {
      addToast({
        type: 'error',
        title: 'Invalid address',
        message: 'Please enter a valid Ethereum address'
      });
      return;
    }

    setIsGranting(true);
    
    try {
      addToast({
        type: 'info',
        title: 'Granting access',
        message: 'Processing transaction...'
      });

      const tx = await grantAccess(recipientAddress);
      if (!tx) {
        throw new Error('Failed to grant access');
      }
      
      await waitForTransaction(tx);
      
      // Share encryption keys with the recipient
      if (account) {
        try {
          await PrototypeKeySharing.shareKeysWithAddress(recipientAddress, account);
          addToast({
            type: 'success',
            title: 'Access granted',
            message: `Successfully granted access and shared encryption keys with ${recipientAddress}`
          });
        } catch (keyError) {
          console.error('Key sharing failed:', keyError);
          addToast({
            type: 'warning',
            title: 'Partial success',
            message: 'Blockchain access granted, but key sharing failed. Manual key sharing required.'
          });
        }
      } else {
        addToast({
          type: 'success',
          title: 'Access granted',
          message: `Successfully granted access to ${recipientAddress}`
        });
      }

      setRecipientAddress('');
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Grant access failed:', error);
      addToast({
        type: 'error',
        title: 'Failed to grant access',
        message: error.message || 'Transaction failed'
      });
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!isValidAddress(recipientAddress)) {
      addToast({
        type: 'error',
        title: 'Invalid address',
        message: 'Please enter a valid Ethereum address'
      });
      return;
    }

    setIsRevoking(true);
    
    try {
      addToast({
        type: 'info',
        title: 'Revoking access',
        message: 'Processing transaction...'
      });

      const tx = await revokeAccess(recipientAddress);
      if (!tx) {
        throw new Error('Failed to revoke access');
      }
      
      await waitForTransaction(tx);
      
      // Revoke encryption keys from the recipient
      try {
        PrototypeKeySharing.revokeKeysFromAddress(recipientAddress);
        addToast({
          type: 'success',
          title: 'Access revoked',
          message: `Successfully revoked access and encryption keys for ${recipientAddress}`
        });
      } catch (keyError) {
        console.error('Key revocation failed:', keyError);
        addToast({
          type: 'warning',
          title: 'Partial success',
          message: 'Blockchain access revoked, but key removal failed.'
        });
      }

      setRecipientAddress('');
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Revoke access failed:', error);
      addToast({
        type: 'error',
        title: 'Failed to revoke access',
        message: error.message || 'Transaction failed'
      });
    } finally {
      setIsRevoking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Manage Data Access</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the Ethereum address of the doctor or researcher
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Key Sharing Required</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              After granting access, you must securely share the decryption key off-chain with the recipient.
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-700">
              <strong>Security Warning:</strong> Granting access only allows reading the IPFS CID. 
              The recipient will need the encryption key to decrypt your files.
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={isGranting || isRevoking}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleRevokeAccess}
            disabled={!isValidAddress(recipientAddress) || isGranting || isRevoking}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isRevoking && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Revoke</span>
          </button>
          <button
            onClick={handleGrantAccess}
            disabled={!isValidAddress(recipientAddress) || isGranting || isRevoking}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isGranting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Share className="w-4 h-4" />
            <span>Grant Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}