pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./InclusiveBankToken.sol";
import "./VoucherManager.sol";

contract InclusiveBankingSystem is ReentrancyGuard, Ownable {
    InclusiveBankToken public token;
    VoucherManager public voucherManager;
    
    mapping(address => bool) public isRegistered;
    mapping(address => UserInfo) public userProfiles;
    
    uint256 public transactionCount;
    mapping(uint256 => Transaction) public transactions;
    
    uint256 public transferFeePercentage;
    uint256 public withdrawalFeePercentage;
    
    struct UserInfo {
        string name;
        string location;
        uint256 registrationTimestamp;
        bool active;
    }
    
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
        TransactionType txType;
    }
    
    enum TransactionType { DEPOSIT, WITHDRAWAL, TRANSFER, VOUCHER_REDEMPTION }
    
    event UserRegistered(address indexed user, string name, string location);
    event UserStatusUpdated(address indexed user, bool active);
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 fee, uint256 timestamp);
    event Transfer(address indexed from, address indexed to, uint256 amount, uint256 fee, uint256 timestamp);
    event FeeUpdated(string feeType, uint256 newPercentage);
    event VoucherRedeemed(address indexed user, uint256 amount, uint256 timestamp);
    event VoucherManagerSet(address indexed voucherManager);
    
    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = InclusiveBankToken(_tokenAddress);
        transferFeePercentage = 50;
        withdrawalFeePercentage = 100;
    }
    
    function setVoucherManager(address _voucherManager) external onlyOwner {
        require(_voucherManager != address(0), "Invalid voucher manager address");
        voucherManager = VoucherManager(_voucherManager);
        emit VoucherManagerSet(_voucherManager);
    }
    
    function registerUser(string memory name, string memory location) public {
        require(!isRegistered[msg.sender], "User already registered");
        
        userProfiles[msg.sender] = UserInfo({
            name: name,
            location: location,
            registrationTimestamp: block.timestamp,
            active: true
        });
        
        isRegistered[msg.sender] = true;
        
        emit UserRegistered(msg.sender, name, location);
    }
    
    function updateUserStatus(address user, bool active) public onlyOwner {
        require(isRegistered[user], "User not registered");
        userProfiles[user].active = active;
        
        emit UserStatusUpdated(user, active);
    }
    
    function updateTransferFee(uint256 newPercentage) public onlyOwner {
        require(newPercentage <= 500, "Fee too high");
        transferFeePercentage = newPercentage;
        
        emit FeeUpdated("Transfer", newPercentage);
    }
    
    function updateWithdrawalFee(uint256 newPercentage) public onlyOwner {
        require(newPercentage <= 500, "Fee too high");
        withdrawalFeePercentage = newPercentage;
        
        emit FeeUpdated("Withdrawal", newPercentage);
    }
    
    function deposit(uint256 amount) public nonReentrant {
        require(isRegistered[msg.sender], "User not registered");
        require(userProfiles[msg.sender].active, "Account inactive");
        require(amount > 0, "Amount must be greater than 0");
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        uint256 txId = transactionCount;
        transactions[txId] = Transaction({
            from: msg.sender,
            to: address(this),
            amount: amount,
            fee: 0,
            timestamp: block.timestamp,
            txType: TransactionType.DEPOSIT
        });
        transactionCount++;
        
        emit Deposit(msg.sender, amount, block.timestamp);
    }
    
    function redeemVoucher(string memory voucherCode) public nonReentrant {
        require(isRegistered[msg.sender], "User not registered");
        require(userProfiles[msg.sender].active, "Account inactive");
        require(address(voucherManager) != address(0), "Voucher manager not set");
        
        uint256 amount = voucherManager.verifyAndMarkRedeemed(voucherCode, msg.sender);
        
        token.mint(address(this), amount);
        
        uint256 txId = transactionCount;
        transactions[txId] = Transaction({
            from: address(0),
            to: msg.sender,
            amount: amount,
            fee: 0,
            timestamp: block.timestamp,
            txType: TransactionType.VOUCHER_REDEMPTION
        });
        transactionCount++;
        
        emit VoucherRedeemed(msg.sender, amount, block.timestamp);
    }
    
    function withdraw(uint256 amount) public nonReentrant {
        require(isRegistered[msg.sender], "User not registered");
        require(userProfiles[msg.sender].active, "Account inactive");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 fee = (amount * withdrawalFeePercentage) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        require(token.transfer(msg.sender, amountAfterFee), "Transfer failed");
        
        uint256 txId = transactionCount;
        transactions[txId] = Transaction({
            from: address(this),
            to: msg.sender,
            amount: amount,
            fee: fee,
            timestamp: block.timestamp,
            txType: TransactionType.WITHDRAWAL
        });
        transactionCount++;
        
        emit Withdrawal(msg.sender, amount, fee, block.timestamp);
    }
    
    function transfer(address to, uint256 amount) public nonReentrant {
        require(isRegistered[msg.sender], "Sender not registered");
        require(isRegistered[to], "Recipient not registered");
        require(userProfiles[msg.sender].active, "Sender account inactive");
        require(userProfiles[to].active, "Recipient account inactive");
        require(amount > 0, "Amount must be greater than 0");
        require(to != msg.sender, "Cannot transfer to self");
        
        uint256 fee = (amount * transferFeePercentage) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer from sender failed");
        require(token.transfer(to, amountAfterFee), "Transfer to recipient failed");
        
        uint256 txId = transactionCount;
        transactions[txId] = Transaction({
            from: msg.sender,
            to: to,
            amount: amount,
            fee: fee,
            timestamp: block.timestamp,
            txType: TransactionType.TRANSFER
        });
        transactionCount++;
        
        emit Transfer(msg.sender, to, amount, fee, block.timestamp);
    }
    
    function getTransaction(uint256 txId) public view returns (
        address from,
        address to,
        uint256 amount,
        uint256 fee,
        uint256 timestamp,
        TransactionType txType
    ) {
        require(txId < transactionCount, "Transaction does not exist");
        Transaction storage tx = transactions[txId];
        return (tx.from, tx.to, tx.amount, tx.fee, tx.timestamp, tx.txType);
    }
    
    function getUserProfile(address user) public view returns (
        string memory name,
        string memory location,
        uint256 registrationTimestamp,
        bool active
    ) {
        require(isRegistered[user], "User not registered");
        UserInfo storage profile = userProfiles[user];
        return (profile.name, profile.location, profile.registrationTimestamp, profile.active);
    }
    
    function pauseTokenTransfers() public onlyOwner {
        token.pause();
    }
    
    function unpauseTokenTransfers() public onlyOwner {
        token.unpause();
    }
} 