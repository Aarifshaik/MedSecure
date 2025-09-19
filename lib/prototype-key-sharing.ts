// Simple Key Sharing for Prototype
// In production, this would use proper cryptographic key exchange

export interface SharedKeyData {
  cid: string;
  encryptionKey: any; // JWK format
  iv: number[];
  description: string;
  uploadDate: string;
  sharedBy: string; // Patient address
  sharedWith: string; // Doctor/Researcher address
}

export class PrototypeKeySharing {
  
  /**
   * Share encryption keys with a specific address
   * For prototype: Store in localStorage with address prefix
   */
  static async shareKeysWithAddress(recipientAddress: string, patientAddress: string): Promise<void> {
    // Get all encryption keys for this patient
    const allKeys = this.getAllPatientKeys(patientAddress);
    
    if (allKeys.length === 0) {
      throw new Error('No encryption keys found to share');
    }

    // Share each key with the recipient
    for (const keyData of allKeys) {
      const sharedKey: SharedKeyData = {
        cid: keyData.cid,
        encryptionKey: keyData.key,
        iv: keyData.iv,
        description: keyData.description,
        uploadDate: keyData.uploadDate,
        sharedBy: patientAddress,
        sharedWith: recipientAddress
      };

      // Store the shared key for the recipient
      const sharedKeyId = `shared_key_${recipientAddress}_${keyData.cid}`;
      localStorage.setItem(sharedKeyId, JSON.stringify(sharedKey));
    }

    console.log(`Shared ${allKeys.length} encryption keys with ${recipientAddress}`);
  }

  /**
   * Get all encryption keys for a patient
   */
  static getAllPatientKeys(patientAddress: string): any[] {
    const keys: any[] = [];
    
    // Scan localStorage for encryption keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('encryption_key_')) {
        const keyData = JSON.parse(localStorage.getItem(key) || '{}');
        keys.push(keyData);
      }
    }
    
    return keys;
  }

  /**
   * Get shared keys for a specific address (doctor/researcher)
   */
  static getSharedKeysForAddress(address: string): SharedKeyData[] {
    const sharedKeys: SharedKeyData[] = [];
    
    // Scan localStorage for shared keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`shared_key_${address}_`)) {
        const keyData = JSON.parse(localStorage.getItem(key) || '{}');
        sharedKeys.push(keyData);
      }
    }
    
    return sharedKeys;
  }

  /**
   * Get encryption key for a specific CID and address
   */
  static getKeyForCID(cid: string, address: string): SharedKeyData | null {
    const keyId = `shared_key_${address}_${cid}`;
    const stored = localStorage.getItem(keyId);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Revoke access by removing shared keys
   */
  static revokeKeysFromAddress(recipientAddress: string): void {
    const keysToRemove: string[] = [];
    
    // Find all keys shared with this address
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`shared_key_${recipientAddress}_`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove the keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Revoked ${keysToRemove.length} keys from ${recipientAddress}`);
  }
}