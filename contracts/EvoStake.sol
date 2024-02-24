pragma solidity ^0.8.20;


// SPDX-License-Identifier: MIT
/*
@evotradeai
*/



import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract EvoStaking is Ownable {
    struct Tier {
        string name;
        uint256 tokenAmount;
        uint256 lockTime;
    }

    struct LockedToken {
        uint256 amount;
        uint256 stakingTime;
        string tierName;
    }



    address public stakeToken;
    mapping(string => Tier) public tiers;
    mapping(address => LockedToken) public lockedTokens;
    mapping(string => address[]) public locks;


    function updateStakeToken(address _newTokenAddress) external onlyOwner {
        require(_newTokenAddress != address(0), "Invalid token address");
        stakeToken = _newTokenAddress;
    }

    function addTier(string memory _name, uint256 _tokenAmount, uint256 _lockTime) external onlyOwner {
        require(_tokenAmount > 0, "Token amount must be greater than zero");
        require(_lockTime > 0, "Lock time must be greater than zero");
        require(tiers[_name].tokenAmount == 0, "Tier already exists");

        tiers[_name] = Tier(_name, _tokenAmount, _lockTime);
    }

    function deleteTier(string memory _name) external onlyOwner {
        require(tiers[_name].tokenAmount > 0, "Tier does not exist");
        delete tiers[_name];
    }

    function checkLock(address _walletAddress) external view returns (LockedToken memory) {
        LockedToken memory userStake = lockedTokens[_walletAddress];
        require(userStake.amount > 0, "No tokens staked");

        return userStake;
    }

    function updateTier(string memory _name, uint256 _newTokenAmount, uint256 _newLockTime) external onlyOwner {
        require(tiers[_name].tokenAmount > 0, "Tier does not exist");
        require(_newTokenAmount > 0 && _newLockTime > 0, "Invalid parameters");

        unlockAll(_name);

        tiers[_name] = Tier(_name, _newTokenAmount, _newLockTime);
    }

    function unlockAll(string memory _tierName) internal onlyOwner {
        for (uint i = 0; i < locks[_tierName].length; i++) {
            address lock = locks[_tierName][i];
            lockedTokens[lock].stakingTime = block.timestamp;
        }
    }

    function stake(string memory _tierName) external {
        Tier memory tier = tiers[_tierName];
        require(tier.tokenAmount > 0, "Tier does not exist");

        LockedToken memory lock = lockedTokens[msg.sender];
        require(lock.amount == 0, "Tokens already staked.");

        bool isLockAdded = false;
        for (uint i = 0; i < locks  [_tierName].length; i++) {
            if (locks[_tierName][i] == msg.sender) {
                isLockAdded = true;
                break;
            }
        }

        if(!isLockAdded) {
            locks[_tierName].push(msg.sender);
        }

        IERC20(stakeToken).transferFrom(msg.sender, address(this), tier.tokenAmount);
        lockedTokens[msg.sender] = LockedToken(tier.tokenAmount, block.timestamp, _tierName);
    }

    function updateStake(string memory _tierName) external {
        Tier memory tier = tiers[_tierName];
        require(tier.tokenAmount > 0, "Tier does not exist");

        LockedToken memory lock = lockedTokens[msg.sender];
        require(lock.amount > 0, "No stake to update");

        bool isLockAdded = false;
        for (uint i = 0; i < locks  [_tierName].length; i++) {
            if (locks[_tierName][i] == msg.sender) {
                isLockAdded = true;
                break;
            }
        }

        if(!isLockAdded) {
            locks[_tierName].push(msg.sender);
        }
        uint256 changeAmount = tier.tokenAmount - lock.amount;
        require(changeAmount > 0, "Cannot decrease stake amount");

        IERC20(stakeToken).transferFrom(msg.sender, address(this), changeAmount);
        lockedTokens[msg.sender] = LockedToken(tier.tokenAmount, block.timestamp, _tierName);

    }

    function claim() external {
        LockedToken memory lock = lockedTokens[msg.sender];
        require(lock.amount > 0, "No tokens staked");

        Tier memory tier = tiers[lock.tierName];
        require(block.timestamp >= lock.stakingTime + tier.lockTime, "Tokens are still locked");



        IERC20(stakeToken).transfer(msg.sender, lock.amount);
        delete lockedTokens[msg.sender];
    }
}
