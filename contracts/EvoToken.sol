pragma solidity ^0.8.20;

// SPDX-License-Identifier: MIT
/*
@evotradeai
*/


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EvoToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}


    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

}
