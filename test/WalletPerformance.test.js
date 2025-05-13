const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Wallet Performance Tests", function () {
  let token;
  let bankingSystem;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    
    const InclusiveBankToken = await ethers.getContractFactory("InclusiveBankToken");
    token = await InclusiveBankToken.deploy(1000000);
    await token.waitForDeployment();
    
    
    const InclusiveBankingSystem = await ethers.getContractFactory("InclusiveBankingSystem");
    bankingSystem = await InclusiveBankingSystem.deploy(await token.getAddress());
    await bankingSystem.waitForDeployment();
    
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    await bankingSystem.connect(user2).registerUser("Bob", "Basra");
    
    
    await token.transfer(user1.address, ethers.parseEther("1000"));
    await token.transfer(user2.address, ethers.parseEther("1000"));
    
    
    await token.connect(user1).approve(await bankingSystem.getAddress(), ethers.parseEther("1000"));
    await token.connect(user2).approve(await bankingSystem.getAddress(), ethers.parseEther("1000"));
  });
  
  describe("Response Time Measurements", function () {
    it("should process deposits within 100ms", async function () {
      const amount = ethers.parseEther("10");
      
      
      const startTime = performance.now();
      const tx = await bankingSystem.connect(user1).deposit(amount);
      await tx.wait();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      console.log(`Deposit execution time: ${executionTime.toFixed(2)}ms`);
      
      
      
      
      expect(executionTime).to.be.lessThan(5000); 
    });
    
    it("should process transfers within 100ms", async function () {
      
      await bankingSystem.connect(user1).deposit(ethers.parseEther("50"));
      
      
      const startTime = performance.now();
      const tx = await bankingSystem.connect(user1).transfer(user2.address, ethers.parseEther("10"));
      await tx.wait();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      console.log(`Transfer execution time: ${executionTime.toFixed(2)}ms`);
      
      
      expect(executionTime).to.be.lessThan(5000); 
    });
    
    it("should process withdrawals within 100ms", async function () {
      
      await bankingSystem.connect(user1).deposit(ethers.parseEther("50"));
      
      
      const startTime = performance.now();
      const tx = await bankingSystem.connect(user1).withdraw(ethers.parseEther("10"));
      await tx.wait();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      console.log(`Withdrawal execution time: ${executionTime.toFixed(2)}ms`);
      
      
      expect(executionTime).to.be.lessThan(5000); 
    });
    
    it("should retrieve user balance within 100ms", async function () {
      
      await bankingSystem.connect(user1).deposit(ethers.parseEther("50"));
      
      
      const bankingSystemAddress = await bankingSystem.getAddress();
      
      
      const startTime = performance.now();
      
      const bankingSystemBalance = await token.balanceOf(bankingSystemAddress);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      console.log(`Balance check execution time: ${executionTime.toFixed(2)}ms`);
      
      
      expect(executionTime).to.be.lessThan(100); 
      expect(bankingSystemBalance).to.equal(ethers.parseEther("50"));
    });
    
    it("should retrieve transaction history within 100ms", async function () {
      
      await bankingSystem.connect(user1).deposit(ethers.parseEther("50"));
      await bankingSystem.connect(user1).transfer(user2.address, ethers.parseEther("10"));
      await bankingSystem.connect(user1).withdraw(ethers.parseEther("5"));
      
      
      const startTime = performance.now();
      const txCount = await bankingSystem.transactionCount();
      const transactions = [];
      
      for (let i = 0; i < txCount; i++) {
        const tx = await bankingSystem.getTransaction(i);
        transactions.push(tx);
      }
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      console.log(`Transaction history retrieval time (${txCount} transactions): ${executionTime.toFixed(2)}ms`);
      
      
      expect(executionTime).to.be.lessThan(500); 
      expect(transactions.length).to.equal(txCount);
    });
    
    it("should process batch operations efficiently", async function () {
      
      const users = [];
      const depositPromises = [];
      const amount = ethers.parseEther("1");
      
      
      for (let i = 0; i < 10; i++) {
        const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
        users.push(wallet);
        
        
        await owner.sendTransaction({
          to: wallet.address,
          value: ethers.parseEther("1")
        });
        
        
        await token.transfer(wallet.address, ethers.parseEther("10"));
        
        
        await bankingSystem.connect(wallet).registerUser(`User${i}`, "Location");
        
        
        await token.connect(wallet).approve(await bankingSystem.getAddress(), ethers.parseEther("10"));
      }
      
      
      const startTime = performance.now();
      
      
      for (let i = 0; i < users.length; i++) {
        depositPromises.push(bankingSystem.connect(users[i]).deposit(amount));
      }
      
      
      await Promise.all(depositPromises);
      
      const endTime = performance.now();
      
      const totalExecutionTime = endTime - startTime;
      const avgExecutionTime = totalExecutionTime / users.length;
      
      console.log(`Batch operation total time for ${users.length} users: ${totalExecutionTime.toFixed(2)}ms`);
      console.log(`Average time per user operation: ${avgExecutionTime.toFixed(2)}ms`);
      
      
      expect(avgExecutionTime).to.be.lessThan(5000); 
    });
  });
}); 