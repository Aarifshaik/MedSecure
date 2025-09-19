'use client';

import { useState } from 'react';
import { Download, Lock, Unlock, Loader2 } from 'lucide-react';
import { enhancedUploadService } from '@/lib/enhanced-upload-service';
import { useToast } from './ui/toast';
import { useWallet } from '@/hooks/use-wallet';

interface FetchFileButtonProps {
  cid: string;
  filename?: string;
  className?: string;
}

export function FetchFileButton({ cid, filename, className = "" }: FetchFileButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const { addToast } = useToast();
  const { account } = useWallet();

  const downloadFile = (data: ArrayBuffer, filename: string) => {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `file_${cid.slice(0, 8)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFetchFile = async () => {
    if (!account) {
      addToast({
        type: 'error',
        title: 'Not connected',
        message: 'Please connect your wallet to download files'
      });
      return;
    }

    setIsDownloading(true);

    try {
      addToast({
        type: 'info',
        title: 'Downloading file',
        message: 'Retrieving and decrypting from local IPFS...'
      });

      // Use enhanced service to download and decrypt
      const result = await enhancedUploadService.downloadFile(cid, account);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      if (result.data && result.metadata) {
        // Download the decrypted file
        downloadFile(
          result.data, 
          filename || result.metadata.fileName || result.metadata.description || 'medical_file'
        );
        
        addToast({
          type: 'success',
          title: 'Download successful',
          message: `File "${result.metadata.fileName}" downloaded and decrypted successfully`
        });
      }
      
    } catch (error: any) {
      console.error('File download failed:', error);
      
      // If access denied, show manual key input as fallback
      if (error.message.includes('Access denied') || error.message.includes('key not available')) {
        setShowKeyInput(true);
        addToast({
          type: 'warning',
          title: 'Access restricted',
          message: 'Enter encryption key manually or request access from patient'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Download failed',
          message: error.message || 'Failed to download file'
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDecryptWithKey = async () => {
    if (!encryptionKey.trim()) {
      addToast({
        type: 'error',
        title: 'Key required',
        message: 'Please enter the encryption key'
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Parse the encryption key (assuming it's JSON format)
      const keyData = JSON.parse(encryptionKey);
      const importedKey = await importKey({
        key: keyData.key,
        iv: new Uint8Array(keyData.iv)
      });
      
      // Fetch file again
      const encryptedData = await ipfsService.getFile(cid);
      
      // Decrypt
      const decryptedData = await decryptFile({
        data: encryptedData,
        iv: importedKey.iv
      }, importedKey.key);
      
      downloadFile(decryptedData, filename || 'medical_file');
      
      addToast({
        type: 'success',
        title: 'File downloaded',
        message: 'File decrypted and downloaded successfully'
      });
      
      setShowKeyInput(false);
      setEncryptionKey('');
    } catch (error: any) {
      console.error('Decryption with manual key failed:', error);
      addToast({
        type: 'error',
        title: 'Decryption failed',
        message: 'Invalid encryption key or corrupted file'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (showKeyInput) {
    return (
      <div className="space-y-2">
        <textarea
          value={encryptionKey}
          onChange={(e) => setEncryptionKey(e.target.value)}
          placeholder="Enter encryption key (JSON format)..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={3}
        />
        <div className="flex space-x-2">
          <button
            onClick={handleDecryptWithKey}
            disabled={isDownloading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            {isDownloading && <Loader2 className="w-3 h-3 animate-spin" />}
            <Unlock className="w-3 h-3" />
            <span>Decrypt</span>
          </button>
          <button
            onClick={() => setShowKeyInput(false)}
            className="text-gray-600 hover:text-gray-800 px-3 py-1 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleFetchFile}
      disabled={isDownloading}
      className={`flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm transition-colors ${className}`}
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{isDownloading ? 'Fetching...' : 'Download'}</span>
    </button>
  );
}