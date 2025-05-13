const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Inclusive Banking System", function () {
  let token;
  let bankingSystem;
  let owner;
  let user1;
  let user2;
  const initialSupply = 1000000;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    
    const InclusiveBankToken = await ethers.getContractFactory("InclusiveBankToken");
    token = await InclusiveBankToken.deploy(initialSupply);
    await token.waitForDeployment();
    
    
    const InclusiveBankingSystem = await ethers.getContractFactory("InclusiveBankingSystem");
    const tokenAddress = await token.getAddress();
    bankingSystem = await InclusiveBankingSystem.deploy(tokenAddress);
    await bankingSystem.waitForDeployment();
    
    
    await token.mint(user1.address, ethers.parseEther('10000'));
    await token.mint(user2.address, ethers.parseEther('10000'));
    
    
    await token.connect(user1).approve(await bankingSystem.getAddress(), ethers.parseEther('10000'));
    await token.connect(user2).approve(await bankingSystem.getAddress(), ethers.parseEther('10000'));
    
    console.log("Token deployed at:", await token.getAddress());
    console.log("Banking System deployed at:", await bankingSystem.getAddress());
  });

  it("should initialize with correct token reference", async function () {
    const tokenAddress = await token.getAddress();
    const bankingSystemTokenAddress = await bankingSystem.token();
    expect(bankingSystemTokenAddress).to.equal(tokenAddress);
  });

  it("should allow users to register", async function () {
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    
    
    const isRegistered = await bankingSystem.isRegistered(user1.address);
    expect(isRegistered).to.be.true;
    
    
    const profile = await bankingSystem.getUserProfile(user1.address);
    expect(profile[0]).to.equal("Alice"); 
    expect(profile[1]).to.equal("Baghdad"); 
    expect(profile[3]).to.be.true; 
  });

  it("should not allow duplicate registrations", async function () {
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    
    
    await expect(
      bankingSystem.connect(user1).registerUser("Alice2", "Basra")
    ).to.be.revertedWith("User already registered");
  });

  it("should allow deposits", async function () {
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    
    
    const depositAmount = ethers.parseEther('1000');
    await bankingSystem.connect(user1).deposit(depositAmount);
    
    
    const tx = await bankingSystem.getTransaction(0);
    expect(tx[0]).to.equal(user1.address); 
    expect(tx[2]).to.equal(depositAmount); 
    expect(tx[5]).to.equal(0); 
    
    
    const bankingSystemAddress = await bankingSystem.getAddress();
    const bankingSystemBalance = await token.balanceOf(bankingSystemAddress);
    expect(bankingSystemBalance).to.equal(depositAmount);
  });

  it("should allow withdrawals with fees", async function () {
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    
    
    const depositAmount = ethers.parseEther('1000');
    await bankingSystem.connect(user1).deposit(depositAmount);
    
    
    const withdrawAmount = ethers.parseEther('500');
    await bankingSystem.connect(user1).withdraw(withdrawAmount);
    
    
    const tx = await bankingSystem.getTransaction(1);
    const bankingSystemAddress = await bankingSystem.getAddress();
    expect(tx[0]).to.equal(bankingSystemAddress); 
    expect(tx[1]).to.equal(user1.address); 
    expect(tx[2]).to.equal(withdrawAmount); 
    expect(tx[5]).to.equal(1); 
    
    
    const expectedFee = withdrawAmount * BigInt(100) / BigInt(10000);
    expect(tx[3]).to.equal(expectedFee); 
    
    
    const expectedReceived = withdrawAmount - expectedFee;
    const initialBalance = ethers.parseEther('10000'); 
    const expectedBalance = initialBalance - depositAmount + expectedReceived;
    const userBalance = await token.balanceOf(user1.address);
    expect(userBalance).to.equal(expectedBalance);
  });

  it("should allow transfers between users with fees", async function () {
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    await bankingSystem.connect(user2).registerUser("Bob", "Erbil");
    
    
    const transferAmount = ethers.parseEther('300');
    await bankingSystem.connect(user1).transfer(user2.address, transferAmount);
    
    
    const txIndex = 0; 
    const tx = await bankingSystem.getTransaction(txIndex);
    expect(tx[0]).to.equal(user1.address); 
    expect(tx[1]).to.equal(user2.address); 
    expect(tx[2]).to.equal(transferAmount); 
    expect(tx[5]).to.equal(2); 
    
    
    const expectedFee = transferAmount * BigInt(50) / BigInt(10000);
    expect(tx[3]).to.equal(expectedFee); 
    
    
    const expectedReceived = transferAmount - expectedFee;
    const initialBalance = ethers.parseEther('10000'); 
    const expectedBalance = initialBalance + expectedReceived;
    const user2Balance = await token.balanceOf(user2.address);
    expect(user2Balance).to.equal(expectedBalance);
  });

  it("should allow the owner to update fee percentages", async function () {
    
    await bankingSystem.updateTransferFee(200);
    
    
    await bankingSystem.updateWithdrawalFee(300);
    
    
    const transferFee = await bankingSystem.transferFeePercentage();
    const withdrawalFee = await bankingSystem.withdrawalFeePercentage();
    
    expect(transferFee).to.equal(200);
    expect(withdrawalFee).to.equal(300);
  });

  it("should allow the owner to update user status", async function () {
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    
    
    await bankingSystem.updateUserStatus(user1.address, false);
    
    
    const profile = await bankingSystem.getUserProfile(user1.address);
    expect(profile[3]).to.be.false; 
    
    
    await expect(
      bankingSystem.connect(user1).deposit(ethers.parseEther('100'))
    ).to.be.revertedWith("Account inactive");
  });

  it("should allow the owner to pause token transfers", async function () {
    
    const bankingSystemAddress = await bankingSystem.getAddress();
    await token.transferOwnership(bankingSystemAddress);
    
    
    await bankingSystem.pauseTokenTransfers();
    
    
    await expect(
      token.transfer(user1.address, ethers.parseEther('100'))
    ).to.be.reverted; 
    
    
    await bankingSystem.unpauseTokenTransfers();
    
    
    await token.transfer(user1.address, ethers.parseEther('100'));
    
    
    const balance = await token.balanceOf(user1.address);
    const expectedBalance = ethers.parseEther('10100'); 
    expect(balance).to.equal(expectedBalance);
  });
});