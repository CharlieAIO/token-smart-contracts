// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IToken {
    function unblacklist(address) external;

    function blacklistLiquidityPool(address) external;

    function withdrawStuckEth(address) external;

    function withdrawStuckToken(address, address) external;

    function setHelperFromHelper(address) external;

    function setSwapTokensAtAmountHelper(uint256) external;
}

contract EvoRevenueHandler is Ownable {
    address payable public teamAddress;
    address payable public communityAddress;

    // Split between team and community.
    uint256 teamAllocation = 80;

    IToken public tokenContract;

    constructor(
        address payable _teamAddress,
        address payable _communityAddress,
        address _tokenContract
    ) {
        teamAddress = _teamAddress;
        communityAddress = _communityAddress;
        tokenContract = IToken(_tokenContract);
    }

    // Split ETH when received by contract
    receive() external payable {
        uint256 amountReceived = msg.value;
        uint256 teamShare = (amountReceived / 100) * teamAllocation;
        uint256 communityShare = (amountReceived / 100) * (100 - teamAllocation);

        (bool teamSuccess, ) = teamAddress.call{value: teamShare}("");
        require(teamSuccess, "Transfer to team failed");

        (bool communitySuccess, ) = communityAddress.call{value: communityShare}("");
        require(communitySuccess, "Transfer to community failed");
    }


    // Change community address
    function setCommunityAddress(
        address payable _communityAddress
    ) external onlyOwner {
        communityAddress = _communityAddress;
    }

    // Changes the team address
    function setTeamAddress(address payable _teamAddress) external onlyOwner {
        teamAddress = _teamAddress;
    }

    // Withdraw funds to the team address.
    function withdraw() external onlyOwner {
        (bool success, ) = teamAddress.call{value: address(this).balance}("");
        require(success, "Transfer to Team Wallet failed.");
    }

    // Withdraws ERC20 tokens to the team address.
    function withdrawToken(address _token) external onlyOwner {
        require(_token != address(0), "_token address cannot be 0");
        uint256 _contractBalance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(teamAddress, _contractBalance);
    }

    // Calls main token contract to withdraw any stuck ETH.
    function withdrawStuckEth() external onlyOwner {
        tokenContract.withdrawStuckEth(owner());
    }

    // Calls main token contract to withdraw any stuck tokens.
    function withdrawStuckToken(address _token) external onlyOwner {
        tokenContract.withdrawStuckToken(_token, owner());
    }

    function setTokenContract(address _token) external onlyOwner {
        tokenContract = IToken(_token);
    }

    function changeTeamAllocation(uint256 _teamAllocation) external onlyOwner {
        require(_teamAllocation <= 100, "Cannot be more than 100%");
        teamAllocation = _teamAllocation;
    }

    // Unblacklist any Uniswap V3 LP Pools if we chose to use them in the future.
    function unblacklist(address _accountOrContract) external onlyOwner {
        tokenContract.unblacklist(_accountOrContract);
    }

    // Ability to blacklist any Uniswap V3 LP pools.
    function blacklistLiquidityPool(address _contract) external onlyOwner {
        tokenContract.blacklistLiquidityPool(_contract);
    }

    function setHelperFromHelper(address _helper) external onlyOwner {
        tokenContract.setHelperFromHelper(_helper);
    }

    function setSwapTokensAtAmountHelper(uint256 _amount) external onlyOwner {
        tokenContract.setSwapTokensAtAmountHelper(_amount);
    }
}
