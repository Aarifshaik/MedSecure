'use client';

import { useState, useCallback } from 'react';
import { contractService } from '@/lib/contract';
import { DataEntry, Patient } from '@/lib/types';
import { ethers } from 'ethers';

export function useContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      if (successMessage) {
        console.log(successMessage);
      }
      return result;
    } catch (err: any) {
      console.error('Contract operation failed:', err);
      setError(err?.message || 'Transaction failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPatient = useCallback(async (
    patientAddress: string,
    name: string,
    age: number,
    phoneNumber: string,
    emergencyContact: string
  ) => {
    console.log('useContract.registerPatient called with:', { patientAddress, name, age, phoneNumber, emergencyContact });
    return handleContractCall(
      () => {
        console.log('Calling contractService.registerPatient...');
        return contractService.registerPatient(patientAddress, name, age, phoneNumber, emergencyContact);
      },
      `Patient ${name} registered successfully`
    );
  }, [handleContractCall]);

  const addData = useCallback(async (cid: string, dataType: number, description: string) => {
    return handleContractCall(
      () => contractService.addData(cid, dataType, description),
      `Data "${description}" added successfully`
    );
  }, [handleContractCall]);

  const grantAccess = useCallback(async (toAddress: string) => {
    return handleContractCall(
      () => contractService.grantAccess(toAddress),
      `Access granted to ${toAddress}`
    );
  }, [handleContractCall]);

  const revokeAccess = useCallback(async (toAddress: string) => {
    return handleContractCall(
      () => contractService.revokeAccess(toAddress),
      `Access revoked for ${toAddress}`
    );
  }, [handleContractCall]);

  const getDataCount = useCallback(async (patientAddress: string): Promise<number> => {
    const result = await handleContractCall(
      () => contractService.getDataCount(patientAddress)
    );
    return result || 0;
  }, [handleContractCall]);

  const getDataByIndex = useCallback(async (patientAddress: string, index: number): Promise<string | null> => {
    return handleContractCall(
      () => contractService.getDataByIndex(patientAddress, index)
    );
  }, [handleContractCall]);

  const isAccessGranted = useCallback(async (patientAddress: string, accessorAddress: string): Promise<boolean> => {
    const result = await handleContractCall(
      () => contractService.isAccessGranted(patientAddress, accessorAddress)
    );
    return result || false;
  }, [handleContractCall]);

  const getPatientData = useCallback(async (patientAddress: string): Promise<DataEntry[]> => {
    const dataCount = await getDataCount(patientAddress);
    const entries: DataEntry[] = [];

    for (let i = 0; i < dataCount; i++) {
      try {
        const record = await contractService.getRecordByIndex(patientAddress, i);
        entries.push({
          index: i,
          cid: record.cid,
          dataType: record.dataType,
          description: record.description,
          timestamp: new Date(record.timestamp * 1000),
          isDiagnosisData: record.isDiagnosisData,
          isEncrypted: true,
        });
      } catch (error) {
        console.error(`Failed to get record ${i} for patient ${patientAddress}:`, error);
        // Skip this record if access is denied
      }
    }

    return entries;
  }, [getDataCount]);

  const getRegisteredPatients = useCallback(async (): Promise<Patient[]> => {
    try {
      const events = await contractService.getEvents('PatientRegistered');
      const patients: Patient[] = [];

      for (const event of events) {
        const [patientAddress, name, age] = event.args;
        const dataCount = await getDataCount(patientAddress);
        
        try {
          const patientInfo = await contractService.getPatientInfo(patientAddress);
          patients.push({
            address: patientAddress,
            name: patientInfo.name,
            age: patientInfo.age,
            phoneNumber: patientInfo.phoneNumber,
            emergencyContact: patientInfo.emergencyContact,
            registeredAt: new Date(), // Get from block timestamp in real implementation
            dataCount,
          });
        } catch (infoError) {
          // If we can't get patient info (researcher accessing), use basic info
          patients.push({
            address: patientAddress,
            name: name || 'Patient',
            age: age ? Number(age) : undefined,
            registeredAt: new Date(),
            dataCount,
          });
        }
      }

      return patients;
    } catch (error) {
      console.error('Failed to get registered patients:', error);
      return [];
    }
  }, [getDataCount]);

  const waitForTransaction = useCallback(async (txResponse: ethers.ContractTransactionResponse) => {
    if (!txResponse) return null;
    
    setIsLoading(true);
    try {
      const receipt = await txResponse.wait();
      console.log('Transaction confirmed:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('Transaction failed:', error);
      setError('Transaction failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    registerPatient,
    addData,
    grantAccess,
    revokeAccess,
    getDataCount,
    getDataByIndex,
    isAccessGranted,
    getPatientData,
    getRegisteredPatients,
    waitForTransaction,
    clearError: () => setError(null),
  };
}