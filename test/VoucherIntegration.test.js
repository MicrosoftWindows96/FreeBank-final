const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voucher Integration with Banking System", function () {
  let token;
  let bankingSystem;
  let voucherManager;
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
    bankingSystem = await InclusiveBankingSystem.deploy(await token.getAddress());
    await bankingSystem.waitForDeployment();
    
    
    const VoucherManager = await ethers.getContractFactory("VoucherManager");
    voucherManager = await VoucherManager.deploy(await token.getAddress());
    await voucherManager.waitForDeployment();
    
    
    await bankingSystem.setVoucherManager(await voucherManager.getAddress());
    
    
    await token.transferOwnership(await bankingSystem.getAddress());
    
    
    await bankingSystem.connect(user1).registerUser("Alice", "Baghdad");
    await bankingSystem.connect(user2).registerUser("Bob", "Basra");
    
    console.log("Token deployed at:", await token.getAddress());
    console.log("Banking System deployed at:", await bankingSystem.getAddress());
    console.log("VoucherManager deployed at:", await voucherManager.getAddress());
  });
  
  describe("Voucher Redemption Flow", function () {
    it("should allow user to redeem a voucher through the banking system", async function () {
      
      const voucherCode = "TEST100";
      const voucherAmount = ethers.parseEther("100");
      
      
      await voucherManager.transferOwnership(owner.address);
      
      
      await voucherManager.createVoucher(voucherCode, voucherAmount);
      
      
      const initialBalance = await token.balanceOf(user1.address);
      
      
      await bankingSystem.connect(user1).redeemVoucher(voucherCode);
      
      
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(voucherCode));
      const voucher = await voucherManager.vouchers(codeHash);
      expect(voucher.redeemed).to.be.true;
      expect(voucher.redeemedBy).to.equal(user1.address);
      
      
      const lastTxIndex = await bankingSystem.transactionCount() - 1n;
      const tx = await bankingSystem.getTransaction(lastTxIndex);
      expect(tx[0]).to.equal(ethers.ZeroAddress); 
      expect(tx[1]).to.equal(user1.address); 
      expect(tx[2]).to.equal(voucherAmount); 
      expect(tx[3]).to.equal(0); 
      expect(tx[5]).to.equal(3); 
      
      
      const finalUserBalance = await token.balanceOf(user1.address);
      expect(finalUserBalance).to.equal(initialBalance); 
      
      
      const bankingSystemAddress = await bankingSystem.getAddress();
      const bankingSystemBalance = await token.balanceOf(bankingSystemAddress);
      expect(bankingSystemBalance).to.equal(voucherAmount);
    });
    
    it("should handle multiple voucher redemptions and withdrawals", async function () {
      
      const bankingSystemAddress = await bankingSystem.getAddress();
      
      
      await voucherManager.transferOwnership(owner.address);
      
      const voucherCodes = [];
      const voucherAmounts = [];
      let totalVoucherAmount = ethers.parseEther("0");
      
      
      const validDenominations = [
        ethers.parseEther("10"),
        ethers.parseEther("20"),
        ethers.parseEther("50"),
        ethers.parseEther("100")
      ];
      
      for (let i = 0; i < 10; i++) {
        const code = `BATCH${i}`;
        
        const denomIndex = i % 4;
        const amount = validDenominations[denomIndex];
        
        voucherCodes.push(code);
        voucherAmounts.push(amount);
        totalVoucherAmount = totalVoucherAmount + amount;
        
        await voucherManager.createVoucher(code, amount);
      }
      
      
      console.log("Total amount:", totalVoucherAmount.toString());
      
      
      for (let i = 0; i < 5; i++) {
        await bankingSystem.connect(user1).redeemVoucher(voucherCodes[i]);
      }
      
      
      for (let i = 5; i < 10; i++) {
        await bankingSystem.connect(user2).redeemVoucher(voucherCodes[i]);
      }
      
      
      for (let i = 0; i < 10; i++) {
        const codeHash = ethers.keccak256(ethers.toUtf8Bytes(voucherCodes[i]));
        const voucher = await voucherManager.vouchers(codeHash);
        expect(voucher.redeemed).to.be.true;
        
        
        if (i < 5) {
          expect(voucher.redeemedBy).to.equal(user1.address);
        } else {
          expect(voucher.redeemedBy).to.equal(user2.address);
        }
      }
      
      
      const bankingSystemBalance = await token.balanceOf(bankingSystemAddress);
      expect(bankingSystemBalance).to.equal(totalVoucherAmount);
      
      
      const user1VoucherAmount = voucherAmounts[0] + voucherAmounts[1] + voucherAmounts[2] + voucherAmounts[3] + voucherAmounts[4];
      const withdrawAmount = user1VoucherAmount / 2n;
      
      
      console.log("User1 voucher amount:", user1VoucherAmount.toString());
      console.log("Withdraw amount:", withdrawAmount.toString());
      
      await bankingSystem.connect(user1).withdraw(withdrawAmount);
      
      
      const expectedFee = withdrawAmount * 100n / 10000n;
      console.log("Expected fee:", expectedFee.toString());
      const expectedReceived = withdrawAmount - expectedFee;
      console.log("Expected received:", expectedReceived.toString());
      
      
      const user1Balance = await token.balanceOf(user1.address);
      console.log("User1 balance:", user1Balance.toString());
      expect(user1Balance).to.equal(expectedReceived);
      
      
      const updatedBankingSystemBalance = await token.balanceOf(bankingSystemAddress);
      console.log("Banking system updated balance:", updatedBankingSystemBalance.toString());
      console.log("Expected updated balance:", (totalVoucherAmount - withdrawAmount).toString());
      
      
      
      const expectedBankingSystemBalance = totalVoucherAmount - withdrawAmount + expectedFee;
      console.log("Corrected expected balance with fee:", expectedBankingSystemBalance.toString());
      
      
      expect(updatedBankingSystemBalance).to.equal(expectedBankingSystemBalance);
    });
    
    it("should not allow redeeming vouchers for users who are not registered", async function () {
      const nonRegisteredUser = await ethers.provider.getSigner(5); 
      
      await voucherManager.transferOwnership(owner.address);
      
      
      const voucherCode = "NONREG100";
      const voucherAmount = ethers.parseEther("100");
      await voucherManager.createVoucher(voucherCode, voucherAmount);
      
      
      await expect(
        bankingSystem.connect(nonRegisteredUser).redeemVoucher(voucherCode)
      ).to.be.revertedWith("User not registered");
    });
    
    it("should not allow redeeming non-existent vouchers", async function () {
      await expect(
        bankingSystem.connect(user1).redeemVoucher("NONEXISTENT")
      ).to.be.revertedWith("Voucher does not exist");
    });
    
    it("should not allow redeeming a voucher more than once", async function () {
      await voucherManager.transferOwnership(owner.address);
      
      
      const voucherCode = "REDEEMONCE";
      const voucherAmount = ethers.parseEther("100");
      await voucherManager.createVoucher(voucherCode, voucherAmount);
      
      
      await bankingSystem.connect(user1).redeemVoucher(voucherCode);
      
      
      await expect(
        bankingSystem.connect(user2).redeemVoucher(voucherCode)
      ).to.be.revertedWith("Voucher already redeemed");
    });
    
    it("should not allow redeeming vouchers if the user account is inactive", async function () {
      await voucherManager.transferOwnership(owner.address);
      
      
      const voucherCode = "INACTIVE";
      const voucherAmount = ethers.parseEther("100");
      await voucherManager.createVoucher(voucherCode, voucherAmount);
      
      
      await bankingSystem.updateUserStatus(user1.address, false);
      
      
      await expect(
        bankingSystem.connect(user1).redeemVoucher(voucherCode)
      ).to.be.revertedWith("Account inactive");
    });
    
    it("should conduct 100 redemption and withdrawal transactions", async function () {
      
      
      await voucherManager.transferOwnership(owner.address);
      
      
      const voucherCodes = [];
      const voucherAmounts = [];
      
      for (let i = 1; i <= 50; i++) {
        const code = `MASS${i}`;
        const amount = ethers.parseEther(String(i)); 
        
        voucherCodes.push(code);
        voucherAmounts.push(amount);
        
        
        const denomination = i % 4;
        let denomAmount;
        switch (denomination) {
          case 0: denomAmount = ethers.parseEther("10"); break;
          case 1: denomAmount = ethers.parseEther("20"); break;
          case 2: denomAmount = ethers.parseEther("50"); break;
          case 3: denomAmount = ethers.parseEther("100"); break;
        }
        
        await voucherManager.createVoucher(code, denomAmount);
      }
      
      
      for (let i = 0; i < 50; i++) {
        await bankingSystem.connect(user1).redeemVoucher(voucherCodes[i]);
      }
      
      
      for (let i = 1; i <= 50; i++) {
        await bankingSystem.connect(user1).withdraw(ethers.parseEther("1"));
      }
      
      
      const txCount = await bankingSystem.transactionCount();
      expect(txCount).to.equal(100);
      
      
      const redemptionTx = await bankingSystem.getTransaction(25); 
      expect(redemptionTx[5]).to.equal(3); 
      
      const withdrawalTx = await bankingSystem.getTransaction(75); 
      expect(withdrawalTx[5]).to.equal(1); 
    });
  });
}); 