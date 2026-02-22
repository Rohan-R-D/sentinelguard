// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RewardManager {
    IERC20 public immutable token;
    address public auditor;

    event RewardSent(address indexed recipient, uint8 score, uint256 amount);

    modifier onlyAuditor() {
        require(msg.sender == auditor, "Not authorized");
        _;
    }

    constructor(address tokenAddress, address _auditor) {
        require(tokenAddress != address(0), "Invalid token");
        require(_auditor != address(0), "Invalid auditor");
        token = IERC20(tokenAddress);
        auditor = _auditor;
    }

    function reward(address recipient, uint8 score) external onlyAuditor {
        require(recipient != address(0), "Invalid recipient");
        require(score <= 100, "Score out of range");

        uint256 amount = 0;

        if (score >= 90) {
            amount = 100 * 10 ** 18;
        } else if (score >= 80) {
            amount = 50 * 10 ** 18;
        } else if (score >= 60) {
            amount = 10 * 10 ** 18;
        }

        if (amount > 0) {
            token.transfer(recipient, amount);
        }

        emit RewardSent(recipient, score, amount);
    }

    function setAuditor(address newAuditor) external onlyAuditor {
        require(newAuditor != address(0), "Invalid auditor");
        auditor = newAuditor;
    }
}

