// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VeriClaimRegistry} from "../src/VeriClaimRegistry.sol";

contract VeriClaimRegistryTest is Test {
    VeriClaimRegistry internal registry;

    address internal alice = address(0xA11CE);
    bytes32 internal specHash = keccak256("vericlaim-spec");
    bytes32 internal validationHash = keccak256("validation");
    bytes32 internal challengeHash = keccak256("challenge");
    string internal metadataURI = "/spec/0x1234";

    function setUp() public {
        registry = new VeriClaimRegistry();
    }

    function publishDefaultSpec() internal returns (uint256 specId) {
        vm.prank(alice);
        specId = registry.publishSpec(specHash, metadataURI, 1, 2, 3);
    }

    function testPublishSpec() public {
        uint256 specId = publishDefaultSpec();

        (
            address creator,
            bytes32 savedHash,
            string memory savedUri,
            uint256 forgerAgentId,
            uint256 criticAgentId,
            uint256 judgeAgentId,
            uint256 createdAt,
            bool exists
        ) = registry.specs(specId);

        assertEq(specId, 1);
        assertEq(creator, alice);
        assertEq(savedHash, specHash);
        assertEq(savedUri, metadataURI);
        assertEq(forgerAgentId, 1);
        assertEq(criticAgentId, 2);
        assertEq(judgeAgentId, 3);
        assertGt(createdAt, 0);
        assertTrue(exists);
        assertEq(registry.specIdByHash(specHash), specId);
    }

    function testRejectDuplicateSpecHash() public {
        publishDefaultSpec();

        vm.expectRevert(VeriClaimRegistry.DuplicateSpecHash.selector);
        registry.publishSpec(specHash, metadataURI, 1, 2, 3);
    }

    function testRecordValidation() public {
        uint256 specId = publishDefaultSpec();

        registry.recordValidation(specId, validationHash, 1, 93);
    }

    function testRecordReputationEvent() public {
        registry.recordReputationEvent(1, 20, "/agents/1/reputation/1");
    }

    function testChallengeSpec() public {
        uint256 specId = publishDefaultSpec();

        registry.challengeSpec(specId, challengeHash, "/spec/0x1234/challenge/1");
    }

    function testPauseAndUnpauseBehavior() public {
        registry.pause();

        vm.expectRevert();
        registry.publishSpec(specHash, metadataURI, 1, 2, 3);

        registry.unpause();
        uint256 specId = registry.publishSpec(specHash, metadataURI, 1, 2, 3);

        assertEq(specId, 1);
    }

    function testInvalidSpecErrors() public {
        vm.expectRevert(VeriClaimRegistry.InvalidSpecHash.selector);
        registry.publishSpec(bytes32(0), metadataURI, 1, 2, 3);

        vm.expectRevert(VeriClaimRegistry.InvalidMetadataURI.selector);
        registry.publishSpec(specHash, "", 1, 2, 3);

        vm.expectRevert(VeriClaimRegistry.InvalidAgentId.selector);
        registry.publishSpec(specHash, metadataURI, 0, 2, 3);

        vm.expectRevert(VeriClaimRegistry.SpecDoesNotExist.selector);
        registry.recordValidation(999, validationHash, 1, 93);

        vm.expectRevert(VeriClaimRegistry.SpecDoesNotExist.selector);
        registry.challengeSpec(999, challengeHash, "/challenge/999");
    }

    function testValidationGuards() public {
        uint256 specId = publishDefaultSpec();

        vm.expectRevert(VeriClaimRegistry.InvalidValidationHash.selector);
        registry.recordValidation(specId, bytes32(0), 1, 93);

        vm.expectRevert(VeriClaimRegistry.InvalidVerdict.selector);
        registry.recordValidation(specId, validationHash, 3, 93);

        vm.expectRevert(VeriClaimRegistry.InvalidQualityScore.selector);
        registry.recordValidation(specId, validationHash, 1, 101);
    }

    function testChallengeGuards() public {
        uint256 specId = publishDefaultSpec();

        vm.expectRevert(VeriClaimRegistry.InvalidChallengeHash.selector);
        registry.challengeSpec(specId, bytes32(0), "/challenge/1");

        vm.expectRevert(VeriClaimRegistry.InvalidReasonURI.selector);
        registry.challengeSpec(specId, challengeHash, "");
    }
}
