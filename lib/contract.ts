import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contract-abi';

export class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  async connect(): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    await this.provider.send('eth_requestAccounts', []);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
    
    const address = await this.signer.getAddress();
    return address;
  }

  getContract() {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call connect() first.');
    }
    return this.contract;
  }

  getSigner() {
    if (!this.signer) {
      throw new Error('Signer not initialized. Call connect() first.');
    }
    return this.signer;
  }

  async getDoctorAddress(): Promise<string> {
    const contract = this.getContract();
    return await contract.doctor();
  }

  async getResearcherAddress(): Promise<string> {
    const contract = this.getContract();
    return await contract.researcher();
  }

  async registerPatient(
    patientAddress: string,
    name: string,
    age: number,
    phoneNumber: string,
    emergencyContact: string
  ): Promise<ethers.ContractTransactionResponse> {
    console.log('contractService.registerPatient called with:', { patientAddress, name, age, phoneNumber, emergencyContact });
    
    const contract = this.getContract();
    console.log('Contract instance:', contract.target);
    
    // Check if we're connected and have a signer
    const signer = this.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('Signer address:', signerAddress);
    
    // Check if signer is the doctor
    try {
      const doctorAddress = await contract.doctor();
      console.log('Doctor address from contract:', doctorAddress);
      console.log('Is signer the doctor?', signerAddress.toLowerCase() === doctorAddress.toLowerCase());
    } catch (error) {
      console.error('Error checking doctor address:', error);
    }
    
    console.log('Calling contract.registerPatient...');
    return await contract.registerPatient(patientAddress, name, age, phoneNumber, emergencyContact);
  }

  async addData(cid: string, dataType: number, description: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    return await contract.addData(cid, dataType, description);
  }

  async getPatientInfo(patientAddress: string): Promise<{name: string, age: number, phoneNumber: string, emergencyContact: string}> {
    const contract = this.getContract();
    const result = await contract.getPatientInfo(patientAddress);
    return {
      name: result[0],
      age: Number(result[1]),
      phoneNumber: result[2],
      emergencyContact: result[3]
    };
  }

  async getRecordByIndex(patientAddress: string, index: number): Promise<{
    cid: string,
    dataType: number,
    description: string,
    timestamp: number,
    isDiagnosisData: boolean
  }> {
    const contract = this.getContract();
    const result = await contract.getRecordByIndex(patientAddress, index);
    return {
      cid: result[0],
      dataType: Number(result[1]),
      description: result[2],
      timestamp: Number(result[3]),
      isDiagnosisData: result[4]
    };
  }

  async grantAccess(toAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    return await contract.grantAccess(toAddress);
  }

  async revokeAccess(toAddress: string): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    return await contract.revokeAccess(toAddress);
  }

  async getDataCount(patientAddress: string): Promise<number> {
    const contract = this.getContract();
    const count = await contract.getDataCount(patientAddress);
    return Number(count);
  }

  async getDataByIndex(patientAddress: string, index: number): Promise<string> {
    const contract = this.getContract();
    const result = await contract.getRecordByIndex(patientAddress, index);
    return result.cid; // Return just the CID for backward compatibility
  }

  async isAccessGranted(patientAddress: string, accessorAddress: string): Promise<boolean> {
    const contract = this.getContract();
    return await contract.isAccessGranted(patientAddress, accessorAddress);
  }

  async getEvents(eventName: string, fromBlock = 0) {
    try {
      const contract = this.getContract();
      console.log(`Getting events for: ${eventName}`);
      
      // Create filter for the specific event
      const filter = contract.filters[eventName]();
      console.log('Filter created:', filter);
      
      const events = await contract.queryFilter(filter, fromBlock);
      console.log(`Found ${events.length} ${eventName} events`);
      
      return events;
    } catch (error) {
      console.error(`Error getting ${eventName} events:`, error);
      return [];
    }
  }
}

export const contractService = new ContractService();