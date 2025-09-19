'use client';

import { useState, useRef } from 'react';
import { X, Upload, Lock, Loader2, Database } from 'lucide-react';
import { enhancedUploadService } from '@/lib/enhanced-upload-service';
import { useContract } from '@/hooks/use-contract';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from './ui/toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState(1); // Default to DIAGNOSIS
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addData, waitForTransaction } = useContract();
  const { account } = useWallet();
  const { addToast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (limit to 10MB for demo)
      if (selectedFile.size > 10 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'File too large',
          message: 'Please select a file smaller than 10MB'
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !account) return;

    setIsUploading(true);
    
    try {
      addToast({
        type: 'info',
        title: 'Processing file',
        message: 'Encrypting and uploading to local IPFS...'
      });

      // Step 1: Upload using enhanced service
      const uploadResult = await enhancedUploadService.uploadFile(file, {
        name: file.name,
        size: file.size,
        type: file.type,
        description,
        dataType,
        patientAddress: account
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }

      addToast({
        type: 'info',
        title: 'File uploaded',
        message: 'Adding to blockchain...'
      });
      
      // Step 2: Store CID on blockchain
      const tx = await addData(uploadResult.cid, dataType, description);
      if (!tx) {
        throw new Error('Failed to add data to blockchain');
      }
      
      // Step 3: Wait for transaction confirmation
      addToast({
        type: 'info',
        title: 'Transaction pending',
        message: 'Waiting for blockchain confirmation...'
      });
      
      await waitForTransaction(tx);
      
      addToast({
        type: 'success',
        title: 'Upload successful',
        message: `File "${file.name}" encrypted and stored securely`
      });
      
      // Reset form
      setFile(null);
      setDescription('');
      setDataType(1);
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      addToast({
        type: 'error',
        title: 'Upload failed',
        message: error.message || 'Failed to upload file'
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Upload Medical Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.png,.dicom"
            />
            
            {file ? (
              <div className="space-y-2">
                <div className="text-green-600">
                  <Upload className="w-8 h-8 mx-auto" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Choose file to upload
                </button>
                <p className="text-sm text-gray-500">
                  PDF, DOC, images, or medical files (max 10MB)
                </p>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Type *
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Personal Information (Doctor Only)</option>
              <option value={1}>Diagnosis (Doctor + Researcher)</option>
              <option value={2}>Treatment Records (Doctor Only)</option>
              <option value={3}>Lab Results (Doctor + Researcher)</option>
              <option value={4}>General Medical (Doctor + Researcher)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Brief description of the medical data..."
              required
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-blue-800">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Enhanced Security</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Files are encrypted client-side and stored in local IPFS with database indexing.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-green-800">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Local Database</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              File metadata and encryption keys are stored in a structured local database with proper indexing.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !description.trim() || isUploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isUploading ? 'Uploading...' : 'Upload & Encrypt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}