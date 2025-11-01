// Extract Key Data for Manual Input
// Run this in browser console to get the clean key format

const doctorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const cid = "Qmnq0ql10x10cn02y8mplsjc";

// Get the full shared key data
const keyId = `shared_key_${doctorAddress}_${cid}`;
const fullKeyData = JSON.parse(localStorage.getItem(keyId));

console.log("=== FULL KEY DATA ===");
console.log(fullKeyData);

// Extract ONLY what you need for manual decryption
const cleanKeyForManualInput = {
  key: fullKeyData.encryptionKey,  // This is the JWK format
  iv: fullKeyData.iv               // This is the IV array
};

console.log("\n=== CLEAN KEY FOR MANUAL INPUT ===");
console.log("Copy this JSON and paste it in the manual key input field:");
console.log(JSON.stringify(cleanKeyForManualInput, null, 2));

// Also show it as a single line (easier to copy)
console.log("\n=== SINGLE LINE FORMAT ===");
console.log(JSON.stringify(cleanKeyForManualInput));

// Verify the key structure
console.log("\n=== KEY VERIFICATION ===");
console.log("✅ Key type:", fullKeyData.encryptionKey.kty);
console.log("✅ Algorithm:", fullKeyData.encryptionKey.alg);
console.log("✅ IV length:", fullKeyData.iv.length, "bytes");
console.log("✅ Key operations:", fullKeyData.encryptionKey.key_ops);