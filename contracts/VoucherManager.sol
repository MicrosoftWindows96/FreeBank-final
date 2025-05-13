pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./InclusiveBankToken.sol";

contract VoucherManager is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    InclusiveBankToken public token;
    
    struct Voucher {
        bytes32 code;
        uint256 amount;
        bool redeemed;
        address redeemedBy;
        uint256 redeemedAt;
    }
    
    mapping(bytes32 => Voucher) public vouchers;
    
    uint256[] public availableDenominations;
    
    event VoucherCreated(bytes32 indexed codeHash, uint256 amount);
    event VoucherRedeemed(bytes32 indexed codeHash, address indexed redeemedBy, uint256 amount);
    event DenominationAdded(uint256 denomination);
    event DenominationRemoved(uint256 denomination);
    
    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = InclusiveBankToken(_tokenAddress);
        
        availableDenominations.push(10 * 10**18);
        availableDenominations.push(20 * 10**18);
        availableDenominations.push(50 * 10**18);
        availableDenominations.push(100 * 10**18);
    }
    
    function addDenomination(uint256 denomination) external onlyOwner {
        require(denomination > 0, "Denomination must be positive");
        
        for (uint256 i = 0; i < availableDenominations.length; i++) {
            require(availableDenominations[i] != denomination, "Denomination already exists");
        }
        
        availableDenominations.push(denomination);
        emit DenominationAdded(denomination);
    }
    
    function removeDenomination(uint256 denomination) external onlyOwner {
        require(availableDenominations.length > 1, "Cannot remove all denominations");
        
        for (uint256 i = 0; i < availableDenominations.length; i++) {
            if (availableDenominations[i] == denomination) {
                availableDenominations[i] = availableDenominations[availableDenominations.length - 1];
                availableDenominations.pop();
                emit DenominationRemoved(denomination);
                return;
            }
        }
        
        revert("Denomination not found");
    }
    
    function createVoucher(string calldata code, uint256 amount) public onlyOwner returns (bytes32) {
        require(amount > 0, "Amount must be positive");
        
        bool validDenomination = false;
        for (uint256 i = 0; i < availableDenominations.length; i++) {
            if (availableDenominations[i] == amount) {
                validDenomination = true;
                break;
            }
        }
        require(validDenomination, "Invalid denomination");
        
        bytes32 codeHash = keccak256(abi.encodePacked(code));
        
        require(vouchers[codeHash].amount == 0, "Voucher code already exists");
        
        vouchers[codeHash] = Voucher({
            code: codeHash,
            amount: amount,
            redeemed: false,
            redeemedBy: address(0),
            redeemedAt: 0
        });
        
        emit VoucherCreated(codeHash, amount);
        return codeHash;
    }
    
    function createVouchersBatch(string[] calldata codes, uint256[] calldata amounts) external onlyOwner {
        require(codes.length == amounts.length, "Arrays length mismatch");
        require(codes.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < codes.length; i++) {
            createVoucher(codes[i], amounts[i]);
        }
    }
    
    function checkVoucher(string calldata code) external view returns (bool isValid, uint256 amount) {
        bytes32 codeHash = keccak256(abi.encodePacked(code));
        Voucher storage voucher = vouchers[codeHash];
        
        isValid = (voucher.amount > 0 && !voucher.redeemed);
        amount = voucher.amount;
    }
    
    function getDenominations() external view returns (uint256[] memory) {
        return availableDenominations;
    }
    
    function verifyAndMarkRedeemed(string memory code, address redeemer) external returns (uint256 amount) {
        bytes32 codeHash = keccak256(abi.encodePacked(code));
        Voucher storage voucher = vouchers[codeHash];
        
        require(voucher.amount > 0, "Voucher does not exist");
        require(!voucher.redeemed, "Voucher already redeemed");
        
        voucher.redeemed = true;
        voucher.redeemedBy = redeemer;
        voucher.redeemedAt = block.timestamp;
        
        emit VoucherRedeemed(codeHash, redeemer, voucher.amount);
        return voucher.amount;
    }
}