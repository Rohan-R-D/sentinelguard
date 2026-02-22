// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SentinelRegistry {
    mapping(address => uint8) private _scores;
    mapping(address => string) private _ipfsHashes;

    address public auditor;

    event ScoreUpdated(address indexed contractAddress, uint8 score, string ipfsHash);

    modifier onlyAuditor() {
        require(msg.sender == auditor, "Not authorized");
        _;
    }

    constructor(address _auditor) {
        require(_auditor != address(0), "Invalid auditor");
        auditor = _auditor;
    }

    function updateScore(
        address contractAddr,
        uint8 score,
        string calldata ipfsHash
    ) external onlyAuditor {
        require(contractAddr != address(0), "Invalid contract");
        require(score <= 100, "Score out of range");

        _scores[contractAddr] = score;
        _ipfsHashes[contractAddr] = ipfsHash;

        emit ScoreUpdated(contractAddr, score, ipfsHash);
    }

    function getScore(address contractAddr)
        external
        view
        returns (uint8 score, string memory ipfsHash)
    {
        score = _scores[contractAddr];
        ipfsHash = _ipfsHashes[contractAddr];
    }

    function setAuditor(address newAuditor) external onlyAuditor {
        require(newAuditor != address(0), "Invalid auditor");
        auditor = newAuditor;
    }
}

