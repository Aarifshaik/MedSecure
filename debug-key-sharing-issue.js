// Debug Key Sharing Issue
// Run this to understand why keys aren't being shared properly

const doctorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const patientAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"; // From your shared key data

console.log("=== DEBUGGING KEY SHARING ISSUE ===");

// 1. Check what the PrototypeKeySharing.getAllPatientKeys is looking for
console.log("\n1. WHAT PROTOTYPE KEY SHARING LOOKS FOR:");
console.log("- Looking for keys with prefix: 'encryption_key_'");

let foundOldFormatKeys = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('encryption_key_')) {
    const keyData = JSON.parse(localStorage.getItem(key) || '{}');
    foundOldFormatKeys.push({ storageKey: key, data: keyData });
  }
}

console.log("Found old format keys:", foundOldFormatKeys.length);
foundOldFormatKeys.forEach(k => console.log("  -", k.storageKey));

// 2. Check what's actually in the database
console.log("\n2. WHAT'S ACTUALLY IN DATABASE:");
const encryptionKeys = JSON.parse(localStorage.getItem('encryption_keys') || '[]');
console.log("Encryption keys in database:", encryptionKeys.length);
encryptionKeys.forEach((key, index) => {
  console.log(`  ${index + 1}. File ID: ${key.fileId}, Created by: ${key.createdBy}`);
});

// 3. Check files in database
console.log("\n3. FILES IN DATABASE:");
const files = JSON.parse(localStorage.getItem('files') || '[]');
console.log("Files in database:", files.length);
files.forEach((file, index) => {
  console.log(`  ${index + 1}. CID: ${file.cid}, Patient: ${file.patientAddress}, Description: ${file.description}`);
});

// 4. The REAL problem: PrototypeKeySharing is using wrong storage format
console.log("\n4. 🔍 THE REAL PROBLEM:");
console.log("❌ PrototypeKeySharing looks for: 'encryption_key_*'");
console.log("✅ But keys are stored in: 'encryption_keys' table");
console.log("❌ PrototypeKeySharing doesn't filter by patient");
console.log("✅ But it should only share keys for files owned by the patient");

// 5. CORRECT WAY TO GET PATIENT KEYS
console.log("\n5. 🔧 CORRECT WAY TO GET PATIENT KEYS:");

function getCorrectPatientKeys(patientAddress) {
  const patientKeys = [];
  
  // Get files owned by this patient
  const patientFiles = files.filter(f => f.patientAddress === patientAddress);
  console.log(`Patient ${patientAddress} owns ${patientFiles.length} files`);
  
  // Get encryption keys for those files
  patientFiles.forEach(file => {
    const keyForFile = encryptionKeys.find(k => k.fileId === file.id);
    if (keyForFile) {
      patientKeys.push({
        cid: file.cid,
        key: keyForFile.keyData,
        iv: keyForFile.iv,
        description: file.description,
        uploadDate: file.uploadDate || new Date().toISOString()
      });
    }
  });
  
  return patientKeys;
}

const correctKeys = getCorrectPatientKeys(patientAddress);
console.log("Correct patient keys found:", correctKeys.length);
correctKeys.forEach((key, index) => {
  console.log(`  ${index + 1}. CID: ${key.cid}, Description: ${key.description}`);
});

// 6. MANUAL FIX - Share the correct keys
console.log("\n6. 🛠️ MANUAL FIX:");
if (correctKeys.length > 0) {
  console.log("Manually sharing correct keys...");
  
  correctKeys.forEach(keyData => {
    const sharedKey = {
      cid: keyData.cid,
      encryptionKey: keyData.key,
      iv: keyData.iv,
      description: keyData.description,
      uploadDate: keyData.uploadDate,
      sharedBy: patientAddress,
      sharedWith: doctorAddress
    };
    
    const sharedKeyId = `shared_key_${doctorAddress}_${keyData.cid}`;
    localStorage.setItem(sharedKeyId, JSON.stringify(sharedKey));
    console.log(`✅ Shared key for: ${keyData.description} (${keyData.cid})`);
  });
  
  console.log("\n🎉 MANUAL KEY SHARING COMPLETE!");
  console.log("Now try downloading the files again.");
} else {
  console.log("❌ No keys found to share");
}