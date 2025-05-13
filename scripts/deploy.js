
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Inclusive Banking Contracts...");
  console.log("----------------------------------------");

  
  const initialSupply = 100000000; 

  
  console.log("1. Deploying InclusiveBankToken...");
  const InclusiveBankToken = await hre.ethers.getContractFactory("InclusiveBankToken");
  const token = await InclusiveBankToken.deploy(initialSupply);
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log(`   ✓ InclusiveBankToken deployed to: ${tokenAddress}`);
  
  
  console.log("2. Deploying InclusiveBankingSystem...");
  const InclusiveBankingSystem = await hre.ethers.getContractFactory("InclusiveBankingSystem");
  const bankingSystem = await InclusiveBankingSystem.deploy(tokenAddress);
  await bankingSystem.waitForDeployment();
  
  const bankingSystemAddress = await bankingSystem.getAddress();
  console.log(`   ✓ InclusiveBankingSystem deployed to: ${bankingSystemAddress}`);
  
  
  console.log("3. Setting up initial allowance for testing...");
  const testAllowance = ethers.parseEther("1000000"); 
  await token.approve(bankingSystemAddress, testAllowance);
  console.log(`   ✓ Approved ${testAllowance.toString()} tokens for the banking system`);
  
  console.log("\nDeployment complete!");

  
  console.log("\nDeployment Information:");
  console.log("------------------------");
  console.log(`InclusiveBankToken Address: ${tokenAddress}`);
  console.log(`InclusiveBankingSystem Address: ${bankingSystemAddress}`);
  console.log(`Initial Supply: ${initialSupply} IBT`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Block Number: ${await hre.ethers.provider.getBlockNumber()}`);

  
  const deploymentInfo = {
    tokenAddress,
    bankingSystemAddress,
    network: hre.network.name,
    date: new Date().toISOString()
  };
  
  
  const addressRecorderJS = `
  
  
  (function() {
    try {
      localStorage.setItem('IBT_TOKEN_ADDRESS', '${tokenAddress}');
      localStorage.setItem('IBT_BANKING_ADDRESS', '${bankingSystemAddress}');
      localStorage.setItem('IBT_DEPLOYMENT_DATE', '${new Date().toISOString()}');
      console.log('Contract addresses recorded in localStorage');
    } catch (e) {
      console.error('Failed to record contract addresses:', e);
    }
  })();
  `;
  
  
  const addressRecorderPath = path.join(__dirname, '../frontend/public/addressRecorder.js');
  try {
    fs.writeFileSync(addressRecorderPath, addressRecorderJS);
    console.log(`\nContract addresses saved to ${addressRecorderPath}`);
  } catch (error) {
    console.error(`\nCould not write to ${addressRecorderPath}: ${error.message}`);
  }
  
  
  const deploymentInfoPath = path.join(__dirname, '../frontend/public/deploymentInfo.json');
  try {
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentInfoPath}`);
  } catch (error) {
    console.error(`Could not write to ${deploymentInfoPath}: ${error.message}`);
  }

  
  console.log("\nWaiting for block explorers to index the contracts...");
  
  
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerify token contract with:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress} ${initialSupply}`);
    
    console.log("\nVerify banking system contract with:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${bankingSystemAddress} ${tokenAddress}`);
  }
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 