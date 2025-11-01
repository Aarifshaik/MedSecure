// Contract ABI for PatientDataSharing contract
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "doctor",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "researcher", 
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_patient", "type": "address"},
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "uint256", "name": "_age", "type": "uint256"},
      {"internalType": "string", "name": "_phoneNumber", "type": "string"},
      {"internalType": "string", "name": "_emergencyContact", "type": "string"}
    ],
    "name": "registerPatient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_cid", "type": "string"},
      {"internalType": "uint8", "name": "_dataType", "type": "uint8"},
      {"internalType": "string", "name": "_description", "type": "string"}
    ],
    "name": "addData",
    "outputs": [],
    "stateMutability": "nonpayable", 
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_to", "type": "address"}],
    "name": "grantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_to", "type": "address"}],
    "name": "revokeAccess", 
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_patient", "type": "address"}],
    "name": "getDataCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_patient", "type": "address"},
      {"internalType": "uint256", "name": "_index", "type": "uint256"}
    ],
    "name": "getRecordByIndex",
    "outputs": [
      {"internalType": "string", "name": "cid", "type": "string"},
      {"internalType": "uint8", "name": "dataType", "type": "uint8"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "bool", "name": "isDiagnosisData", "type": "bool"}
    ],
    "stateMutability": "view", 
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_patient", "type": "address"}],
    "name": "getPatientInfo",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "uint256", "name": "age", "type": "uint256"},
      {"internalType": "string", "name": "phoneNumber", "type": "string"},
      {"internalType": "string", "name": "emergencyContact", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_patient", "type": "address"},
      {"internalType": "address", "name": "_accessor", "type": "address"}
    ],
    "name": "isAccessGranted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "patient", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "grantedTo", "type": "address"}
    ],
    "name": "AccessGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "patient", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "age", "type": "uint256"}
    ],
    "name": "PatientRegistered", 
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "patient", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "cid", "type": "string"},
      {"indexed": false, "internalType": "uint8", "name": "dataType", "type": "uint8"},
      {"indexed": false, "internalType": "string", "name": "description", "type": "string"}
    ],
    "name": "DataAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "patient", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "revokedFrom", "type": "address"}
    ],
    "name": "AccessRevoked",
    "type": "event"
  }
] as const;

// Replace with actual deployed contract address
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";