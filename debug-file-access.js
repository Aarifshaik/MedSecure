// Debug File Access Issues
// Run this in browser console to diagnose the problem

const doctorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

console.log("=== DEBUGGING FILE ACCESS ===");

// 1. Check what files are in the database
console.log("\n1. FILES IN DATABASE:");
const files = JSON.parse(localStorage.getItem('files') || '[]');
console.log("Total files in database:", files.length);
files.forEach((file, index) => {
  console.log(`  ${index + 1}. CID: ${file.cid}, Patient: ${file.patientAddress}, Description: ${file.description}`);
});

// 2. Check shared keys available to doctor
console.log("\n2. SHARED KEYS FOR DOCTOR:");
const sharedKeys = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith(`shared_key_${doctorAddress}_`)) {
    const keyData = JSON.parse(localStorage.getItem(key));
    sharedKeys.push(keyData);
    console.log(`  - CID: ${keyData.cid}, Description: ${keyData.description}`);
  }
}

// 3. Check if there's a mismatch
console.log("\n3. MISMATCH ANALYSIS:");
const sharedCIDs = sharedKeys.map(k => k.cid);
const dbCIDs = files.map(f => f.cid);

console.log("CIDs in shared keys:", sharedCIDs);
console.log("CIDs in database:", dbCIDs);

const missingInDB = sharedCIDs.filter(cid => !dbCIDs.includes(cid));
const missingSharedKeys = dbCIDs.filter(cid => !sharedCIDs.includes(cid));

if (missingInDB.length > 0) {
  console.log("❌ CIDs with shared keys but NOT in database:", missingInDB);
}
if (missingSharedKeys.length > 0) {
  console.log("❌ CIDs in database but NO shared keys:", missingSharedKeys);
}

// 4. Check access grants
console.log("\n4. ACCESS GRANTS:");
const accessGrants = JSON.parse(localStorage.getItem('access_grants') || '[]');
console.log("Total access grants:", accessGrants.length);
accessGrants.forEach((grant, index) => {
  if (grant.grantedTo === doctorAddress) {
    console.log(`  ${index + 1}. Granted by: ${grant.patientAddress}`);
  }
});

// 5. Check shared keys table
console.log("\n5. SHARED KEYS TABLE:");
const sharedKeysTable = JSON.parse(localStorage.getItem('shared_keys') || '[]');
console.log("Total shared keys in table:", sharedKeysTable.length);
sharedKeysTable.forEach((sk, index) => {
  if (sk.sharedWith === doctorAddress) {
    console.log(`  ${index + 1}. File ID: ${sk.fileId}, Original Key ID: ${sk.originalKeyId}`);
  }
});

// 6. SOLUTION RECOMMENDATIONS
console.log("\n6. 🔧 SOLUTIONS:");
if (sharedKeys.length > 0 && files.length === 0) {
  console.log("❌ You have shared keys but no files in database");
  console.log("   → Patient needs to upload files first, then grant access");
}
if (files.length > 0 && sharedKeys.length === 0) {
  console.log("❌ Files exist but no shared keys");
  console.log("   → Patient needs to grant access to you");
}
if (missingInDB.length > 0) {
  console.log("❌ Shared keys exist but files missing from database");
  console.log("   → Database sync issue - files were deleted or not properly stored");
}

// 7. MANUAL DECRYPTION HELPER
if (sharedKeys.length > 0) {
  console.log("\n7. 📋 MANUAL DECRYPTION KEYS:");
  sharedKeys.forEach((keyData, index) => {
    const cleanKey = {
      key: keyData.encryptionKey,
      iv: keyData.iv
    };
    console.log(`\nFile ${index + 1}: ${keyData.description}`);
    console.log(`CID: ${keyData.cid}`);
    console.log("Manual key format:");
    console.log(JSON.stringify(cleanKey, null, 2));
  });
}