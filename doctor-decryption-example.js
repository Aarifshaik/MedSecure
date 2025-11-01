// Doctor Decryption Key Access Example
// This shows exactly where keys are stored and their format

// 1. DOCTOR LOGIN SCENARIO
const doctorAddress = "0x742d35Cc6634C0532925a3b8D4C9db96590c4567"; // Example doctor address

console.log("=== DOCTOR DECRYPTION KEY ACCESS GUIDE ===\n");

// 2. WHERE ARE THE KEYS STORED?
console.log("📍 KEY STORAGE LOCATIONS:");
console.log("- Browser localStorage (development)");
console.log("- Key format: shared_key_{doctorAddress}_{fileCID}");
console.log("- Example key: shared_key_0x742d35Cc6634C0532925a3b8D4C9db96590c4567_QmXYZ123...\n");

// 3. HOW TO ACCESS SHARED KEYS AS DOCTOR
function getDoctorSharedKeys(doctorAddress) {
  const sharedKeys = [];
  
  // Scan localStorage for keys shared with this doctor
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`shared_key_${doctorAddress}_`)) {
      const keyData = JSON.parse(localStorage.getItem(key));
      sharedKeys.push(keyData);
    }
  }
  
  return sharedKeys;
}

// 4. EXAMPLE KEY FORMAT (JSON Web Key - JWK)
const exampleSharedKey = {
  "cid": "QmXYZ123abcDEF456...",
  "encryptionKey": {
    // This is the JWK (JSON Web Key) format
    "kty": "oct",           // Key type: octet (symmetric)
    "k": "base64-encoded-key-data-here",  // The actual key material
    "alg": "A256GCM",       // Algorithm: AES-256-GCM
    "use": "enc",           // Usage: encryption
    "key_ops": ["encrypt", "decrypt"]
  },
  "iv": [123, 45, 67, 89, 12, 34, 56, 78, 90, 11, 22, 33], // Initialization Vector (12 bytes)
  "description": "Patient X-Ray Results",
  "uploadDate": "2024-01-15T10:30:00Z",
  "sharedBy": "0x123...patient-address",
  "sharedWith": "0x742...doctor-address"
};

console.log("🔑 EXAMPLE SHARED KEY FORMAT:");
console.log(JSON.stringify(exampleSharedKey, null, 2));

// 5. HOW TO USE THE KEY FOR DECRYPTION
async function decryptFileAsDoctor(cid, doctorAddress) {
  try {
    // Step 1: Get the shared key for this file
    const keyId = `shared_key_${doctorAddress}_${cid}`;
    const storedKey = localStorage.getItem(keyId);
    
    if (!storedKey) {
      throw new Error("No decryption key found. Patient hasn't shared access yet.");
    }
    
    const sharedKeyData = JSON.parse(storedKey);
    console.log("✅ Found shared key:", sharedKeyData);
    
    // Step 2: Import the key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',                           // Format
      sharedKeyData.encryptionKey,     // JWK key data
      { name: 'AES-GCM', length: 256 }, // Algorithm
      true,                            // Extractable
      ['encrypt', 'decrypt']           // Usage
    );
    
    // Step 3: Get encrypted file from IPFS (mock)
    const encryptedData = await fetchFromIPFS(cid);
    
    // Step 4: Decrypt the file
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(sharedKeyData.iv)  // Convert IV array back to Uint8Array
      },
      cryptoKey,
      encryptedData
    );
    
    console.log("🎉 File decrypted successfully!");
    return decryptedData;
    
  } catch (error) {
    console.error("❌ Decryption failed:", error.message);
    throw error;
  }
}

// 6. MANUAL KEY INPUT FORMAT (for UI fallback)
const manualKeyInputExample = {
  "key": {
    "kty": "oct",
    "k": "base64-encoded-key-data-here",
    "alg": "A256GCM",
    "use": "enc",
    "key_ops": ["encrypt", "decrypt"]
  },
  "iv": [123, 45, 67, 89, 12, 34, 56, 78, 90, 11, 22, 33]
};

console.log("\n📝 MANUAL KEY INPUT FORMAT (for UI):");
console.log(JSON.stringify(manualKeyInputExample, null, 2));

// 7. PRACTICAL USAGE EXAMPLES
console.log("\n🔧 PRACTICAL USAGE:");
console.log("1. Doctor logs in with address: 0x742d35Cc6634C0532925a3b8D4C9db96590c4567");
console.log("2. Patient grants access via smart contract + shares keys");
console.log("3. Keys are stored as: shared_key_0x742d35Cc6634C0532925a3b8D4C9db96590c4567_{CID}");
console.log("4. Doctor clicks 'Download' - system automatically finds and uses the key");
console.log("5. If automatic fails, doctor can paste the key JSON manually");

// 8. DEBUGGING - CHECK AVAILABLE KEYS
function debugDoctorKeys(doctorAddress) {
  console.log(`\n🔍 DEBUGGING KEYS FOR DOCTOR: ${doctorAddress}`);
  
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`shared_key_${doctorAddress}_`)) {
      const keyData = JSON.parse(localStorage.getItem(key));
      allKeys.push({
        storageKey: key,
        cid: keyData.cid,
        description: keyData.description,
        sharedBy: keyData.sharedBy
      });
    }
  }
  
  if (allKeys.length === 0) {
    console.log("❌ No keys found. Patient needs to grant access first.");
  } else {
    console.log(`✅ Found ${allKeys.length} accessible files:`);
    allKeys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key.description} (CID: ${key.cid.slice(0, 10)}...)`);
    });
  }
  
  return allKeys;
}

// Mock IPFS fetch function
async function fetchFromIPFS(cid) {
  // In real implementation, this would fetch from IPFS
  console.log(`📥 Fetching encrypted file from IPFS: ${cid}`);
  return new ArrayBuffer(1024); // Mock encrypted data
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDoctorSharedKeys,
    decryptFileAsDoctor,
    debugDoctorKeys,
    exampleSharedKey,
    manualKeyInputExample
  };
}