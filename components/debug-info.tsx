'use client';

import { useWallet } from '@/hooks/use-wallet';
import { useContract } from '@/hooks/use-contract';
import { useState } from 'react';
import { PrototypeKeySharing } from '@/lib/prototype-key-sharing';
import { DatabaseAdmin } from './database-admin';
import { enhancedUploadService } from '@/lib/enhanced-upload-service';

export function DebugInfo() {
  const { account, role } = useWallet();
  const { getRegisteredPatients } = useContract();
  const [debugData, setDebugData] = useState<any>(null);
  const [showDatabase, setShowDatabase] = useState(false);

  const checkDebugInfo = async () => {
    if (!account) return;

    const patients = await getRegisteredPatients();
    const sharedKeys = PrototypeKeySharing.getSharedKeysForAddress(account);
    const accessibleFiles = enhancedUploadService.getAccessibleFiles(account);
    const uploadStats = enhancedUploadService.getStats();
    
    setDebugData({
      currentAccount: account,
      currentRole: role,
      registeredPatients: patients,
      sharedKeysCount: sharedKeys.length,
      sharedKeys: sharedKeys,
      accessibleFiles: accessibleFiles.length,
      uploadStats
    });
  };

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Debug Info & Database Admin</h3>
        <div className="flex space-x-2">
          <button
            onClick={checkDebugInfo}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Check Status
          </button>
          <button
            onClick={() => setShowDatabase(!showDatabase)}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            {showDatabase ? 'Hide' : 'Show'} Database
          </button>
        </div>
      </div>
      
      <div className="text-sm space-y-1">
        <div><strong>Account:</strong> {account || 'Not connected'}</div>
        <div><strong>Role:</strong> {role}</div>
        
        {debugData && (
          <div className="mt-3 space-y-2">
            <div><strong>Registered Patients:</strong> {debugData.registeredPatients.length}</div>
            <div><strong>Shared Keys Available:</strong> {debugData.sharedKeysCount}</div>
            
            {debugData.registeredPatients.length > 0 && (
              <div>
                <strong>Patients:</strong>
                <ul className="ml-4 list-disc">
                  {debugData.registeredPatients.map((p: any, i: number) => (
                    <li key={i}>{p.address} ({p.dataCount} records)</li>
                  ))}
                </ul>
              </div>
            )}
            
            {debugData.sharedKeys.length > 0 && (
              <div>
                <strong>Available Keys:</strong>
                <ul className="ml-4 list-disc">
                  {debugData.sharedKeys.map((k: any, i: number) => (
                    <li key={i}>CID: {k.cid.slice(0, 10)}... from {k.sharedBy.slice(0, 10)}...</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 p-3 bg-blue-50 rounded">
              <strong>Enhanced Database Stats:</strong>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>Accessible Files: {debugData.accessibleFiles}</div>
                <div>DB Files: {debugData.uploadStats?.database?.files || 0}</div>
                <div>IPFS Files: {debugData.uploadStats?.ipfs?.totalFiles || 0}</div>
                <div>Storage: {debugData.uploadStats?.ipfs?.formattedSize || '0 Bytes'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDatabase && (
        <div className="mt-4">
          <DatabaseAdmin />
        </div>
      )}
    </div>
  );
}