
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");




const DEMO_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; 
const DEMO_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; 

async function main() {
  console.log("Setting up demo account for Inclusive Banking app...");
  console.log("----------------------------------------------------");

  
  let tokenAddress, bankingSystemAddress;
  try {
    const deploymentInfoPath = path.join(__dirname, '../frontend/public/deploymentInfo.json');
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    tokenAddress = deploymentInfo.tokenAddress;
    bankingSystemAddress = deploymentInfo.bankingSystemAddress;
  } catch (error) {
    console.error("Could not read deployment info. Make sure to run deploy.js first:", error);
    process.exit(1);
  }

  console.log(`Using token address: ${tokenAddress}`);
  console.log(`Using banking system address: ${bankingSystemAddress}`);

  
  const provider = ethers.provider;
  
  
  try {
    await provider.getBlockNumber();
  } catch (error) {
    console.error("Cannot connect to local network. Make sure Hardhat node is running.");
    process.exit(1);
  }

  
  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer account: ${deployer.address}`);

  
  const InclusiveBankToken = await ethers.getContractFactory("InclusiveBankToken");
  const token = InclusiveBankToken.attach(tokenAddress);

  const InclusiveBankingSystem = await ethers.getContractFactory("InclusiveBankingSystem");
  const bankingSystem = InclusiveBankingSystem.attach(bankingSystemAddress);

  
  console.log(`\n1. Funding demo account (${DEMO_ADDRESS}) with tokens...`);
  
  
  const tokenAmount = ethers.parseEther("10000");
  const transferTx = await token.transfer(DEMO_ADDRESS, tokenAmount);
  await transferTx.wait();
  console.log(`   ✓ Transferred ${ethers.formatEther(tokenAmount)} IBT to demo account`);

  
  const demoBalance = await token.balanceOf(DEMO_ADDRESS);
  console.log(`   ✓ Demo account balance: ${ethers.formatEther(demoBalance)} IBT`);

  
  console.log(`\n2. Registering demo account in banking system...`);
  
  
  const demoWallet = new ethers.Wallet(DEMO_PRIVATE_KEY, provider);
  const tokenWithDemo = token.connect(demoWallet);
  const bankingWithDemo = bankingSystem.connect(demoWallet);
  
  
  const isRegistered = await bankingSystem.isRegistered(DEMO_ADDRESS);
  
  if (isRegistered) {
    console.log(`   ✓ Demo account already registered`);
  } else {
    
    const registerTx = await bankingWithDemo.registerUser("Demo User", "Demo Region");
    await registerTx.wait();
    console.log(`   ✓ Registered demo account in banking system`);
  }

  
  console.log(`\n3. Approving banking system to use demo account tokens...`);
  const approveTx = await tokenWithDemo.approve(bankingSystemAddress, tokenAmount);
  await approveTx.wait();
  console.log(`   ✓ Approved banking system to spend demo account tokens`);

  
  console.log(`\n4. Saving demo account info for frontend...`);
  
  const demoInfo = {
    address: DEMO_ADDRESS,
    privateKey: DEMO_PRIVATE_KEY,
    initialBalance: ethers.formatEther(demoBalance),
    isRegistered: isRegistered || true 
  };
  
  
  const demoInfoJS = `
  
  
  (function() {
    try {
      localStorage.setItem('DEMO_WALLET_ADDRESS', '${DEMO_ADDRESS}');
      localStorage.setItem('DEMO_WALLET_PRIVATE_KEY', '${DEMO_PRIVATE_KEY}');
      localStorage.setItem('DEMO_WALLET_INITIAL_BALANCE', '${ethers.formatEther(demoBalance)}');
      localStorage.setItem('DEMO_WALLET_IS_REGISTERED', 'true');
      console.log('Demo wallet info stored in localStorage');
    } catch (e) {
      console.error('Failed to store demo wallet info:', e);
    }
  })();
  `;
  
  const demoInfoPath = path.join(__dirname, '../frontend/public/demoWalletInfo.js');
  try {
    fs.writeFileSync(demoInfoPath, demoInfoJS);
    console.log(`   ✓ Demo wallet info saved to ${demoInfoPath}`);
  } catch (error) {
    console.error(`   ✗ Could not write to ${demoInfoPath}: ${error.message}`);
  }

  console.log("\nDemo account setup complete!");
  console.log("-----------------------------");
  console.log(`Demo Address: ${DEMO_ADDRESS}`);
  console.log(`Initial Balance: ${ethers.formatEther(demoBalance)} IBT`);
  console.log(`Is Registered: ${isRegistered || true}`);
  console.log("\nYou can now use the demo account functionality in the app.");
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 