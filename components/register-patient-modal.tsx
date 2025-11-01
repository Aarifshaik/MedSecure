'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { useContract } from '@/hooks/use-contract';
import { useToast } from './ui/toast';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RegisterPatientModal({ isOpen, onClose, onSuccess }: RegisterPatientModalProps) {
  const [patientAddress, setPatientAddress] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { registerPatient, waitForTransaction } = useContract();
  const { addToast } = useToast();

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleRegisterPatient = async () => {
    console.log('Starting patient registration...');
    console.log('Form data:', { patientAddress, patientName, patientAge, phoneNumber, emergencyContact });

    if (!isValidAddress(patientAddress)) {
      console.log('Invalid address:', patientAddress);
      addToast({
        type: 'error',
        title: 'Invalid address',
        message: 'Please enter a valid Ethereum address'
      });
      return;
    }

    if (!patientName.trim() || !patientAge || !phoneNumber.trim()) {
      console.log('Missing required fields');
      addToast({
        type: 'error',
        title: 'Missing information',
        message: 'Please fill in all required fields'
      });
      return;
    }

    setIsRegistering(true);
    
    try {
      console.log('Calling registerPatient function...');
      addToast({
        type: 'info',
        title: 'Registering patient',
        message: 'Processing transaction...'
      });

      const tx = await registerPatient(
        patientAddress,
        patientName,
        parseInt(patientAge),
        phoneNumber,
        emergencyContact
      );
      
      console.log('Transaction response:', tx);
      
      if (!tx) {
        throw new Error('Failed to register patient - no transaction returned');
      }
      
      console.log('Waiting for transaction confirmation...');
      const receipt = await waitForTransaction(tx);
      console.log('Transaction confirmed:', receipt);
      
      addToast({
        type: 'success',
        title: 'Patient registered',
        message: `Successfully registered patient ${patientAddress}`
      });

      setPatientAddress('');
      setPatientName('');
      setPatientAge('');
      setPhoneNumber('');
      setEmergencyContact('');
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Patient registration failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data
      });
      
      let errorMessage = 'Failed to register patient';
      
      if (error.message?.includes('Only doctor can perform this action')) {
        errorMessage = 'Only doctors can register patients. Please ensure you are connected with a doctor account.';
      } else if (error.message?.includes('Patient already registered')) {
        errorMessage = 'This patient is already registered in the system.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast({
        type: 'error',
        title: 'Registration failed',
        message: errorMessage
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Register New Patient</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Address *
            </label>
            <input
              type="text"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              placeholder="0x..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="John Doe"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age *
            </label>
            <input
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder="25"
              min="0"
              max="150"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Jane Doe - +1 (555) 987-6543"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Only doctors can register new patients in the system.
            </p>
            <button
              onClick={async () => {
                try {
                  const { contractService } = await import('@/lib/contract');
                  const contract = contractService.getContract();
                  const doctorAddr = await contract.doctor();
                  const signer = contractService.getSigner();
                  const signerAddr = await signer.getAddress();
                  console.log('Contract test - Doctor:', doctorAddr, 'Signer:', signerAddr);
                  addToast({
                    type: 'info',
                    title: 'Contract Test',
                    message: `Doctor: ${doctorAddr.slice(0,6)}... Signer: ${signerAddr.slice(0,6)}...`
                  });
                } catch (error) {
                  console.error('Contract test failed:', error);
                  addToast({
                    type: 'error',
                    title: 'Contract Test Failed',
                    message: error.message
                  });
                }
              }}
              className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
            >
              Test Contract Connection
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            disabled={isRegistering}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleRegisterPatient}
            disabled={!isValidAddress(patientAddress) || !patientName.trim() || !patientAge || !phoneNumber.trim() || isRegistering}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
            <UserPlus className="w-4 h-4" />
            <span>{isRegistering ? 'Registering...' : 'Register Patient'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}