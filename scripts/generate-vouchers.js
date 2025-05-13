const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const crypto = require('crypto');


const VOUCHER_COUNT = 10; 
const OUTPUT_DIR = path.join(__dirname, '../vouchers');
const DENOMINATIONS = [10, 20, 50, 100]; 


function generateVoucherCode(length = 12) {
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  
  
  const randomBytes = crypto.randomBytes(length);
  
  
  for (let i = 0; i < length; i++) {
    
    const index = randomBytes[i] % chars.length;
    code += chars[index];
  }
  
  
  return code.match(/.{1,4}/g).join('-');
}


async function main() {
  console.log('Generating voucher codes...');
  
  
  const [owner] = await ethers.getSigners();
  console.log(`Using account: ${owner.address}`);
  
  
  const tokenContract = await ethers.getContract('InclusiveBankToken');
  console.log(`Token contract address: ${await tokenContract.getAddress()}`);
  
  const voucherManager = await ethers.getContract('VoucherManager');
  console.log(`VoucherManager contract address: ${await voucherManager.getAddress()}`);
  
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  
  const allVouchers = [];
  
  for (const denomination of DENOMINATIONS) {
    console.log(`Generating ${VOUCHER_COUNT} vouchers for denomination: ${denomination} tokens`);
    
    const voucherCodes = [];
    const denomVouchers = [];
    
    
    for (let i = 0; i < VOUCHER_COUNT; i++) {
      const code = generateVoucherCode();
      voucherCodes.push(code);
      
      denomVouchers.push({
        code,
        denomination,
        amountInWei: ethers.parseEther(denomination.toString()),
        timestamp: new Date().toISOString()
      });
    }
    
    
    allVouchers.push(...denomVouchers);
    
    
    const outputFilePath = path.join(OUTPUT_DIR, `vouchers-${denomination}.json`);
    fs.writeFileSync(outputFilePath, JSON.stringify(denomVouchers, null, 2));
    console.log(`Saved vouchers to ${outputFilePath}`);
  }
  
  
  const allOutputFilePath = path.join(OUTPUT_DIR, 'all-vouchers.json');
  fs.writeFileSync(allOutputFilePath, JSON.stringify(allVouchers, null, 2));
  console.log(`Saved all vouchers to ${allOutputFilePath}`);
  
  
  const batchData = {
    codes: allVouchers.map(v => v.code),
    amounts: allVouchers.map(v => v.amountInWei.toString())
  };
  const batchFilePath = path.join(OUTPUT_DIR, 'batch-data.json');
  fs.writeFileSync(batchFilePath, JSON.stringify(batchData, null, 2));
  
  
  console.log('Creating vouchers on the blockchain...');
  try {
    
    const tx = await voucherManager.createVouchersBatch(
      batchData.codes,
      batchData.amounts
    );
    
    const receipt = await tx.wait();
    console.log(`Vouchers created successfully! Transaction hash: ${receipt.hash}`);
    
    
    const voucherCreatedEvents = receipt.logs.filter(log => 
      log.topics[0] === ethers.id('VoucherCreated(bytes32,uint256)')
    );
    
    console.log(`Created ${voucherCreatedEvents.length} vouchers on the blockchain`);
    
    
    console.log('\nSample voucher for testing:');
    console.log(`Code: ${allVouchers[0].code}`);
    console.log(`Amount: ${allVouchers[0].denomination} tokens`);
    
  } catch (error) {
    console.error('Error creating vouchers:', error);
  }
  
  console.log('\nVoucher generation complete!');
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 