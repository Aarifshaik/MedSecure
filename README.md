# MedSecure - Blockchain Patient Data Sharing Platform

A secure, decentralized patient data sharing platform built with Next.js, Ethereum blockchain, and IPFS for storing encrypted medical data.

## 🏥 Features

### Role-Based Access Control
- **Doctors**: Register patients, view all patient data
- **Researchers**: Access data from patients who have granted permission
- **Patients**: Upload encrypted data, manage access permissions

### Security Features
- **Client-side Encryption**: Files encrypted with AES-GCM before IPFS upload
- **Blockchain Access Control**: Smart contract manages data access permissions
- **Decentralized Storage**: IPFS for distributed, immutable data storage
- **MetaMask Integration**: Secure wallet connection and transaction signing

### Core Functionality
- Upload and encrypt medical files
- Grant/revoke access to specific addresses
- View encrypted data (with proper keys)
- Track all activities via blockchain events
- Responsive web interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Ganache for local blockchain
- Truffle framework

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd patient-data-sharing-dapp
   npm install
   ```

2. **Start local blockchain**
   ```bash
   # Install Ganache CLI
   npm install -g ganache-cli
   
   # Start Ganache with deterministic accounts
   ganache-cli --host 0.0.0.0 --accounts 10 --deterministic
   ```

3. **Deploy smart contract**
   ```bash
   # Install Truffle globally
   npm install -g truffle
   
   # Deploy contracts
   truffle migrate --reset
   ```

4. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your deployed contract address
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to access the application.

## 📋 Smart Contract Setup

### Sample Contract (Solidity)

Create a `contracts/PatientDataSharing.sol` file:

```solidity
// SPDX-License-Identifier: MIT
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
    
    constructor(address _doctor, address _researcher) {
        doctor = _doctor;
        researcher = _researcher;
    }
    
    // Add other contract functions here...
}
```

### Migration Script

Create `migrations/2_deploy_contracts.js`:

```javascript
const PatientDataSharing = artifacts.require("PatientDataSharing");

module.exports = function(deployer, network, accounts) {
  const doctor = accounts[1];     // Second account as doctor
  const researcher = accounts[2]; // Third account as researcher
  deployer.deploy(PatientDataSharing, doctor, researcher);
};
```

## 🔧 MetaMask Configuration

### Add Local Network
- **Network Name**: Ganache Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 1337
- **Currency**: ETH

### Import Test Accounts
Import private keys from Ganache output:
- Account 0: Patient account
- Account 1: Doctor account  
- Account 2: Researcher account

## 🧪 Testing Workflow

1. **Connect as Doctor** (Account 1)
   - Register new patients using their addresses
   - View all registered patients

2. **Connect as Patient** (Account 0)  
   - Upload encrypted medical files
   - Grant access to doctor/researcher addresses
   - Manage your data permissions

3. **Connect as Researcher** (Account 2)
   - View data from patients who granted access
   - Download and decrypt accessible files

## 🔒 Security Architecture

### Encryption Flow
1. **Client-side**: Generate AES-GCM key
2. **Encrypt**: File encrypted in browser
3. **Upload**: Encrypted data uploaded to IPFS
4. **Store**: Only IPFS CID stored on blockchain
5. **Share**: Keys shared off-chain securely

### Access Control
- Smart contract manages access permissions
- Role-based authentication via wallet addresses
- Event logging for audit trails
- Decentralized permission management

## ⚠️ Security Warnings

### Development Notice
This is a **demonstration platform**. Do not use with real medical data.

### Key Security Considerations
- **Key Management**: Demo uses localStorage. Production needs secure key vaults.
- **Data Privacy**: Only encrypted data goes to IPFS
- **Network Security**: Use HTTPS and secure networks in production
- **Regulatory Compliance**: Ensure HIPAA/GDPR compliance for real deployments
- **Access Control**: Implement additional authentication layers for production

### Production Recommendations
1. Implement secure key derivation from user credentials
2. Use hardware security modules (HSMs) for key storage
3. Add multi-factor authentication
4. Implement proper audit logging
5. Use private IPFS networks for sensitive data
6. Add data retention and deletion policies

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure
```
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/             # UI components (toast, etc.)
│   └── *.tsx           # Feature components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── contract.ts     # Smart contract interface
│   ├── crypto.ts       # Encryption utilities
│   └── ipfs.ts         # IPFS service
└── public/             # Static assets
```

### Key Components
- `WalletConnectButton` - MetaMask connection
- `RoleBadge` - User role display
- `UploadModal` - File encryption and upload
- `GrantAccessModal` - Access permission management
- `PatientList` - Patient management interface
- `EventLog` - Blockchain activity log

## 🔧 Troubleshooting

### Common Issues

**MetaMask Connection Fails**
- Ensure Ganache is running on port 8545
- Check MetaMask network configuration
- Verify account import

**Contract Interaction Errors**
- Confirm contract address in `.env.local`
- Check account has sufficient ETH for gas
- Verify contract deployment

**IPFS Upload Issues** 
- Check IPFS node connectivity
- Verify Infura credentials (if used)
- Try local IPFS node for development

**Role Detection Problems**
- Ensure proper account assignment during deployment
- Check MetaMask is using correct account
- Verify contract role assignments

## 📚 Additional Resources

- [Ethereum Development Documentation](https://ethereum.org/en/developers/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [MetaMask Developer Docs](https://docs.metamask.io/)
- [Truffle Suite](https://trufflesuite.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🏥 Medical Data Compliance

### HIPAA Considerations
For production medical applications:
- Implement Business Associate Agreements (BAAs)
- Add comprehensive audit logging
- Ensure data encryption at rest and in transit
- Implement access controls and user authentication
- Regular security assessments and penetration testing

### Data Governance
- Patient consent management
- Data retention and deletion policies  
- Cross-border data transfer compliance
- Regular compliance audits

## 📄 License

This project is for educational and demonstration purposes. Not intended for production medical data without proper security audits and compliance verification.

---

**⚠️ IMPORTANT**: This is a demonstration platform. Always consult with legal and security experts before handling real medical data.#   M e d S e c u r e  
 