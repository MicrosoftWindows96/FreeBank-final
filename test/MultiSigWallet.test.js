
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  let MultiSigWallet;
  let multiSigWallet;
  let InclusiveBankToken;
  let token;
  let owner1;
  let owner2;
  let owner3;
  let nonOwner;
  let owners;
  const numConfirmationsRequired = 2;
  
  
  beforeEach(async function () {
    [owner1, owner2, owner3, nonOwner] = await ethers.getSigners();
    owners = [owner1.address, owner2.address, owner3.address];
    
    
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy(owners, numConfirmationsRequired);
    await multiSigWallet.waitForDeployment();
    
    
    InclusiveBankToken = await ethers.getContractFactory("InclusiveBankToken");
    token = await InclusiveBankToken.deploy(1000000);
    await token.waitForDeployment();
    
    
    await token.transfer(await multiSigWallet.getAddress(), ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("should set the correct owners", async function () {
      const walletOwners = await multiSigWallet.getOwners();
      expect(walletOwners.length).to.equal(owners.length);
      
      for (let i = 0; i < owners.length; i++) {
        expect(walletOwners[i]).to.equal(owners[i]);
        expect(await multiSigWallet.isOwner(owners[i])).to.be.true;
      }
    });
    
    it("should set the correct number of required confirmations", async function () {
      expect(await multiSigWallet.numConfirmationsRequired()).to.equal(numConfirmationsRequired);
    });
    
    it("should reject invalid constructor parameters", async function () {
      
      await expect(
        MultiSigWallet.deploy([], 1)
      ).to.be.revertedWith("owners required");
      
      
      await expect(
        MultiSigWallet.deploy([owner1.address, owner1.address], 1)
      ).to.be.revertedWith("owner not unique");
      
      
      await expect(
        MultiSigWallet.deploy([owner1.address, owner2.address], 0)
      ).to.be.revertedWith("invalid number of required confirmations");
      
      
      await expect(
        MultiSigWallet.deploy([owner1.address, owner2.address], 3)
      ).to.be.revertedWith("invalid number of required confirmations");
      
      
      await expect(
        MultiSigWallet.deploy([owner1.address, ethers.ZeroAddress], 1)
      ).to.be.revertedWith("invalid owner");
    });
  });

  describe("Transactions", function () {
    it("should allow an owner to submit a transaction", async function () {
      const to = nonOwner.address;
      const value = ethers.parseEther("0.1");
      const data = "0x";
      
      await expect(multiSigWallet.submitTransaction(to, value, data))
        .to.emit(multiSigWallet, "SubmitTransaction")
        .withArgs(owner1.address, 0, to, value, data);
        
      const [txTo, txValue, txData, txExecuted, txConfirmations] = await multiSigWallet.getTransaction(0);
      
      expect(txTo).to.equal(to);
      expect(txValue).to.equal(value);
      expect(txData).to.equal(data);
      expect(txExecuted).to.be.false;
      expect(txConfirmations).to.equal(0);
    });
    
    it("should not allow non-owners to submit transactions", async function () {
      await expect(
        multiSigWallet.connect(nonOwner).submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x")
      ).to.be.revertedWith("not owner");
    });
    
    it("should allow owners to confirm transactions", async function () {
      const to = nonOwner.address;
      const value = ethers.parseEther("0.1");
      const data = "0x";
      
      await multiSigWallet.submitTransaction(to, value, data);
      
      await expect(multiSigWallet.confirmTransaction(0))
        .to.emit(multiSigWallet, "ConfirmTransaction")
        .withArgs(owner1.address, 0);
        
      const [, , , , txConfirmations] = await multiSigWallet.getTransaction(0);
      expect(txConfirmations).to.equal(1);
      expect(await multiSigWallet.isConfirmed(0, owner1.address)).to.be.true;
    });
    
    it("should not allow confirming non-existent transactions", async function () {
      await expect(
        multiSigWallet.confirmTransaction(0)
      ).to.be.revertedWith("tx does not exist");
    });
    
    it("should not allow confirming already confirmed transactions", async function () {
      await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      await multiSigWallet.confirmTransaction(0);
      
      await expect(
        multiSigWallet.confirmTransaction(0)
      ).to.be.revertedWith("tx already confirmed");
    });
    
    it("should not allow non-owners to confirm transactions", async function () {
      await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      
      await expect(
        multiSigWallet.connect(nonOwner).confirmTransaction(0)
      ).to.be.revertedWith("not owner");
    });
    
    it("should execute a transaction once threshold confirmations are reached", async function () {
      
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther("1.0")
      });
      
      const to = nonOwner.address;
      const value = ethers.parseEther("0.1");
      const data = "0x";
      const initialBalance = await ethers.provider.getBalance(to);
      
      await multiSigWallet.submitTransaction(to, value, data);
      await multiSigWallet.confirmTransaction(0);
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      
      const tx = await multiSigWallet.executeTransaction(0);
      await expect(tx)
        .to.emit(multiSigWallet, "ExecuteTransaction")
        .withArgs(owner1.address, 0);
      
      
      const [, , , txExecuted, ] = await multiSigWallet.getTransaction(0);
      expect(txExecuted).to.be.true;
      
      
      const finalBalance = await ethers.provider.getBalance(to);
      expect(finalBalance - initialBalance).to.equal(value);
    });
    
    it("should not execute if confirmations threshold not met", async function () {
      await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      await multiSigWallet.confirmTransaction(0);
      
      await expect(
        multiSigWallet.executeTransaction(0)
      ).to.be.revertedWith("cannot execute tx");
    });
    
    it("should not execute already executed transactions", async function () {
      
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther("1.0")
      });
      
      await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      await multiSigWallet.confirmTransaction(0);
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      await multiSigWallet.executeTransaction(0);
      
      await expect(
        multiSigWallet.executeTransaction(0)
      ).to.be.revertedWith("tx already executed");
    });
    
    it("should allow owners to revoke confirmations", async function () {
      await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      await multiSigWallet.confirmTransaction(0);
      
      await expect(multiSigWallet.revokeConfirmation(0))
        .to.emit(multiSigWallet, "RevokeConfirmation")
        .withArgs(owner1.address, 0);
      
      const [, , , , txConfirmations] = await multiSigWallet.getTransaction(0);
      expect(txConfirmations).to.equal(0);
      expect(await multiSigWallet.isConfirmed(0, owner1.address)).to.be.false;
    });
    
    it("should not allow revoking unconfirmed transactions", async function () {
      await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      
      await expect(
        multiSigWallet.connect(owner2).revokeConfirmation(0)
      ).to.be.revertedWith("tx not confirmed");
    });
    
    it("should not allow revoking executed transactions", async function () {
      
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther("1.0")
      });
      
      await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      await multiSigWallet.confirmTransaction(0);
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      await multiSigWallet.executeTransaction(0);
      
      await expect(
        multiSigWallet.revokeConfirmation(0)
      ).to.be.revertedWith("tx already executed");
    });
  });
  
  describe("ERC20 Token Transactions", function () {
    it("should allow submitting ERC20 token transfers", async function () {
      const tokenAddress = await token.getAddress();
      const to = nonOwner.address;
      const amount = ethers.parseEther("100");
      const initialBalance = await token.balanceOf(to);
      
      
      await multiSigWallet.submitTokenTransaction(tokenAddress, to, amount);
      
      
      await multiSigWallet.confirmTransaction(0);
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      
      
      await multiSigWallet.executeTransaction(0);
      
      
      const finalBalance = await token.balanceOf(to);
      expect(finalBalance - initialBalance).to.equal(amount);
    });
    
    it("should conduct 100 token transactions for different amounts", async function () {
      const tokenAddress = await token.getAddress();
      const recipients = Array(100).fill().map((_, i) => ethers.Wallet.createRandom().address);
      
      
      for (let i = 0; i < 100; i++) {
        const amount = ethers.parseEther(((i + 1) / 10).toString()); 
        await multiSigWallet.submitTokenTransaction(tokenAddress, recipients[i], amount);
        await multiSigWallet.confirmTransaction(i);
        await multiSigWallet.connect(owner2).confirmTransaction(i);
        await multiSigWallet.executeTransaction(i);
        
        
        const balance = await token.balanceOf(recipients[i]);
        expect(balance).to.equal(amount);
      }
      
      
      expect(await multiSigWallet.getTransactionCount()).to.equal(100);
    });
  });
  
  describe("Gas Usage Analysis", function () {
    it("should measure gas usage for key operations", async function () {
      
      const submitTx = await multiSigWallet.submitTransaction(nonOwner.address, ethers.parseEther("0.1"), "0x");
      const submitReceipt = await submitTx.wait();
      console.log(`Gas used for submitTransaction: ${submitReceipt.gasUsed}`);
      
      
      const confirmTx = await multiSigWallet.confirmTransaction(0);
      const confirmReceipt = await confirmTx.wait();
      console.log(`Gas used for confirmTransaction: ${confirmReceipt.gasUsed}`);
      
      
      await owner1.sendTransaction({
        to: await multiSigWallet.getAddress(),
        value: ethers.parseEther("1.0")
      });
      
      
      await multiSigWallet.connect(owner2).confirmTransaction(0);
      
      
      const executeTx = await multiSigWallet.executeTransaction(0);
      const executeReceipt = await executeTx.wait();
      console.log(`Gas used for executeTransaction: ${executeReceipt.gasUsed}`);
    });
  });
}); 