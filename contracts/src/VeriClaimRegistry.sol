// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title VeriClaimRegistry
/// @notice Arc Testnet proof registry for VeriClaim MarketSpec hashes.
/// @dev Stores only hashes and metadata URIs; never full claim or MarketSpec text.
contract VeriClaimRegistry is Ownable, Pausable {
    struct Spec {
        address creator;
        bytes32 specHash;
        string metadataURI;
        uint256 forgerAgentId;
        uint256 criticAgentId;
        uint256 judgeAgentId;
        uint256 createdAt;
        bool exists;
    }

    error InvalidSpecHash();
    error InvalidMetadataURI();
    error InvalidAgentId();
    error DuplicateSpecHash();
    error SpecDoesNotExist();
    error InvalidValidationHash();
    error InvalidVerdict();
    error InvalidQualityScore();
    error InvalidChallengeHash();
    error InvalidReasonURI();

    uint256 public nextSpecId = 1;

    mapping(uint256 specId => Spec spec) public specs;
    mapping(bytes32 specHash => uint256 specId) public specIdByHash;

    event SpecPublished(
        uint256 indexed specId,
        address indexed creator,
        bytes32 indexed specHash,
        string metadataURI,
        uint256 forgerAgentId,
        uint256 criticAgentId,
        uint256 judgeAgentId
    );

    event ValidationRecorded(
        uint256 indexed specId,
        bytes32 indexed validationHash,
        uint8 verdict,
        uint256 qualityScore
    );

    event ReputationEventRecorded(
        uint256 indexed agentId,
        int256 delta,
        string reasonURI
    );

    event SpecChallenged(
        uint256 indexed specId,
        bytes32 indexed challengeHash,
        string reasonURI
    );

    constructor() Ownable(msg.sender) {}

    function publishSpec(
        bytes32 specHash,
        string calldata metadataURI,
        uint256 forgerAgentId,
        uint256 criticAgentId,
        uint256 judgeAgentId
    ) external whenNotPaused returns (uint256 specId) {
        if (specHash == bytes32(0)) revert InvalidSpecHash();
        if (bytes(metadataURI).length == 0) revert InvalidMetadataURI();
        if (
            forgerAgentId == 0 ||
            criticAgentId == 0 ||
            judgeAgentId == 0
        ) revert InvalidAgentId();
        if (specIdByHash[specHash] != 0) revert DuplicateSpecHash();

        specId = nextSpecId++;
        specs[specId] = Spec({
            creator: msg.sender,
            specHash: specHash,
            metadataURI: metadataURI,
            forgerAgentId: forgerAgentId,
            criticAgentId: criticAgentId,
            judgeAgentId: judgeAgentId,
            createdAt: block.timestamp,
            exists: true
        });
        specIdByHash[specHash] = specId;

        emit SpecPublished(
            specId,
            msg.sender,
            specHash,
            metadataURI,
            forgerAgentId,
            criticAgentId,
            judgeAgentId
        );
    }

    function recordValidation(
        uint256 specId,
        bytes32 validationHash,
        uint8 verdict,
        uint256 qualityScore
    ) external whenNotPaused {
        if (!specs[specId].exists) revert SpecDoesNotExist();
        if (validationHash == bytes32(0)) revert InvalidValidationHash();
        if (verdict > 2) revert InvalidVerdict();
        if (qualityScore > 100) revert InvalidQualityScore();

        emit ValidationRecorded(specId, validationHash, verdict, qualityScore);
    }

    function recordReputationEvent(
        uint256 agentId,
        int256 delta,
        string calldata reasonURI
    ) external whenNotPaused {
        if (agentId == 0) revert InvalidAgentId();
        if (bytes(reasonURI).length == 0) revert InvalidReasonURI();

        emit ReputationEventRecorded(agentId, delta, reasonURI);
    }

    function challengeSpec(
        uint256 specId,
        bytes32 challengeHash,
        string calldata reasonURI
    ) external whenNotPaused {
        if (!specs[specId].exists) revert SpecDoesNotExist();
        if (challengeHash == bytes32(0)) revert InvalidChallengeHash();
        if (bytes(reasonURI).length == 0) revert InvalidReasonURI();

        emit SpecChallenged(specId, challengeHash, reasonURI);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
