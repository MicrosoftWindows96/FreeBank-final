
const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");


const DEMO_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; 
const DEMO_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; 


const RECIPIENTS = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906", 
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"  
];


const TRANSACTION_TYPES = {
  DEPOSIT: "deposit",
  WITHDRAW: "withdraw",
  TRANSFER: "transfer"
};


const DESCRIPTIONS = {
  [TRANSACTION_TYPES.DEPOSIT]: [
    "Salary Deposit",
    "Savings Deposit",
    "Investment Return",
    "Refund"
  ],
  [TRANSACTION_TYPES.WITHDRAW]: [
    "ATM Withdrawal",
    "Bill Payment",
    "Purchase",
    "Service Fee"
  ],
  [TRANSACTION_TYPES.TRANSFER]: [
    "Payment to Friend",
    "Family Support",
    "Rent Payment",
    "Business Expense"
  ]
};


function randomAmount() {
  
  const denominations = [250, 500, 1000, 5000, 10000, 25000];
  
  
  const numberOfBills = Math.floor(Math.random() * 10) + 1;
  
  
  const denomination = denominations[Math.floor(Math.random() * 4)]; 
  
  
  return denomination * numberOfBills;
}


function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}


function randomDate() {
  const now = new Date();
  
  const daysAgo = Math.floor(Math.random() * 30) + 30;
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


async function incrementBlockchainTimestamp(provider) {
  
  const currentBlock = await provider.getBlock("latest");
  const timestamp = currentBlock.timestamp + 60; 
  
  
  await provider.send("evm_setNextBlockTimestamp", [timestamp]);
  
  
  await provider.send("evm_mine", []);
  
  return timestamp;
}


async function generateDisplayDates(count) {
  
  const now = new Date();
  
  
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  let baseTimestamp = Math.floor(twoMonthsAgo.getTime() / 1000);
  
  const dates = [];
  
  for (let i = 0; i < count; i++) {
    
    const incrementSeconds = 3600 + Math.floor(Math.random() * 43200);
    baseTimestamp += incrementSeconds;
    
    
    if (baseTimestamp > Math.floor(now.getTime() / 1000)) {
      
      baseTimestamp = Math.floor(twoMonthsAgo.getTime() / 1000) + 
                     Math.floor(Math.random() * (now.getTime() - twoMonthsAgo.getTime()) / 1000 / 2);
    }
    
    dates.push(new Date(baseTimestamp * 1000));
  }
  
  
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

async function main() {
  console.log("Generating demo transactions for Inclusive Banking app...");
  console.log("--------------------------------------------------------");

  
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

  
  const demoWallet = new ethers.Wallet(DEMO_PRIVATE_KEY, provider);
  console.log(`Using demo account: ${demoWallet.address}`);

  
  const InclusiveBankToken = await ethers.getContractFactory("InclusiveBankToken");
  const token = InclusiveBankToken.attach(tokenAddress);
  const tokenWithDemo = token.connect(demoWallet);

  const InclusiveBankingSystem = await ethers.getContractFactory("InclusiveBankingSystem");
  const bankingSystem = InclusiveBankingSystem.attach(bankingSystemAddress);
  const bankingWithDemo = bankingSystem.connect(demoWallet);

  
  const demoBalance = await token.balanceOf(DEMO_ADDRESS);
  console.log(`Demo account initial balance: ${ethers.formatEther(demoBalance)} IBT`);

  console.log("Setting up higher daily transfer limit...");
  
  
  const newLimit = ethers.parseEther("10000000");  
  console.log(`Setting daily transfer limit to ${ethers.formatEther(newLimit)} IBT`);
  await tokenWithDemo.setDailyTransferLimit(newLimit);

  
  console.log("Making initial deposit to banking system...");
  try {
    const initialDeposit = ethers.parseEther("50000000"); 
    console.log(`Making initial deposit of ${ethers.formatEther(initialDeposit)} IBT to banking system`);
    
    
    console.log(`Approving initial deposit of ${ethers.formatEther(initialDeposit)} IBT...`);
    const approveTx = await tokenWithDemo.approve(bankingSystemAddress, initialDeposit);
    await approveTx.wait();
    
    
    console.log(`Depositing ${ethers.formatEther(initialDeposit)} IBT to banking system...`);
    const initialDepositTx = await bankingWithDemo.deposit(initialDeposit);
    await initialDepositTx.wait();
    console.log(`Successfully deposited ${ethers.formatEther(initialDeposit)} IBT to banking system`);
  } catch (error) {
    console.error("Error making initial deposit:", error.message);
  }

  
  console.log("\nEnsuring recipient accounts are registered...");
  for (const recipient of RECIPIENTS) {
    const isRegistered = await bankingSystem.isRegistered(recipient);
    if (!isRegistered) {
      try {
        
        const recipientWallet = new ethers.Wallet(
          
          
          [
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
            "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
            "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
          ][RECIPIENTS.indexOf(recipient)],
          provider
        );
        
        console.log(`Registering ${recipient}...`);
        const registerTx = await bankingSystem.connect(recipientWallet).registerUser(
          `Test User ${RECIPIENTS.indexOf(recipient) + 1}`,
          "Test Region"
        );
        await registerTx.wait();
        
        
        console.log(`Funding ${recipient} with IBT...`);
        const fundAmount = ethers.parseEther("20000");  
        
        
        let success = false;
        let attempts = 0;
        let currentAmount = fundAmount;
        
        while (!success && attempts < 3) {
          try {
            const transferTx = await token.transfer(recipient, currentAmount);
            await transferTx.wait();
            console.log(`Successfully funded ${recipient} with ${ethers.formatEther(currentAmount)} IBT`);
            success = true;
          } catch (error) {
            attempts++;
            if (attempts < 3) {
              console.log(`Transfer failed, reducing amount and retrying...`);
              currentAmount = ethers.parseEther((parseInt(ethers.formatEther(currentAmount)) / 2).toString());
              
              await sleep(200);
            } else {
              console.error(`Failed to fund ${recipient} after 3 attempts: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing recipient ${recipient}: ${error.message}`);
        console.log(`Continuing with next recipient...`);
      }
    } else {
      console.log(`Account ${recipient} already registered`);
      
      
      const balance = await token.balanceOf(recipient);
      if (balance < ethers.parseEther("10000")) {  
        try {
          console.log(`Topping up ${recipient} with IBT...`);
          const fundAmount = ethers.parseEther("20000");  
          
          
          let success = false;
          let attempts = 0;
          let currentAmount = fundAmount;
          
          while (!success && attempts < 3) {
            try {
              const transferTx = await token.transfer(recipient, currentAmount);
              await transferTx.wait();
              console.log(`Successfully topped up ${recipient} with ${ethers.formatEther(currentAmount)} IBT`);
              success = true;
            } catch (error) {
              attempts++;
              if (attempts < 3) {
                console.log(`Transfer failed, reducing amount and retrying...`);
                currentAmount = ethers.parseEther((parseInt(ethers.formatEther(currentAmount)) / 2).toString());
                
                await sleep(200);
              } else {
                console.error(`Failed to top up ${recipient} after 3 attempts: ${error.message}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error funding ${recipient}: ${error.message}`);
        }
      } else {
        console.log(`Account ${recipient} already has ${ethers.formatEther(balance)} IBT`);
      }
    }
    
    
    await sleep(300);
  }

  
  console.log("\nGenerating transactions...");
  const numTransactions = 100; 
  
  
  console.log("Generating display dates for transactions...");
  const displayDates = await generateDisplayDates(numTransactions);

  
  for (let i = 0; i < numTransactions; i++) {
    
    const transactionTypes = [TRANSACTION_TYPES.DEPOSIT, TRANSACTION_TYPES.WITHDRAW, TRANSACTION_TYPES.TRANSFER];
    const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    
    try {
      
      const amountInIQD = randomAmount();
      const amount = ethers.parseEther(amountInIQD.toString());  
      const description = randomElement(DESCRIPTIONS[transactionType]);
      const displayDate = displayDates[i]; 
      const recipient = randomElement(RECIPIENTS);
      
      console.log(`\nTransaction ${i+1}/${numTransactions}:`);
      console.log(`Type: ${transactionType}`);
      console.log(`Description: ${description}`);
      console.log(`Amount: ${ethers.formatEther(amount)} IBT (${amountInIQD} IQD)`);
      console.log(`Display Date: ${displayDate.toLocaleDateString()} at ${displayDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
      
      
      await incrementBlockchainTimestamp(provider);

      let receipt;
      let success = false;
      let attempts = 0;
      let currentAmount = amount;
      
      
      while (!success && attempts < 3) {
        try {
          
          if (transactionType === TRANSACTION_TYPES.DEPOSIT || transactionType === TRANSACTION_TYPES.TRANSFER) {
            console.log(`Approving tokens (${ethers.formatEther(currentAmount)} IBT)...`);
            const approveTx = await tokenWithDemo.approve(bankingSystemAddress, currentAmount);
            await approveTx.wait();
          }
          
          if (transactionType === TRANSACTION_TYPES.DEPOSIT) {
            console.log(`Depositing to banking contract...`);
            const depositTx = await bankingWithDemo.deposit(currentAmount);
            receipt = await depositTx.wait();
          } else if (transactionType === TRANSACTION_TYPES.WITHDRAW) {
            console.log(`Withdrawing from banking contract...`);
            const withdrawTx = await bankingWithDemo.withdraw(currentAmount);
            receipt = await withdrawTx.wait();
          } else if (transactionType === TRANSACTION_TYPES.TRANSFER) {
            console.log(`Transferring to ${recipient}...`);
            const transferTx = await bankingWithDemo.transfer(recipient, currentAmount);
            receipt = await transferTx.wait();
          }
          
          console.log(`Transaction successful! Hash: ${receipt.hash}`);
          success = true;
        } catch (error) {
          attempts++;
          console.error(`Attempt ${attempts} failed:`, error.message);
          
          if (attempts < 3) {
            console.log(`Transfer failed, reducing amount and retrying...`);
            currentAmount = ethers.parseEther((parseInt(ethers.formatEther(currentAmount)) / 2).toString());
            
            await sleep(200);
          } else {
            console.error(`Failed after 3 attempts. Skipping to next transaction...`);
          }
        }
      }
      
      
      await sleep(500);
    } catch (error) {
      console.error(`Transaction setup failed:`, error.message);
      console.log(`Skipping to next transaction...`);
      await sleep(500);
    }
  }
  
  
  const finalBalance = await token.balanceOf(DEMO_ADDRESS);
  console.log(`\nDemo account final balance: ${ethers.formatEther(finalBalance)} IBT`);
  
  console.log("\nDemo transactions generation complete!");
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 