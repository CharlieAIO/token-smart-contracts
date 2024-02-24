pragma solidity ^0.8.20;


// SPDX-License-Identifier: MIT
/*
@evotradeai
*/



import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract EvoPresale is Ownable {
    mapping(address => uint256) private ethDeposits;
    mapping(address => mapping(address => uint256)) public tokenDeposits;
    mapping(address => bool) private guaranteedWallets;
    mapping(address => uint256) private presale;

    address[] public approvedTokens;

    bool public claimEnabled;
    uint256 private hardCap = 0 ether;
    uint256 public minDeposit = 0.01 ether;
    uint256 public maxDeposit = 1 ether;


    constructor() {
        claimEnabled = false;
        approvedTokens = [0xdAC17F958D2ee523a2206206994597C13D831ec7]; // USDT
    }

    function getHardCap() external onlyOwner view returns (uint256) {
        return hardCap;
    }


    function setHardCap(uint256 _newHardCap) external onlyOwner {
        hardCap = _newHardCap;
    }

    function setMinDeposit(uint256 _newMin) external onlyOwner {
        minDeposit = _newMin;
    }

    function setMaxDeposit(uint256 _newMax) external onlyOwner {
        maxDeposit = _newMax;
    }

    function guaranteeWallet(address _address) external onlyOwner {
        require(guaranteedWallets[_address] == false, "Wallet is already guaranteed");
        guaranteedWallets[_address] = true;
    }

    function removeGuaranteeWallet(address _address) external onlyOwner {
        require(guaranteedWallets[_address] == true, "Wallet is already not guaranteed");
        guaranteedWallets[_address] = false;
    }

    function checkGuaranteedWallet(address _address) external onlyOwner view returns (bool) {
        return guaranteedWallets[_address];
    }

    function isTokenApproved(address _token) internal view returns (bool) {
        for (uint i = 0; i < approvedTokens.length; i++) {
            if (approvedTokens[i] == _token) {
                return true;
            }
        }
        return false;
    }

    function checkDeposit(address _address) external onlyOwner view returns (uint256) {
        return ethDeposits[_address];
    }

    function deposit() external payable {
        require(ethDeposits[msg.sender] == 0, "Wallet has already deposited");
        require(msg.value >= minDeposit, "Deposit is below the minimum limit");
        require(msg.value <= maxDeposit, "Deposit exceeds the maximum limit");
        ethDeposits[msg.sender] += msg.value;
    }

    function deposit(address _token, uint256 _amount) external {
        require(isTokenApproved(_token), "Token not approved for contribution");
        require(_amount > 0, "Token contribution must be greater than 0");
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        tokenDeposits[_token][msg.sender] += _amount;
    }


    function drawResults(uint256 tokensPerEth, uint256 totalTokens) external onlyOwner {
        //     probably do this off chain
    }
}