// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Stapal} from "../src/Stapal.sol";
import {Vm} from "forge-std/Vm.sol";

// Deploy on Arbitrum Sepolia
contract DeployStapal is Script {
    address public stapal;
    address public constant ENTROPY_ADDRESS =
        0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440;
    address public constant PYTH_CONTRACT =
        0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF;
    address pyusdContract;

    function run() public {
        pyusdContract = Vm(address(vm)).getDeployment(
            "MockPYUSD",
            uint64(block.chainid)
        );

        vm.startBroadcast();
        stapal = address(
            new Stapal(ENTROPY_ADDRESS, PYTH_CONTRACT, pyusdContract)
        );
        vm.stopBroadcast();

        console.log("Stapal deployed to:", stapal);
    }
}
