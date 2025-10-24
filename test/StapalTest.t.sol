// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {Stapal} from "../src/Stapal.sol";
import {MockPYUSD} from "../src/MockPYUSD.sol";

contract StapalTest is Test {
    Stapal public stapal;
    MockPYUSD public mockPYUSD;
    address public admin;
    address public merchant;

    function setUp() public {
        admin = makeAddr("admin");
        merchant = makeAddr("merchant");

        vm.startPrank(admin);
        mockPYUSD = new MockPYUSD();
        stapal = new Stapal(address(0), address(0), address(mockPYUSD));
        vm.stopPrank();
    }

    function testBuy() public {
        vm.prank(admin);
        stapal.addMerchant(merchant);

        vm.startPrank(admin);
        mockPYUSD.approve(address(stapal), 100);
        vm.stopPrank();

        vm.prank(admin);
        stapal.buy(admin, merchant, 100);

        console.log(
            "Receiver balance of merchant:",
            mockPYUSD.balanceOf(merchant)
        );
    }
}
