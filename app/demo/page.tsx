'use client';

import { Shield, Code, Database, Lock } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">MedSecure Demo</h1>
            </div>
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Development Setup Guide
          </h2>
          <p className="text-lg text-gray-600">
            Follow these steps to set up and test the MedSecure blockchain patient data sharing platform.
          </p>
        </div>

        {/* Prerequisites */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Prerequisites</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Node.js 18+ installed</li>
            <li>• MetaMask browser extension</li>
            <li>• Ganache CLI or Ganache GUI for local blockchain</li>
            <li>• Truffle framework for contract deployment</li>
            <li>• IPFS node or Infura IPFS API access</li>
          </ul>
        </div>

        {/* Step 1: Ganache Setup */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Step 1: Setup Ganache</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Install Ganache CLI:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>npm install -g ganache-cli</code>
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Start Ganache:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>ganache-cli --host 0.0.0.0 --accounts 10 --deterministic</code>
              </pre>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Save the mnemonic and account addresses shown in the output.
                You'll need them for MetaMask configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Smart Contract */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-2 rounded-full">
              <Code className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Step 2: Deploy Smart Contract</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Sample Solidity Contract:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto h-64 overflow-y-auto">
                <code>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PatientDataSharing {
    address public doctor;
    address public researcher;
    
    struct PatientData {
        string[] cidList;
        mapping(address => bool) accessGrants;
        bool isRegistered;
    }
    
    mapping(address => PatientData) patients;
    address[] public registeredPatients;
    
    event PatientRegistered(address indexed patient);
    event DataAdded(address indexed patient, string cid);
    event AccessGranted(address indexed patient, address indexed grantedTo);
    event AccessRevoked(address indexed patient, address indexed revokedFrom);
    
    constructor(address _doctor, address _researcher) {
        doctor = _doctor;
        researcher = _researcher;
    }
    
    modifier onlyDoctor() {
        require(msg.sender == doctor, "Only doctor can perform this action");
        _;
    }
    
    modifier onlyPatient() {
        require(patients[msg.sender].isRegistered, "Only registered patients");
        _;
    }
    
    function registerPatient(address _patient) external onlyDoctor {
        require(!patients[_patient].isRegistered, "Patient already registered");
        patients[_patient].isRegistered = true;
        registeredPatients.push(_patient);
        emit PatientRegistered(_patient);
    }
    
    function addData(string memory _cid) external onlyPatient {
        patients[msg.sender].cidList.push(_cid);
        emit DataAdded(msg.sender, _cid);
    }
    
    function grantAccess(address _to) external onlyPatient {
        patients[msg.sender].accessGrants[_to] = true;
        emit AccessGranted(msg.sender, _to);
    }
    
    function revokeAccess(address _to) external onlyPatient {
        patients[msg.sender].accessGrants[_to] = false;
        emit AccessRevoked(msg.sender, _to);
    }
    
    function getDataCount(address _patient) external view returns (uint256) {
        return patients[_patient].cidList.length;
    }
    
    function getDataByIndex(address _patient, uint256 _index) 
        external view returns (string memory) {
        require(_index < patients[_patient].cidList.length, "Index out of bounds");
        require(
            msg.sender == _patient || 
            patients[_patient].accessGrants[msg.sender] || 
            msg.sender == doctor || 
            msg.sender == researcher,
            "Access denied"
        );
        return patients[_patient].cidList[_index];
    }
    
    function isAccessGranted(address _patient, address _accessor) 
        external view returns (bool) {
        return patients[_patient].accessGrants[_accessor] || 
               _accessor == doctor || 
               _accessor == researcher;
    }
}`}</code>
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Deploy with Truffle:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{`// migrations/2_deploy_contracts.js
const PatientDataSharing = artifacts.require("PatientDataSharing");

module.exports = function(deployer, network, accounts) {
  const doctor = accounts[1];     // Second account as doctor
  const researcher = accounts[2]; // Third account as researcher
  deployer.deploy(PatientDataSharing, doctor, researcher);
};`}</code>
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Deploy command:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>truffle migrate --reset</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Step 3: Environment Setup */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-full">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Step 3: Environment Configuration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Create .env.local file:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{`# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS

# IPFS Configuration (optional - for Infura IPFS)
NEXT_PUBLIC_INFURA_IPFS_ID=your_infura_project_id
NEXT_PUBLIC_INFURA_IPFS_SECRET=your_infura_project_secret`}</code>
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Update contract address:</h4>
              <p className="text-sm text-gray-600">
                After deployment, copy the contract address from Truffle output and update the 
                <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in your .env.local file.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: MetaMask Setup */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Step 4: Configure MetaMask</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Add Local Network:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Network Name: Ganache Local</li>
                <li>• New RPC URL: http://127.0.0.1:8545</li>
                <li>• Chain ID: 1337</li>
                <li>• Currency Symbol: ETH</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Import Test Accounts:</h4>
              <p className="text-sm text-gray-600">
                Import the private keys from Ganache accounts (particularly accounts 0, 1, and 2) 
                to test different roles.
              </p>
            </div>
          </div>
        </div>

        {/* Step 5: Testing */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Step 5: Testing the Application</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Test Accounts:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Account 0: Patient (default)</li>
                <li>• Account 1: Doctor (can register patients)</li>
                <li>• Account 2: Researcher (can view granted data)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Test Workflow:</h4>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Connect with Doctor account and register Patient account</li>
                <li>Switch to Patient account and upload encrypted medical data</li>
                <li>Grant access to Doctor and/or Researcher accounts</li>
                <li>Switch to Doctor/Researcher and try to view patient data</li>
                <li>Test file encryption/decryption functionality</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Security Warnings */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-800 mb-3">🚨 Important Security Warnings</h3>
          <ul className="space-y-2 text-red-700 text-sm">
            <li>• <strong>Development Only:</strong> This is a demonstration platform. Do not use with real medical data.</li>
            <li>• <strong>Key Management:</strong> Encryption keys are stored in localStorage for demo purposes. Production systems need secure key management.</li>
            <li>• <strong>IPFS Security:</strong> Only encrypted data should be uploaded to public IPFS networks.</li>
            <li>• <strong>Network Security:</strong> Use secure networks and HTTPS in production deployments.</li>
            <li>• <strong>Compliance:</strong> Ensure HIPAA and other regulatory compliance for production medical applications.</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Troubleshooting</h3>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">MetaMask Connection Issues:</h4>
              <p className="text-sm text-gray-600">Make sure Ganache is running and MetaMask is connected to the local network.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Contract Interaction Failures:</h4>
              <p className="text-sm text-gray-600">Verify the contract address is correctly set in .env.local and the account has sufficient ETH for gas.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Role Detection Issues:</h4>
              <p className="text-sm text-gray-600">Ensure accounts are properly assigned during contract deployment and the correct accounts are imported to MetaMask.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">IPFS Upload Errors:</h4>
              <p className="text-sm text-gray-600">Check IPFS configuration and network connectivity. Consider using local IPFS node for development.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}