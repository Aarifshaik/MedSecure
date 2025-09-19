// Local IPFS Service - Simulates IPFS with proper file storage and retrieval
// This creates a local IPFS-like system with content addressing

interface StoredFile {
  cid: string;
  data: number[]; // ArrayBuffer as number array for JSON serialization
  size: number;
  mimeType: string;
  uploadedAt: string;
  pinned: boolean;
}

class LocalIPFSService {
  private storageKey = 'local_ipfs_storage';
  private indexKey = 'local_ipfs_index';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({}));
    }
    if (!localStorage.getItem(this.indexKey)) {
      localStorage.setItem(this.indexKey, JSON.stringify({
        totalFiles: 0,
        totalSize: 0,
        lastUpdated: new Date().toISOString()
      }));
    }
  }

  private getStorage(): Record<string, StoredFile> {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }

  private setStorage(storage: Record<string, StoredFile>): void {
    localStorage.setItem(this.storageKey, JSON.stringify(storage));
    this.updateIndex();
  }

  private updateIndex(): void {
    const storage = this.getStorage();
    const files = Object.values(storage);
    
    const index = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      lastUpdated: new Date().toISOString(),
      pinnedFiles: files.filter(f => f.pinned).length
    };
    
    localStorage.setItem(this.indexKey, JSON.stringify(index));
  }

  /**
   * Generate a content-addressed identifier (CID) for the file
   * In real IPFS, this would be a cryptographic hash of the content
   */
  private async generateCID(data: ArrayBuffer): Promise<string> {
    // Simple hash function for demo - in production use crypto.subtle.digest
    const bytes = new Uint8Array(data);
    let hash = 0;
    
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Create IPFS-like CID format
    const hashStr = Math.abs(hash).toString(36);
    const timestamp = Date.now().toString(36);
    return `Qm${hashStr}${timestamp}`.padEnd(46, '0').substring(0, 46);
  }

  /**
   * Add file to local IPFS storage
   */
  async add(data: ArrayBuffer, options: { pin?: boolean; mimeType?: string } = {}): Promise<string> {
    const { pin = true, mimeType = 'application/octet-stream' } = options;
    
    try {
      // Generate CID based on content
      const cid = await this.generateCID(data);
      
      // Check if file already exists
      const storage = this.getStorage();
      if (storage[cid]) {
        console.log('File already exists in local IPFS:', cid);
        return cid;
      }
      
      // Store file
      const storedFile: StoredFile = {
        cid,
        data: Array.from(new Uint8Array(data)),
        size: data.byteLength,
        mimeType,
        uploadedAt: new Date().toISOString(),
        pinned: pin
      };
      
      storage[cid] = storedFile;
      this.setStorage(storage);
      
      console.log(`File added to local IPFS: ${cid} (${data.byteLength} bytes)`);
      return cid;
      
    } catch (error) {
      console.error('Failed to add file to local IPFS:', error);
      throw new Error('Failed to store file in local IPFS');
    }
  }

  /**
   * Retrieve file from local IPFS storage
   */
  async cat(cid: string): Promise<ArrayBuffer> {
    try {
      const storage = this.getStorage();
      const storedFile = storage[cid];
      
      if (!storedFile) {
        throw new Error(`File not found: ${cid}`);
      }
      
      // Convert number array back to ArrayBuffer
      const uint8Array = new Uint8Array(storedFile.data);
      console.log(`File retrieved from local IPFS: ${cid} (${storedFile.size} bytes)`);
      
      return uint8Array.buffer;
      
    } catch (error) {
      console.error('Failed to retrieve file from local IPFS:', error);
      throw new Error(`Failed to retrieve file: ${cid}`);
    }
  }

  /**
   * Check if file exists in local IPFS
   */
  async exists(cid: string): Promise<boolean> {
    const storage = this.getStorage();
    return !!storage[cid];
  }

  /**
   * Get file information
   */
  async stat(cid: string): Promise<{
    cid: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    pinned: boolean;
  } | null> {
    const storage = this.getStorage();
    const storedFile = storage[cid];
    
    if (!storedFile) {
      return null;
    }
    
    return {
      cid: storedFile.cid,
      size: storedFile.size,
      mimeType: storedFile.mimeType,
      uploadedAt: storedFile.uploadedAt,
      pinned: storedFile.pinned
    };
  }

  /**
   * Pin a file (mark as important, don't garbage collect)
   */
  async pin(cid: string): Promise<void> {
    const storage = this.getStorage();
    const storedFile = storage[cid];
    
    if (!storedFile) {
      throw new Error(`File not found: ${cid}`);
    }
    
    storedFile.pinned = true;
    this.setStorage(storage);
    console.log(`File pinned: ${cid}`);
  }

  /**
   * Unpin a file
   */
  async unpin(cid: string): Promise<void> {
    const storage = this.getStorage();
    const storedFile = storage[cid];
    
    if (!storedFile) {
      throw new Error(`File not found: ${cid}`);
    }
    
    storedFile.pinned = false;
    this.setStorage(storage);
    console.log(`File unpinned: ${cid}`);
  }

  /**
   * Remove file from storage (only if not pinned)
   */
  async remove(cid: string): Promise<void> {
    const storage = this.getStorage();
    const storedFile = storage[cid];
    
    if (!storedFile) {
      throw new Error(`File not found: ${cid}`);
    }
    
    if (storedFile.pinned) {
      throw new Error(`Cannot remove pinned file: ${cid}`);
    }
    
    delete storage[cid];
    this.setStorage(storage);
    console.log(`File removed: ${cid}`);
  }

  /**
   * List all files
   */
  async list(): Promise<Array<{
    cid: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    pinned: boolean;
  }>> {
    const storage = this.getStorage();
    return Object.values(storage).map(file => ({
      cid: file.cid,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      pinned: file.pinned
    }));
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalFiles: number;
    totalSize: number;
    pinnedFiles: number;
    lastUpdated: string;
    formattedSize: string;
  } {
    const indexData = localStorage.getItem(this.indexKey);
    const index = indexData ? JSON.parse(indexData) : {
      totalFiles: 0,
      totalSize: 0,
      pinnedFiles: 0,
      lastUpdated: new Date().toISOString()
    };
    
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return {
      ...index,
      formattedSize: formatBytes(index.totalSize)
    };
  }

  /**
   * Clear all storage (for development/testing)
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.indexKey);
    this.initializeStorage();
    console.log('Local IPFS storage cleared');
  }

  /**
   * Export all data for backup
   */
  exportData(): string {
    const storage = this.getStorage();
    const index = localStorage.getItem(this.indexKey);
    
    return JSON.stringify({
      storage,
      index: index ? JSON.parse(index) : null,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Garbage collection - remove unpinned files older than specified days
   */
  async garbageCollect(olderThanDays: number = 30): Promise<number> {
    const storage = this.getStorage();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let removedCount = 0;
    
    for (const [cid, file] of Object.entries(storage)) {
      if (!file.pinned && new Date(file.uploadedAt) < cutoffDate) {
        delete storage[cid];
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.setStorage(storage);
      console.log(`Garbage collection removed ${removedCount} files`);
    }
    
    return removedCount;
  }
}

export const localIPFS = new LocalIPFSService();