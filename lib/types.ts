export enum DataType {
  PERSONAL_INFO = 0,    // Name, address, phone, etc. (Doctor only)
  DIAGNOSIS = 1,        // Medical diagnosis (Doctor + Researcher)
  TREATMENT = 2,        // Treatment records (Doctor only)
  LAB_RESULTS = 3,      // Lab results (Doctor + Researcher)
  GENERAL_MEDICAL = 4   // General medical data (Doctor + Researcher)
}

export interface PatientInfo {
  address: string;
  name: string;
  age: number;
  phoneNumber: string;
  emergencyContact: string;
  registeredAt?: Date;
  dataCount?: number;
}

export interface Patient {
  address: string;
  name?: string;
  age?: number;
  phoneNumber?: string;
  emergencyContact?: string;
  registeredAt?: Date;
  dataCount?: number;
}

export interface MedicalRecord {
  index: number;
  cid: string;
  dataType: DataType;
  description: string;
  timestamp: Date;
  isDiagnosisData: boolean;
  isEncrypted: boolean;
}

export interface DataEntry extends MedicalRecord {}

export interface AccessGrant {
  patientAddress: string;
  grantedTo: string;
  timestamp: Date;
  isRevoked: boolean;
}

export enum UserRole {
  DOCTOR = 'Doctor',
  RESEARCHER = 'Researcher',
  PATIENT = 'Patient',
  UNKNOWN = 'Unknown'
}

export interface ContractEvent {
  event: string;
  args: any[];
  blockNumber: number;
  transactionHash: string;
}

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  key: CryptoKey;
  iv: Uint8Array;
}

export interface KeyShare {
  encryptedKey: string;
  recipientAddress: string;
}