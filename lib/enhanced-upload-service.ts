// Enhanced Upload Service - Integrates database, IPFS, and encryption
import { localDB, DatabaseFile } from './local-database';
import { ipfsService } from './ipfs';
import { encryptFile, generateEncryptionKey } from './crypto';

export interface UploadResult {
  success: boolean;
  fileId: string;
  cid: string;
  encryptionKeyId: string;
  message: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  description: string;
  dataType: number;
  patientAddress: string;
}

export class EnhancedUploadService {
  
  /**
   * Upload and encrypt a file with full database integration
   */
  async uploadFile(
    file: File, 
    metadata: FileMetadata
  ): Promise<UploadResult> {
    try {
      console.log('Starting enhanced file upload:', metadata);
      
      // Step 1: Convert file to ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      // Step 2: Generate encryption key
      const encryptionKey = await generateEncryptionKey();
      
      // Step 3: Encrypt the file
      const encryptedFile = await encryptFile(fileBuffer, encryptionKey);
      
      // Step 4: Upload encrypted file to IPFS
      const cid = await ipfsService.uploadFile(encryptedFile.data, file.type);
      
      // Step 5: Store file metadata in database
      const fileId = localDB.insertFile({
        cid,
        patientAddress: metadata.patientAddress,
        dataType: metadata.dataType,
        description: metadata.description,
        fileSize: file.size,
        fileName: file.name,
        mimeType: file.type,
        encryptionKeyId: '' // Will be updated after key insertion
      });
      
      // Step 6: Store encryption key in database
      const keyData = await crypto.subtle.exportKey('jwk', encryptionKey);
      const encryptionKeyId = localDB.insertEncryptionKey({
        keyData,
        iv: Array.from(encryptedFile.iv),
        fileId,
        createdBy: metadata.patientAddress
      });
      
      // Step 7: Update file record with encryption key ID
      const fileRecord = localDB.getFile(fileId);
      if (fileRecord) {
        fileRecord.encryptionKeyId = encryptionKeyId;
        // Update the file in database (simplified - in real DB this would be an UPDATE query)
        const files = JSON.parse(localStorage.getItem('files') || '[]');
        const fileIndex = files.findIndex((f: any) => f.id === fileId);
        if (fileIndex !== -1) {
          files[fileIndex] = fileRecord;
          localStorage.setItem('files', JSON.stringify(files));
        }
      }
      
      console.log('File upload completed successfully:', {
        fileId,
        cid,
        encryptionKeyId
      });
      
      return {
        success: true,
        fileId,
        cid,
        encryptionKeyId,
        message: 'File uploaded and encrypted successfully'
      };
      
    } catch (error: any) {
      console.error('Enhanced upload failed:', error);
      return {
        success: false,
        fileId: '',
        cid: '',
        encryptionKeyId: '',
        message: error.message || 'Upload failed'
      };
    }
  }
  
  /**
   * Retrieve and decrypt a file
   */
  async downloadFile(cid: string, userAddress: string): Promise<{
    success: boolean;
    data?: ArrayBuffer;
    metadata?: DatabaseFile;
    message: string;
  }> {
    try {
      console.log('Starting file download:', cid);
      
      // Step 1: Get file metadata from database
      const fileRecord = localDB.getFilesByCID(cid);
      if (!fileRecord) {
        throw new Error('File not found in database');
      }
      
      // Step 2: Check access permissions
      if (!this.hasAccess(fileRecord, userAddress)) {
        throw new Error('Access denied to this file');
      }
      
      // Step 3: Get encryption key
      const encryptionKey = await this.getDecryptionKey(fileRecord, userAddress);
      if (!encryptionKey) {
        throw new Error('Decryption key not available');
      }
      
      // Step 4: Download encrypted file from IPFS
      const encryptedData = await ipfsService.getFile(cid);
      
      // Step 5: Decrypt the file
      const { decryptFile, importKey } = await import('./crypto');
      const importedKey = await importKey({
        key: encryptionKey.keyData,
        iv: new Uint8Array(encryptionKey.iv)
      });
      
      const decryptedData = await decryptFile({
        data: encryptedData,
        iv: importedKey.iv
      }, importedKey.key);
      
      console.log('File download completed successfully');
      
      return {
        success: true,
        data: decryptedData,
        metadata: fileRecord,
        message: 'File downloaded and decrypted successfully'
      };
      
    } catch (error: any) {
      console.error('Download failed:', error);
      return {
        success: false,
        message: error.message || 'Download failed'
      };
    }
  }
  
  /**
   * Share file access with another user
   */
  async shareFileAccess(
    fileId: string, 
    fromAddress: string, 
    toAddress: string
  ): Promise<boolean> {
    try {
      console.log('Sharing file access:', { fileId, fromAddress, toAddress });
      
      // Step 1: Get file and verify ownership
      const fileRecord = localDB.getFile(fileId);
      if (!fileRecord || fileRecord.patientAddress !== fromAddress) {
        throw new Error('File not found or access denied');
      }
      
      // Step 2: Get original encryption key
      const originalKey = localDB.getEncryptionKeyByFile(fileId);
      if (!originalKey) {
        throw new Error('Encryption key not found');
      }
      
      // Step 3: Create shared key record
      localDB.insertSharedKey({
        originalKeyId: originalKey.id,
        sharedWith: toAddress,
        sharedBy: fromAddress,
        fileId
      });
      
      // Step 4: Record access grant
      localDB.insertAccessGrant({
        patientAddress: fromAddress,
        grantedTo: toAddress
      });
      
      console.log('File access shared successfully');
      return true;
      
    } catch (error: any) {
      console.error('Failed to share file access:', error);
      return false;
    }
  }
  
  /**
   * Get files accessible to a user
   */
  getAccessibleFiles(userAddress: string): DatabaseFile[] {
    // Get files owned by user
    const ownedFiles = localDB.getFilesByPatient(userAddress);
    
    // Get files shared with user
    const sharedKeys = localDB.getSharedKeysByRecipient(userAddress);
    const sharedFiles = sharedKeys.map(sk => localDB.getFile(sk.fileId)).filter(Boolean) as DatabaseFile[];
    
    // Combine and deduplicate
    const allFiles = [...ownedFiles, ...sharedFiles];
    const uniqueFiles = allFiles.filter((file, index, self) => 
      index === self.findIndex(f => f.id === file.id)
    );
    
    return uniqueFiles;
  }
  
  /**
   * Check if user has access to a file
   */
  private hasAccess(fileRecord: DatabaseFile, userAddress: string): boolean {
    // Owner always has access
    if (fileRecord.patientAddress === userAddress) {
      return true;
    }
    
    // Check if access was shared
    const sharedKey = localDB.getSharedKeyForFile(userAddress, fileRecord.id);
    return !!sharedKey;
  }
  
  /**
   * Get decryption key for a user
   */
  private async getDecryptionKey(fileRecord: DatabaseFile, userAddress: string) {
    // If user is the owner, get original key
    if (fileRecord.patientAddress === userAddress) {
      return localDB.getEncryptionKeyByFile(fileRecord.id);
    }
    
    // If user has shared access, get shared key
    const sharedKey = localDB.getSharedKeyForFile(userAddress, fileRecord.id);
    if (sharedKey) {
      return localDB.getEncryptionKey(sharedKey.originalKeyId);
    }
    
    return null;
  }
  
  /**
   * Get upload statistics
   */
  getStats() {
    const dbStats = localDB.getStats();
    const ipfsStats = ipfsService.getStats();
    
    return {
      database: dbStats,
      ipfs: ipfsStats,
      summary: {
        totalFiles: dbStats.files,
        totalPatients: dbStats.patients,
        totalSharedKeys: dbStats.sharedKeys,
        totalAccessGrants: dbStats.accessGrants
      }
    };
  }
  
  /**
   * Clear all data (for development)
   */
  clearAllData(): void {
    localDB.clearAllData();
    const { localIPFS } = require('./local-ipfs');
    localIPFS.clearAll();
    console.log('All upload service data cleared');
  }
}

export const enhancedUploadService = new EnhancedUploadService();