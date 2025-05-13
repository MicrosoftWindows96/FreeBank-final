
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InclusiveBankToken", function () {
  let InclusiveBankToken;
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  const initialSupply = 1000000; 

  beforeEach(async function () {
    
    InclusiveBankToken = await ethers.getContractFactory("InclusiveBankToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    
    token = await InclusiveBankToken.deploy(initialSupply);
  });

  describe("Deployment", function () {
    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      const totalSupply = await token.totalSupply();
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should set the correct token name and symbol", async function () {
      expect(await token.name()).to.equal("Inclusive Banking Token");
      expect(await token.symbol()).to.equal("IBT");
    });

    it("Should set the correct decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      
      await token.transfer(addr1.address, 50);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      
      await token.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      
      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");

      
      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      
      await token.transfer(addr1.address, 100);

      
      await token.transfer(addr2.address, 50);

      
      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150n);

      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint new tokens", async function () {
      const initialSupply = await token.totalSupply();
      const mintAmount = 1000;

      
      await token.mint(addr1.address, mintAmount);

      
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(mintAmount);

      
      const newSupply = await token.totalSupply();
      expect(newSupply).to.equal(initialSupply + BigInt(mintAmount));
    });

    it("Should not allow non-owners to mint tokens", async function () {
      
      await expect(
        token.connect(addr1).mint(addr2.address, 1000)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });
}); 