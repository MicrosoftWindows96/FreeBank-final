const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VoucherManager", function () {
  let VoucherManager;
  let voucherManager;
  let InclusiveBankToken;
  let token;
  let owner;
  let user1;
  let user2;
  let user3;
  
  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    
    InclusiveBankToken = await ethers.getContractFactory("InclusiveBankToken");
    token = await InclusiveBankToken.deploy(1000000);
    await token.waitForDeployment();
    
    
    VoucherManager = await ethers.getContractFactory("VoucherManager");
    const tokenAddress = await token.getAddress();
    voucherManager = await VoucherManager.deploy(tokenAddress);
    await voucherManager.waitForDeployment();
    
    console.log("Token deployed at:", await token.getAddress());
    console.log("VoucherManager deployed at:", await voucherManager.getAddress());
  });
  
  describe("Deployment", function () {
    it("should initialize with the correct token reference", async function () {
      const tokenAddress = await token.getAddress();
      const managerTokenAddress = await voucherManager.token();
      expect(managerTokenAddress).to.equal(tokenAddress);
    });
    
    it("should initialize with default denominations", async function () {
      const denominations = await voucherManager.getDenominations();
      expect(denominations.length).to.equal(4);
      expect(denominations[0]).to.equal(ethers.parseEther("10"));
      expect(denominations[1]).to.equal(ethers.parseEther("20"));
      expect(denominations[2]).to.equal(ethers.parseEther("50"));
      expect(denominations[3]).to.equal(ethers.parseEther("100"));
    });
  });
  
  describe("Denomination Management", function () {
    it("should allow the owner to add a new denomination", async function () {
      const newDenomination = ethers.parseEther("200");
      
      await expect(voucherManager.addDenomination(newDenomination))
        .to.emit(voucherManager, "DenominationAdded")
        .withArgs(newDenomination);
      
      const denominations = await voucherManager.getDenominations();
      expect(denominations.length).to.equal(5);
      expect(denominations[4]).to.equal(newDenomination);
    });
    
    it("should not allow adding a denomination of zero", async function () {
      await expect(
        voucherManager.addDenomination(0)
      ).to.be.revertedWith("Denomination must be positive");
    });
    
    it("should not allow adding duplicate denominations", async function () {
      const existingDenomination = ethers.parseEther("50");
      await expect(
        voucherManager.addDenomination(existingDenomination)
      ).to.be.revertedWith("Denomination already exists");
    });
    
    it("should not allow non-owners to add denominations", async function () {
      await expect(
        voucherManager.connect(user1).addDenomination(ethers.parseEther("200"))
      ).to.be.revertedWithCustomError(voucherManager, "OwnableUnauthorizedAccount");
    });
    
    it("should allow the owner to remove a denomination", async function () {
      const denominationToRemove = ethers.parseEther("10");
      
      
      const denomsBefore = await voucherManager.getDenominations();
      console.log("Denominations before:", denomsBefore.map(d => d.toString()));
      
      await expect(voucherManager.removeDenomination(denominationToRemove))
        .to.emit(voucherManager, "DenominationRemoved")
        .withArgs(denominationToRemove);
      
      
      const denominations = await voucherManager.getDenominations();
      console.log("Denominations after:", denominations.map(d => d.toString()));
      
      expect(denominations.length).to.equal(3);
      
      
      const hasRemovedDenom = denominations.some(d => d.toString() === denominationToRemove.toString());
      expect(hasRemovedDenom).to.be.false;
    });
    
    it("should not allow removing non-existent denominations", async function () {
      await expect(
        voucherManager.removeDenomination(ethers.parseEther("75"))
      ).to.be.revertedWith("Denomination not found");
    });
    
    it("should not allow removing all denominations", async function () {
      await voucherManager.removeDenomination(ethers.parseEther("10"));
      await voucherManager.removeDenomination(ethers.parseEther("20"));
      await voucherManager.removeDenomination(ethers.parseEther("50"));
      
      
      await expect(
        voucherManager.removeDenomination(ethers.parseEther("100"))
      ).to.be.revertedWith("Cannot remove all denominations");
    });
    
    it("should not allow non-owners to remove denominations", async function () {
      await expect(
        voucherManager.connect(user1).removeDenomination(ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(voucherManager, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Voucher Creation", function () {
    it("should allow the owner to create a voucher", async function () {
      const voucherCode = "VOUCHER123";
      const voucherAmount = ethers.parseEther("10");
      
      await expect(voucherManager.createVoucher(voucherCode, voucherAmount))
        .to.emit(voucherManager, "VoucherCreated");
      
      
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(voucherCode));
      const voucher = await voucherManager.vouchers(codeHash);
      
      expect(voucher.amount).to.equal(voucherAmount);
      expect(voucher.redeemed).to.be.false;
    });
    
    it("should not allow creating vouchers with invalid denominations", async function () {
      await expect(
        voucherManager.createVoucher("INVALID", ethers.parseEther("15"))
      ).to.be.revertedWith("Invalid denomination");
    });
    
    it("should not allow creating vouchers with zero amount", async function () {
      await expect(
        voucherManager.createVoucher("ZERO", 0)
      ).to.be.revertedWith("Amount must be positive");
    });
    
    it("should not allow duplicate voucher codes", async function () {
      await voucherManager.createVoucher("DUPLICATE", ethers.parseEther("10"));
      
      await expect(
        voucherManager.createVoucher("DUPLICATE", ethers.parseEther("20"))
      ).to.be.revertedWith("Voucher code already exists");
    });
    
    it("should not allow non-owners to create vouchers", async function () {
      await expect(
        voucherManager.connect(user1).createVoucher("UNAUTHORIZED", ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(voucherManager, "OwnableUnauthorizedAccount");
    });
    
    it("should allow batch creation of vouchers", async function () {
      const codes = ["BATCH1", "BATCH2", "BATCH3"];
      const amounts = [
        ethers.parseEther("10"),
        ethers.parseEther("20"),
        ethers.parseEther("50")
      ];
      
      await voucherManager.createVouchersBatch(codes, amounts);
      
      
      for (let i = 0; i < codes.length; i++) {
        const codeHash = ethers.keccak256(ethers.toUtf8Bytes(codes[i]));
        const voucher = await voucherManager.vouchers(codeHash);
        expect(voucher.amount).to.equal(amounts[i]);
        expect(voucher.redeemed).to.be.false;
      }
    });
    
    it("should not allow batch creation with mismatched arrays", async function () {
      const codes = ["MISMATCH1", "MISMATCH2"];
      const amounts = [ethers.parseEther("10")];
      
      await expect(
        voucherManager.createVouchersBatch(codes, amounts)
      ).to.be.revertedWith("Arrays length mismatch");
    });
    
    it("should not allow batch creation with empty arrays", async function () {
      await expect(
        voucherManager.createVouchersBatch([], [])
      ).to.be.revertedWith("Empty arrays");
    });
  });
  
  describe("Voucher Verification and Redemption", function () {
    beforeEach(async function () {
      
      await voucherManager.createVoucher("VALID10", ethers.parseEther("10"));
      await voucherManager.createVoucher("VALID20", ethers.parseEther("20"));
      await voucherManager.createVoucher("VALID50", ethers.parseEther("50"));
    });
    
    it("should correctly check if a voucher is valid", async function () {
      const [isValid, amount] = await voucherManager.checkVoucher("VALID10");
      expect(isValid).to.be.true;
      expect(amount).to.equal(ethers.parseEther("10"));
    });
    
    it("should correctly check if a voucher is invalid", async function () {
      const [isValid, amount] = await voucherManager.checkVoucher("INVALID");
      expect(isValid).to.be.false;
      expect(amount).to.equal(0);
    });
    
    it("should allow redeeming a valid voucher", async function () {
      const voucherCode = "VALID10";
      const redeemer = user1.address;
      
      await expect(voucherManager.verifyAndMarkRedeemed(voucherCode, redeemer))
        .to.emit(voucherManager, "VoucherRedeemed")
        .withArgs(ethers.keccak256(ethers.toUtf8Bytes(voucherCode)), redeemer, ethers.parseEther("10"));
      
      
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(voucherCode));
      const voucher = await voucherManager.vouchers(codeHash);
      expect(voucher.redeemed).to.be.true;
      expect(voucher.redeemedBy).to.equal(redeemer);
      expect(voucher.redeemedAt).to.be.greaterThan(0);
    });
    
    it("should not allow redeeming a non-existent voucher", async function () {
      await expect(
        voucherManager.verifyAndMarkRedeemed("NONEXISTENT", user1.address)
      ).to.be.revertedWith("Voucher does not exist");
    });
    
    it("should not allow redeeming an already redeemed voucher", async function () {
      const voucherCode = "VALID20";
      
      
      await voucherManager.verifyAndMarkRedeemed(voucherCode, user1.address);
      
      
      await expect(
        voucherManager.verifyAndMarkRedeemed(voucherCode, user2.address)
      ).to.be.revertedWith("Voucher already redeemed");
    });
    
    it("should return the correct amount when redeeming", async function () {
      const voucherCode = "VALID50";
      const expectedAmount = ethers.parseEther("50");
      
      
      const [isValid, amount] = await voucherManager.checkVoucher(voucherCode);
      expect(isValid).to.be.true;
      expect(amount).to.equal(expectedAmount);
      
      
      await voucherManager.verifyAndMarkRedeemed(voucherCode, user1.address);
      
      
      const codeHash = ethers.keccak256(ethers.toUtf8Bytes(voucherCode));
      const voucher = await voucherManager.vouchers(codeHash);
      expect(voucher.redeemed).to.be.true;
      expect(voucher.amount).to.equal(expectedAmount);
    });
  });
  
  describe("Bulk Voucher Testing", function () {
    it("should handle creation and verification of 100 vouchers", async function () {
      const codes = [];
      const amounts = [];
      const batchSize = 20; 
      
      
      for (let i = 0; i < 100; i++) {
        codes.push(`VOUCHER${i}`);
        
        const denomIndex = i % 4;
        const denominations = [
          ethers.parseEther("10"),
          ethers.parseEther("20"),
          ethers.parseEther("50"),
          ethers.parseEther("100")
        ];
        amounts.push(denominations[denomIndex]);
      }
      
      
      for (let i = 0; i < 100; i += batchSize) {
        const batchCodes = codes.slice(i, i + batchSize);
        const batchAmounts = amounts.slice(i, i + batchSize);
        await voucherManager.createVouchersBatch(batchCodes, batchAmounts);
      }
      
      
      for (let i = 0; i < 100; i++) {
        const [isValid, amount] = await voucherManager.checkVoucher(codes[i]);
        expect(isValid).to.be.true;
        expect(amount).to.equal(amounts[i]);
      }
      
      
      const redeemers = [user1.address, user2.address, user3.address];
      for (let i = 0; i < 50; i++) {
        const redeemerIndex = i % 3;
        await voucherManager.verifyAndMarkRedeemed(codes[i], redeemers[redeemerIndex]);
        
        
        const [isValid, ] = await voucherManager.checkVoucher(codes[i]);
        expect(isValid).to.be.false;
        
        const codeHash = ethers.keccak256(ethers.toUtf8Bytes(codes[i]));
        const voucher = await voucherManager.vouchers(codeHash);
        expect(voucher.redeemed).to.be.true;
        expect(voucher.redeemedBy).to.equal(redeemers[redeemerIndex]);
      }
      
      
      for (let i = 50; i < 100; i++) {
        const [isValid, ] = await voucherManager.checkVoucher(codes[i]);
        expect(isValid).to.be.true;
      }
    });
  });
}); 