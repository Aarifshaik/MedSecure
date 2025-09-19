/**
 * Client-side encryption utilities using WebCrypto API
 * 
 * SECURITY WARNING: This implementation is for demonstration purposes.
 * For production use, consider additional security measures:
 * - Key derivation from user passwords
 * - Secure key storage mechanisms
 * - Regular key rotation
 * - Audit trails for key access
 */

export interface EncryptedFile {
  data: ArrayBuffer;
  iv: Uint8Array;
  keyId?: string; // Optional identifier for key management
}

export interface KeyExportData {
  key: JsonWebKey;
  iv: Uint8Array;
}

/**
 * Generate a random AES-GCM key for file encryption
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt file data using AES-GCM
 */
export async function encryptFile(
  file: ArrayBuffer,
  key: CryptoKey
): Promise<EncryptedFile> {
  // Generate random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    file
  );

  return {
    data: encryptedData,
    iv: iv,
  };
}

/**
 * Decrypt file data using AES-GCM
 */
export async function decryptFile(
  encryptedFile: EncryptedFile,
  key: CryptoKey
): Promise<ArrayBuffer> {
  try {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encryptedFile.iv,
      },
      key,
      encryptedFile.data
    );

    return decryptedData;
  } catch (error) {
    throw new Error('Failed to decrypt file. Invalid key or corrupted data.');
  }
}

/**
 * Export encryption key for sharing
 * WARNING: In production, encrypt this exported key before sharing
 */
export async function exportKey(key: CryptoKey, iv: Uint8Array): Promise<KeyExportData> {
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  
  return {
    key: exportedKey,
    iv: iv,
  };
}

/**
 * Import encryption key from shared data
 */
export async function importKey(keyData: KeyExportData): Promise<{key: CryptoKey, iv: Uint8Array}> {
  const key = await crypto.subtle.importKey(
    'jwk',
    keyData.key,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  return {
    key: key,
    iv: keyData.iv,
  };
}

/**
 * Convert ArrayBuffer to Base64 for storage/transmission
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer for decryption
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a secure random password/passphrase
 */
export function generateSecurePassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * Hash data using SHA-256 for verification
 */
export async function hashData(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}