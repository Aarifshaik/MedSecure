const hre = require("hardhat");

async function main() {
    const [deployer, doctor, researcher] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Doctor address:", doctor.address);
    console.log("Researcher address:", researcher.address);

    const PatientDataSharing = await hre.ethers.getContractFactory("PatientDataSharing");
    const contract = await PatientDataSharing.deploy(doctor.address, researcher.address);

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log("PatientDataSharing deployed to:", contractAddress);

    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        contractAddress: contractAddress,
        doctorAddress: doctor.address,
        researcherAddress: researcher.address,
        deployerAddress: deployer.address
    };

    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to deployment.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});