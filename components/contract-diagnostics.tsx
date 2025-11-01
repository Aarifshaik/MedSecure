'use client';

import { useState } from 'react';
import { contractService } from '@/lib/contract';
import { useToast } from './ui/toast';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function ContractDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { addToast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Check if MetaMask is available
      results.tests.push({
        name: 'MetaMask Available',
        status: typeof window !== 'undefined' && window.ethereum ? 'pass' : 'fail',
        details: typeof window !== 'undefined' && window.ethereum ? 'MetaMask detected' : 'MetaMask not found'
      });

      // Test 2: Check contract connection
      try {
        await contractService.connect();
        results.tests.push({
          name: 'Wallet Connection',
          status: 'pass',
          details: 'Successfully connected to wallet'
        });
      } catch (error) {
        results.tests.push({
          name: 'Wallet Connection',
          status: 'fail',
          details: error.message
        });
        setDiagnostics(results);
        setIsRunning(false);
        return;
      }

      // Test 3: Check contract instance
      try {
        const contract = contractService.getContract();
        results.tests.push({
          name: 'Contract Instance',
          status: 'pass',
          details: `Contract address: ${contract.target}`
        });
      } catch (error) {
        results.tests.push({
          name: 'Contract Instance',
          status: 'fail',
          details: error.message
        });
      }

      // Test 4: Check signer
      try {
        const signer = contractService.getSigner();
        const signerAddress = await signer.getAddress();
        results.tests.push({
          name: 'Signer Available',
          status: 'pass',
          details: `Signer address: ${signerAddress}`
        });
        results.signerAddress = signerAddress;
      } catch (error) {
        results.tests.push({
          name: 'Signer Available',
          status: 'fail',
          details: error.message
        });
      }

      // Test 5: Check doctor address
      try {
        const contract = contractService.getContract();
        const doctorAddress = await contract.doctor();
        results.tests.push({
          name: 'Doctor Address',
          status: 'pass',
          details: `Doctor: ${doctorAddress}`
        });
        results.doctorAddress = doctorAddress;
      } catch (error) {
        results.tests.push({
          name: 'Doctor Address',
          status: 'fail',
          details: error.message
        });
      }

      // Test 6: Check researcher address
      try {
        const contract = contractService.getContract();
        const researcherAddress = await contract.researcher();
        results.tests.push({
          name: 'Researcher Address',
          status: 'pass',
          details: `Researcher: ${researcherAddress}`
        });
        results.researcherAddress = researcherAddress;
      } catch (error) {
        results.tests.push({
          name: 'Researcher Address',
          status: 'fail',
          details: error.message
        });
      }

      // Test 7: Check if current user is doctor
      if (results.signerAddress && results.doctorAddress) {
        const isDoctor = results.signerAddress.toLowerCase() === results.doctorAddress.toLowerCase();
        results.tests.push({
          name: 'Is Current User Doctor',
          status: isDoctor ? 'pass' : 'warn',
          details: isDoctor ? 'Current user is the doctor' : 'Current user is NOT the doctor'
        });
        results.isDoctor = isDoctor;
      }

      // Test 8: Check network
      try {
        const signer = contractService.getSigner();
        const network = await signer.provider?.getNetwork();
        results.tests.push({
          name: 'Network',
          status: 'pass',
          details: `Chain ID: ${network?.chainId}, Name: ${network?.name || 'Unknown'}`
        });
      } catch (error) {
        results.tests.push({
          name: 'Network',
          status: 'fail',
          details: error.message
        });
      }

    } catch (error) {
      results.tests.push({
        name: 'General Error',
        status: 'fail',
        details: error.message
      });
    }

    setDiagnostics(results);
    setIsRunning(false);

    // Show summary toast
    const failedTests = results.tests.filter(t => t.status === 'fail').length;
    const warnTests = results.tests.filter(t => t.status === 'warn').length;
    
    if (failedTests > 0) {
      addToast({
        type: 'error',
        title: 'Diagnostics Complete',
        message: `${failedTests} tests failed, ${warnTests} warnings`
      });
    } else if (warnTests > 0) {
      addToast({
        type: 'warning',
        title: 'Diagnostics Complete',
        message: `All tests passed with ${warnTests} warnings`
      });
    } else {
      addToast({
        type: 'success',
        title: 'Diagnostics Complete',
        message: 'All tests passed!'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Contract Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {diagnostics && (
        <div className="space-y-3">
          <div className="text-sm text-gray-500 mb-4">
            Last run: {new Date(diagnostics.timestamp).toLocaleString()}
          </div>
          
          {diagnostics.tests.map((test: any, index: number) => (
            <div key={index} className="flex items-start space-x-3 p-3 border rounded">
              {getStatusIcon(test.status)}
              <div className="flex-1">
                <div className="font-medium">{test.name}</div>
                <div className="text-sm text-gray-600">{test.details}</div>
              </div>
            </div>
          ))}

          {diagnostics.isDoctor === false && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Registration Issue Detected</span>
              </div>
              <p className="text-sm text-yellow-700">
                You are not connected as the doctor account. Only the doctor can register patients.
                <br />
                <strong>Doctor address:</strong> {diagnostics.doctorAddress}
                <br />
                <strong>Your address:</strong> {diagnostics.signerAddress}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}