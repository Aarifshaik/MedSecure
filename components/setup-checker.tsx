'use client';

import { useState } from 'react';
import { useToast } from './ui/toast';
import { CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';

export function SetupChecker() {
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { addToast } = useToast();

  const runSetupCheck = async () => {
    setIsRunning(true);
    const checks = [];

    try {
      // Check 1: Environment variables
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      checks.push({
        name: 'Contract Address Environment Variable',
        status: contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000' ? 'pass' : 'fail',
        details: contractAddress || 'Not set',
        expected: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
      });

      // Check 2: MetaMask
      checks.push({
        name: 'MetaMask Available',
        status: typeof window !== 'undefined' && window.ethereum ? 'pass' : 'fail',
        details: typeof window !== 'undefined' && window.ethereum ? 'Detected' : 'Not found'
      });

      // Check 3: Network
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const expectedChainId = '0x539'; // 1337 in hex
          checks.push({
            name: 'Network Chain ID',
            status: chainId === expectedChainId ? 'pass' : 'warn',
            details: `Current: ${chainId} (${parseInt(chainId, 16)})`,
            expected: `${expectedChainId} (1337 - Hardhat Local)`
          });
        } catch (error) {
          checks.push({
            name: 'Network Chain ID',
            status: 'fail',
            details: 'Could not get chain ID'
          });
        }

        // Check 4: Current account
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const doctorAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
          const currentAccount = accounts[0];
          
          checks.push({
            name: 'Connected Account',
            status: accounts.length > 0 ? 'pass' : 'fail',
            details: currentAccount || 'No account connected'
          });

          if (currentAccount) {
            checks.push({
              name: 'Is Doctor Account',
              status: currentAccount.toLowerCase() === doctorAddress.toLowerCase() ? 'pass' : 'warn',
              details: `Current: ${currentAccount}`,
              expected: `Doctor: ${doctorAddress}`
            });
          }
        } catch (error) {
          checks.push({
            name: 'Account Check',
            status: 'fail',
            details: 'Could not get accounts'
          });
        }
      }

      setResults({
        timestamp: new Date().toISOString(),
        checks,
        summary: {
          total: checks.length,
          passed: checks.filter(c => c.status === 'pass').length,
          warnings: checks.filter(c => c.status === 'warn').length,
          failed: checks.filter(c => c.status === 'fail').length
        }
      });

    } catch (error) {
      console.error('Setup check failed:', error);
      addToast({
        type: 'error',
        title: 'Setup Check Failed',
        message: error.message
      });
    } finally {
      setIsRunning(false);
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
    <div className="bg-white rounded-lg border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Setup Verification</h3>
        <button
          onClick={runSetupCheck}
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'Checking...' : 'Verify Setup'}</span>
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{results.summary.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{results.summary.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{results.summary.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          <div className="space-y-3">
            {results.checks.map((check: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-gray-600">{check.details}</div>
                  {check.expected && (
                    <div className="text-xs text-gray-500 mt-1">Expected: {check.expected}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {results.summary.failed > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Setup Issues Detected</h4>
              <div className="text-sm text-red-700 space-y-1">
                <p>• Make sure Hardhat node is running: <code>npm run node</code></p>
                <p>• Deploy the contract: <code>npm run deploy:local</code></p>
                <p>• Connect MetaMask to localhost:8545 (Chain ID: 1337)</p>
                <p>• Import the doctor account: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8</p>
              </div>
            </div>
          )}

          {results.summary.failed === 0 && results.summary.warnings === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✅ Setup Complete!</h4>
              <p className="text-sm text-green-700">
                Everything looks good. You should be able to register patients now.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}