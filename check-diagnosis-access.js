// Check if doctor has access to the diagnosis file
const doctorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const diagnosisCID = "Qmyoyhkjmfwg1tg9000000000000000000000000000000";

console.log("=== CHECKING ACCESS TO DIAGNOSIS FILE ===");

// Check if there's a shared key for the diagnosis file
const diagnosisKeyId = `shared_key_${doctorAddress}_${diagnosisCID}`;
const diagnosisKey = localStorage.getItem(diagnosisKeyId);

if (diagnosisKey) {
  console.log("✅ You HAVE access to the diagnosis file!");
  const keyData = JSON.parse(diagnosisKey);
  console.log("Key data:", keyData);
  
  // Generate clean key for manual input
  const cleanKey = {
    key: keyData.encryptionKey,
    iv: keyData.iv
  };
  
  console.log("\n📋 MANUAL KEY FOR DIAGNOSIS FILE:");
  console.log(JSON.stringify(cleanKey, null, 2));
  
} else {
  console.log("❌ You DON'T have access to the diagnosis file");
  console.log("The patient needs to grant you access to this file first");
  
  // Check what files you DO have access to
  console.log("\n📁 FILES YOU CAN ACCESS:");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`shared_key_${doctorAddress}_`)) {
      const keyData = JSON.parse(localStorage.getItem(key));
      console.log(`- CID: ${keyData.cid}`);
      console.log(`  Description: ${keyData.description}`);
      console.log(`  Shared by: ${keyData.sharedBy}`);
    }
  }
}

// Also check the database for the diagnosis file details
console.log("\n🗃️ DIAGNOSIS FILE IN DATABASE:");
const files = JSON.parse(localStorage.getItem('files') || '[]');
const diagnosisFile = files.find(f => f.cid === diagnosisCID);
if (diagnosisFile) {
  console.log("File found:", diagnosisFile);
  console.log("Patient address:", diagnosisFile.patientAddress);
} else {
  console.log("Diagnosis file not found in database");
}