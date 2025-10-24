// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MockPYUSD} from "../src/MockPYUSD.sol";

contract DeployMockPYUSD is Script {
    address public mockPYUSD;

    function run() public {
        vm.startBroadcast();
        mockPYUSD = address(new MockPYUSD());
        vm.stopBroadcast();

        console.log("MockPYUSD deployed to:", mockPYUSD);
    }
}
