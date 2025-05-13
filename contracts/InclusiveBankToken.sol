pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract InclusiveBankToken is ERC20Pausable, Ownable {
    uint256 public dailyTransferLimit;
    mapping(address => uint256) public dailyTransfers;
    mapping(address => uint256) public lastTransferTimestamp;
    
    mapping(address => bool) public isBlacklisted;
    bool public shariahCompliant;
    
    event TransferLimitUpdated(uint256 newLimit);
    event AddressBlacklisted(address indexed account);
    event AddressUnblacklisted(address indexed account);
    event ShariahComplianceUpdated(bool status);

    constructor(uint256 initialSupply) ERC20("Inclusive Banking Token", "IBT") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
        dailyTransferLimit = 10000 * 10 ** decimals();
        shariahCompliant = true;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    function setDailyTransferLimit(uint256 newLimit) public onlyOwner {
        dailyTransferLimit = newLimit;
        emit TransferLimitUpdated(newLimit);
    }
    
    function blacklistAddress(address account) public onlyOwner {
        isBlacklisted[account] = true;
        emit AddressBlacklisted(account);
    }
    
    function unblacklistAddress(address account) public onlyOwner {
        isBlacklisted[account] = false;
        emit AddressUnblacklisted(account);
    }
    
    function setShariahCompliance(bool status) public onlyOwner {
        shariahCompliant = status;
        emit ShariahComplianceUpdated(status);
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        _preTransferChecks(msg.sender, amount);
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _preTransferChecks(from, amount);
        return super.transferFrom(from, to, amount);
    }
    
    function _preTransferChecks(address from, uint256 amount) internal {
        require(!isBlacklisted[from], "Sender is blacklisted");
        require(!isBlacklisted[msg.sender], "Operator is blacklisted");
        
        if (block.timestamp >= lastTransferTimestamp[from] + 1 days) {
            dailyTransfers[from] = 0;
            lastTransferTimestamp[from] = block.timestamp;
        }
        
        require(dailyTransfers[from] + amount <= dailyTransferLimit, "Daily transfer limit exceeded");
        
        dailyTransfers[from] += amount;
    }
}