// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {VeriClaimRegistry} from "../src/VeriClaimRegistry.sol";

contract Deploy is Script {
    function run() external returns (VeriClaimRegistry registry) {
        vm.startBroadcast();
        registry = new VeriClaimRegistry();
        vm.stopBroadcast();

        console2.log("VeriClaimRegistry deployed at", address(registry));
    }
}
