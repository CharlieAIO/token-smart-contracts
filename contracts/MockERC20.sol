// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        uint256 MAX_SUPPLY = 1_000_000 * 10e18;
        _mint(msg.sender, MAX_SUPPLY);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

}
