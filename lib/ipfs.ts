import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { localIPFS } from './local-ipfs';

export class IPFSService {
  private client: IPFSHTTPClient | null = null;
  private useLocalIPFS = false;

  constructor() {
    // Check if we have Infura credentials
    const auth = process.env.NEXT_PUBLIC_INFURA_IPFS_ID && process.env.NEXT_PUBLIC_INFURA_IPFS_SECRET
      ? 'Basic ' + Buffer.from(
          process.env.NEXT_PUBLIC_INFURA_IPFS_ID + ':' + process.env.NEXT_PUBLIC_INFURA_IPFS_SECRET
        ).toString('base64')
      : undefined;

    if (auth) {
      // Use Infura IPFS
      this.client = create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: { authorization: auth },
      });
      console.log('Using Infura IPFS service');
    } else {
      // Use local IPFS for development
      console.log('Using Local IPFS service for development');
      this.useLocalIPFS = true;
    }
  }

  /**
   * Upload encrypted file to IPFS
   * SECURITY WARNING: Only upload encrypted data to public IPFS
   */
  async uploadFile(file: ArrayBuffer, mimeType?: string): Promise<string> {
    if (this.useLocalIPFS) {
      // Use local IPFS service
      return await localIPFS.add(file, { 
        pin: true, 
        mimeType: mimeType || 'application/octet-stream' 
      });
    }

    try {
      const result = await this.client!.add(new Uint8Array(file), {
        pin: true, // Pin the file to prevent garbage collection
      });
      
      console.log('File uploaded to IPFS with CID:', result.cid.toString());
      return result.cid.toString();
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  /**
   * Retrieve file from IPFS
   */
  async getFile(cid: string): Promise<ArrayBuffer> {
    if (this.useLocalIPFS) {
      // Use local IPFS service
      return await localIPFS.cat(cid);
    }

    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.client!.cat(cid)) {
        chunks.push(chunk);
      }
      
      // Combine chunks into single ArrayBuffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error('Failed to retrieve file from IPFS');
    }
  }

  /**
   * Check if a file exists on IPFS
   */
  async fileExists(cid: string): Promise<boolean> {
    if (this.useLocalIPFS) {
      return await localIPFS.exists(cid);
    }

    try {
      const stat = await this.client!.object.stat(cid);
      return stat.NumLinks >= 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStat(cid: string) {
    if (this.useLocalIPFS) {
      return await localIPFS.stat(cid);
    }

    try {
      return await this.client!.object.stat(cid);
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return null;
    }
  }

  /**
   * Get IPFS service statistics
   */
  getStats() {
    if (this.useLocalIPFS) {
      return {
        service: 'Local IPFS',
        ...localIPFS.getStats()
      };
    }
    
    return {
      service: 'Infura IPFS',
      status: 'Connected'
    };
  }
}

export const ipfsService = new IPFSService();