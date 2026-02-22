// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HighRiskTest
 * @dev CONTRACT WITH INTENTIONAL VULNERABILITIES FOR TESTING ONLY
 * DO NOT USE IN PRODUCTION
 */
contract HighRiskTest {
    IERC20 public immutable token;
    
    mapping(address => uint256) public balances;
    mapping(address => bool) public authorized;
    
    address public owner;
    bool public locked;
    
    // VULNERABILITY: No access control on emergency functions
    function emergencyWithdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // VULNERABILITY: Reentrancy issue
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        // Dangerous external call before state update
        if (msg.sender.balance > 0) {
            payable(msg.sender).call{value: 1 wei}("");
        }
    }
    
    // VULNERABILITY: Integer overflow/underflow possible
    function riskyTransfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount; // Potential underflow
        balances[to] += amount; // Potential overflow
    }
    
    // VULNERABILITY: Unchecked external call
    function approveToken(address spender, uint256 amount) external {
        token.approve(spender, amount);
        // No check if approval succeeded
    }
    
    // VULNERABILITY: tx.origin for authentication
    function privilegedMint(uint256 amount) external {
        require(tx.origin == owner, "Not owner");
        balances[msg.sender] += amount;
    }
    
    // VULNERABILITY: Self-destruct without checks
    function destroy() external {
        selfdestruct(payable(msg.sender));
    }
    
    // VULNERABILITY: Delegate call to arbitrary address
    function executeDelegateCall(address target, bytes calldata data) external {
        target.delegatecall(data);
    }
    
    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
        owner = msg.sender;
        authorized[msg.sender] = true;
    }
    
    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}
