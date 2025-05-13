const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VoucherManager contract...");

  
  const tokenContract = await ethers.getContract("InclusiveBankToken");
  const tokenAddress = await tokenContract.getAddress();
  console.log(`InclusiveBankToken address: ${tokenAddress}`);

  
  const bankingSystem = await ethers.getContract("InclusiveBankingSystem");
  const bankingSystemAddress = await bankingSystem.getAddress();
  console.log(`InclusiveBankingSystem address: ${bankingSystemAddress}`);

  
  const VoucherManager = await ethers.getContractFactory("VoucherManager");
  const voucherManager = await VoucherManager.deploy(tokenAddress);
  await voucherManager.waitForDeployment();
  
  const voucherManagerAddress = await voucherManager.getAddress();
  console.log(`VoucherManager contract deployed to: ${voucherManagerAddress}`);

  
  console.log("Setting VoucherManager in InclusiveBankingSystem...");
  const tx = await bankingSystem.setVoucherManager(voucherManagerAddress);
  await tx.wait();
  console.log("VoucherManager set successfully in InclusiveBankingSystem!");

  console.log("Deployment complete!");
  
  
  const fs = require("fs");
  const contractAddresses = {
    tokenContract: tokenAddress,
    bankingSystem: bankingSystemAddress,
    voucherManager: voucherManagerAddress
  };
  
  fs.writeFileSync(
    "voucher-manager-address.json",
    JSON.stringify(contractAddresses, null, 2)
  );
  
  console.log("Contract addresses saved to voucher-manager-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 