// Local Database Service - Simulates a real database with proper indexing and relationships
// This replaces localStorage with a structured database-like approach

export interface DatabasePatient {
  address: string;
  name: string;
  age: number;
  phoneNumber: string;
  emergencyContact: string;
  registeredAt: string;
  registeredBy: string; // Doctor who registered
}

export interface DatabaseFile {
  id: string;
  cid: string;
  patientAddress: string;
  dataType: number;
  description: string;
  uploadedAt: string;
  fileSize: number;
  fileName: string;
  mimeType: string;
  encryptionKeyId: string;
}

export interface DatabaseEncryptionKey {
  id: string;
  keyData: any; // JWK format
  iv: number[];
  fileId: string;
  createdAt: string;
  createdBy: string; // Patient address
}

export interface DatabaseAccessGrant {
  id: string;
  patientAddress: string;
  grantedTo: string;
  grantedAt: string;
  revokedAt?: string;
  isActive: boolean;
}

export interface DatabaseSharedKey {
  id: string;
  originalKeyId: string;
  sharedWith: string;
  sharedBy: string;
  sharedAt: string;
  fileId: string;
}

class LocalDatabase {
  private dbName = 'medsecure_db';
  private version = 1;

  // Table names
  private tables = {
    patients: 'patients',
    files: 'files',
    encryptionKeys: 'encryption_keys',
    accessGrants: 'access_grants',
    sharedKeys: 'shared_keys'
  };

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Initialize tables if they don't exist
    Object.values(this.tables).forEach(table => {
      if (!localStorage.getItem(table)) {
        localStorage.setItem(table, JSON.stringify([]));
      }
    });

    // Create indexes
    this.createIndexes();
  }

  private createIndexes() {
    // Create index tables for fast lookups
    const indexes = [
      'idx_files_by_patient',
      'idx_keys_by_file',
      'idx_grants_by_patient',
      'idx_grants_by_grantee',
      'idx_shared_keys_by_recipient'
    ];

    indexes.forEach(index => {
      if (!localStorage.getItem(index)) {
        localStorage.setItem(index, JSON.stringify({}));
      }
    });
  }

  private getTable<T>(tableName: string): T[] {
    const data = localStorage.getItem(tableName);
    return data ? JSON.parse(data) : [];
  }

  private setTable<T>(tableName: string, data: T[]): void {
    localStorage.setItem(tableName, JSON.stringify(data));
  }

  private getIndex(indexName: string): Record<string, string[]> {
    const data = localStorage.getItem(indexName);
    return data ? JSON.parse(data) : {};
  }

  private setIndex(indexName: string, data: Record<string, string[]>): void {
    localStorage.setItem(indexName, JSON.stringify(data));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Patient operations
  insertPatient(patient: Omit<DatabasePatient, 'registeredAt'>): string {
    const patients = this.getTable<DatabasePatient>(this.tables.patients);
    const newPatient: DatabasePatient = {
      ...patient,
      registeredAt: new Date().toISOString()
    };
    
    patients.push(newPatient);
    this.setTable(this.tables.patients, patients);
    
    console.log('Patient inserted:', newPatient);
    return patient.address;
  }

  getPatient(address: string): DatabasePatient | null {
    const patients = this.getTable<DatabasePatient>(this.tables.patients);
    return patients.find(p => p.address.toLowerCase() === address.toLowerCase()) || null;
  }

  getAllPatients(): DatabasePatient[] {
    return this.getTable<DatabasePatient>(this.tables.patients);
  }

  // File operations
  insertFile(file: Omit<DatabaseFile, 'id' | 'uploadedAt'>): string {
    const files = this.getTable<DatabaseFile>(this.tables.files);
    const fileId = this.generateId();
    
    const newFile: DatabaseFile = {
      ...file,
      id: fileId,
      uploadedAt: new Date().toISOString()
    };
    
    files.push(newFile);
    this.setTable(this.tables.files, files);
    
    // Update index
    const fileIndex = this.getIndex('idx_files_by_patient');
    if (!fileIndex[file.patientAddress]) {
      fileIndex[file.patientAddress] = [];
    }
    fileIndex[file.patientAddress].push(fileId);
    this.setIndex('idx_files_by_patient', fileIndex);
    
    console.log('File inserted:', newFile);
    return fileId;
  }

  getFile(fileId: string): DatabaseFile | null {
    const files = this.getTable<DatabaseFile>(this.tables.files);
    return files.find(f => f.id === fileId) || null;
  }

  getFilesByCID(cid: string): DatabaseFile | null {
    const files = this.getTable<DatabaseFile>(this.tables.files);
    return files.find(f => f.cid === cid) || null;
  }

  getFilesByPatient(patientAddress: string): DatabaseFile[] {
    const fileIndex = this.getIndex('idx_files_by_patient');
    const fileIds = fileIndex[patientAddress] || [];
    
    const files = this.getTable<DatabaseFile>(this.tables.files);
    return fileIds.map(id => files.find(f => f.id === id)).filter(Boolean) as DatabaseFile[];
  }

  // Encryption key operations
  insertEncryptionKey(key: Omit<DatabaseEncryptionKey, 'id' | 'createdAt'>): string {
    const keys = this.getTable<DatabaseEncryptionKey>(this.tables.encryptionKeys);
    const keyId = this.generateId();
    
    const newKey: DatabaseEncryptionKey = {
      ...key,
      id: keyId,
      createdAt: new Date().toISOString()
    };
    
    keys.push(newKey);
    this.setTable(this.tables.encryptionKeys, keys);
    
    // Update index
    const keyIndex = this.getIndex('idx_keys_by_file');
    keyIndex[key.fileId] = keyId;
    this.setIndex('idx_keys_by_file', keyIndex);
    
    console.log('Encryption key inserted:', keyId);
    return keyId;
  }

  getEncryptionKey(keyId: string): DatabaseEncryptionKey | null {
    const keys = this.getTable<DatabaseEncryptionKey>(this.tables.encryptionKeys);
    return keys.find(k => k.id === keyId) || null;
  }

  getEncryptionKeyByFile(fileId: string): DatabaseEncryptionKey | null {
    const keyIndex = this.getIndex('idx_keys_by_file');
    const keyId = keyIndex[fileId];
    
    if (!keyId) return null;
    
    return this.getEncryptionKey(keyId);
  }

  // Access grant operations
  insertAccessGrant(grant: Omit<DatabaseAccessGrant, 'id' | 'grantedAt' | 'isActive'>): string {
    const grants = this.getTable<DatabaseAccessGrant>(this.tables.accessGrants);
    const grantId = this.generateId();
    
    const newGrant: DatabaseAccessGrant = {
      ...grant,
      id: grantId,
      grantedAt: new Date().toISOString(),
      isActive: true
    };
    
    grants.push(newGrant);
    this.setTable(this.tables.accessGrants, grants);
    
    // Update indexes
    const patientIndex = this.getIndex('idx_grants_by_patient');
    if (!patientIndex[grant.patientAddress]) {
      patientIndex[grant.patientAddress] = [];
    }
    patientIndex[grant.patientAddress].push(grantId);
    this.setIndex('idx_grants_by_patient', patientIndex);
    
    const granteeIndex = this.getIndex('idx_grants_by_grantee');
    if (!granteeIndex[grant.grantedTo]) {
      granteeIndex[grant.grantedTo] = [];
    }
    granteeIndex[grant.grantedTo].push(grantId);
    this.setIndex('idx_grants_by_grantee', granteeIndex);
    
    console.log('Access grant inserted:', newGrant);
    return grantId;
  }

  getAccessGrantsByPatient(patientAddress: string): DatabaseAccessGrant[] {
    const grantIndex = this.getIndex('idx_grants_by_patient');
    const grantIds = grantIndex[patientAddress] || [];
    
    const grants = this.getTable<DatabaseAccessGrant>(this.tables.accessGrants);
    return grantIds.map(id => grants.find(g => g.id === id)).filter(Boolean) as DatabaseAccessGrant[];
  }

  getAccessGrantsByGrantee(granteeAddress: string): DatabaseAccessGrant[] {
    const grantIndex = this.getIndex('idx_grants_by_grantee');
    const grantIds = grantIndex[granteeAddress] || [];
    
    const grants = this.getTable<DatabaseAccessGrant>(this.tables.accessGrants);
    return grantIds.map(id => grants.find(g => g.id === id)).filter(Boolean) as DatabaseAccessGrant[];
  }

  // Shared key operations
  insertSharedKey(sharedKey: Omit<DatabaseSharedKey, 'id' | 'sharedAt'>): string {
    const sharedKeys = this.getTable<DatabaseSharedKey>(this.tables.sharedKeys);
    const sharedKeyId = this.generateId();
    
    const newSharedKey: DatabaseSharedKey = {
      ...sharedKey,
      id: sharedKeyId,
      sharedAt: new Date().toISOString()
    };
    
    sharedKeys.push(newSharedKey);
    this.setTable(this.tables.sharedKeys, sharedKeys);
    
    // Update index
    const recipientIndex = this.getIndex('idx_shared_keys_by_recipient');
    if (!recipientIndex[sharedKey.sharedWith]) {
      recipientIndex[sharedKey.sharedWith] = [];
    }
    recipientIndex[sharedKey.sharedWith].push(sharedKeyId);
    this.setIndex('idx_shared_keys_by_recipient', recipientIndex);
    
    console.log('Shared key inserted:', newSharedKey);
    return sharedKeyId;
  }

  getSharedKeysByRecipient(recipientAddress: string): DatabaseSharedKey[] {
    const recipientIndex = this.getIndex('idx_shared_keys_by_recipient');
    const sharedKeyIds = recipientIndex[recipientAddress] || [];
    
    const sharedKeys = this.getTable<DatabaseSharedKey>(this.tables.sharedKeys);
    return sharedKeyIds.map(id => sharedKeys.find(sk => sk.id === id)).filter(Boolean) as DatabaseSharedKey[];
  }

  getSharedKeyForFile(recipientAddress: string, fileId: string): DatabaseSharedKey | null {
    const sharedKeys = this.getSharedKeysByRecipient(recipientAddress);
    return sharedKeys.find(sk => sk.fileId === fileId) || null;
  }

  // Utility methods
  clearAllData(): void {
    Object.values(this.tables).forEach(table => {
      localStorage.removeItem(table);
    });
    
    // Clear indexes
    const indexes = [
      'idx_files_by_patient',
      'idx_keys_by_file', 
      'idx_grants_by_patient',
      'idx_grants_by_grantee',
      'idx_shared_keys_by_recipient'
    ];
    
    indexes.forEach(index => {
      localStorage.removeItem(index);
    });
    
    this.initializeDatabase();
    console.log('Database cleared and reinitialized');
  }

  exportData(): string {
    const data = {
      patients: this.getTable(this.tables.patients),
      files: this.getTable(this.tables.files),
      encryptionKeys: this.getTable(this.tables.encryptionKeys),
      accessGrants: this.getTable(this.tables.accessGrants),
      sharedKeys: this.getTable(this.tables.sharedKeys)
    };
    
    return JSON.stringify(data, null, 2);
  }

  getStats(): any {
    return {
      patients: this.getTable(this.tables.patients).length,
      files: this.getTable(this.tables.files).length,
      encryptionKeys: this.getTable(this.tables.encryptionKeys).length,
      accessGrants: this.getTable(this.tables.accessGrants).length,
      sharedKeys: this.getTable(this.tables.sharedKeys).length
    };
  }
}

export const localDB = new LocalDatabase();