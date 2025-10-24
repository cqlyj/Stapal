// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IEntropyConsumer} from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import {IEntropyV2} from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import {MockPYUSD} from "./MockPYUSD.sol";
import {PythUtils} from "@pythnetwork/pyth-sdk-solidity/PythUtils.sol";

contract Stapal is IEntropyConsumer {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    address public admin;
    mapping(address => bool) public merchants;
    IEntropyV2 public entropy;
    IPyth public pyth;
    // USD/TWD price feed ID
    bytes32 constant PRICE_FEED_ID =
        0x489f02f2f13584026d63fd397c80ed3b414a2820c4d43da0306fc007fcd5a8e0;
    mapping(uint256 receiptId => address customer) public receipts;
    MockPYUSD public pyusd;
    uint256 public counter;
    address[] public currentWinners;
    uint256[] public currentAmounts;
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error NotAdmin();
    error NotMerchant();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposited(address indexed sender, uint256 amount);
    event Bought(
        address indexed sender,
        address indexed receiver,
        uint256 amount
    );
    event Distributed(address[] winners, uint256[] amounts);
    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyAdmin() {
        _onlyAdmin();
        _;
    }

    modifier onlyMerchant(address receiver) {
        _onlyMerchant(receiver);
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address entropyAddress,
        address pythContract,
        address pyusdContract
    ) {
        admin = msg.sender;
        entropy = IEntropyV2(entropyAddress);
        pyth = IPyth(pythContract);
        pyusd = MockPYUSD(pyusdContract);
        counter = 0;
    }

    /*//////////////////////////////////////////////////////////////
                     EXTERNAL AND PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    // For admin to deposit PYUSD to the contract
    function deposit(uint256 amount) external onlyAdmin {
        bool success = pyusd.transferFrom(msg.sender, address(this), amount);
        if (!success) {
            revert TransferFailed();
        }

        emit Deposited(msg.sender, amount);
    }

    function addMerchant(address merchant) external onlyAdmin {
        merchants[merchant] = true;
    }

    function removeMerchant(address merchant) external onlyAdmin {
        merchants[merchant] = false;
    }

    function buy(
        address sender,
        address receiver,
        uint256 amount
    ) external onlyMerchant(receiver) {
        bool success = pyusd.transferFrom(sender, receiver, amount);
        if (!success) {
            revert TransferFailed();
        }

        receipts[counter] = sender;
        counter++;

        emit Bought(sender, receiver, amount);
    }

    function draw(bytes[] memory priceUpdate) external onlyAdmin {
        // 1. get random number
        // 2. match digits adn find winners => The digits here requires to be padded to 8 digits
        // 3. update price
        // 4. calculate and distribute rewards
        requestRandomNumber();
        updatePriceAndDistribute(priceUpdate);
    }

    function requestRandomNumber() public payable {
        // Get the fee for the request
        uint256 fee = entropy.getFeeV2();

        // Request the random number with the callback
        entropy.requestV2{value: fee}();
    }

    function updatePriceAndDistribute(
        bytes[] memory priceUpdate
    ) public payable {
        // Submit a priceUpdate to the Pyth contract to update the on-chain price.
        // Updating the price requires paying the fee returned by getUpdateFee.
        // WARNING: These lines are required to ensure the getPriceNoOlderThan call below succeeds. If you remove them, transactions may fail with "0x19abf40e" error.
        uint fee = pyth.getUpdateFee(priceUpdate);
        pyth.updatePriceFeeds{value: fee}(priceUpdate);

        PythStructs.Price memory price = pyth.getPriceNoOlderThan(
            PRICE_FEED_ID,
            60
        );

        uint256[] memory pyusdAmounts = _calculatePyusdAmounts(
            currentAmounts,
            price
        );

        _distribute(currentWinners, pyusdAmounts);
    }

    /*//////////////////////////////////////////////////////////////
                     INTERNAL AND PRIVATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    // @param sequenceNumber The sequence number of the request.
    // @param provider The address of the provider that generated the random number. If your app uses multiple providers, you can use this argument to distinguish which one is calling the app back.
    // @param randomNumber The generated random number.
    // This method is called by the entropy contract when a random number is generated.
    // This method **must** be implemented on the same contract that requested the random number.
    // This method should **never** return an error -- if it returns an error, then the keeper will not be able to invoke the callback.
    // If you are having problems receiving the callback, the most likely cause is that the callback is erroring.
    // See the callback debugging guide here to identify the error https://docs.pyth.network/entropy/debug-callback-failures
    function entropyCallback(
        uint64 /*sequenceNumber*/,
        address /*provider*/,
        bytes32 randomNumber
    ) internal override {
        // convert the bytes32 to uint256
        uint256 fullVrf = uint256(randomNumber);

        // limit the vrf to at most 8 digits
        uint256 vrf = fullVrf % 100_000_000;

        // based on the vrf to find winners
        (address[] memory winners, uint256[] memory amounts) = _matchDigits(
            vrf
        );

        uint8 length = uint8(winners.length);
        for (uint8 i = 0; i < length; i++) {
            if (winners[i] != address(0)) {
                currentWinners[i] = winners[i];
                currentAmounts[i] = amounts[i];
            }
        }
    }

    function _calculatePyusdAmounts(
        uint256[] memory amounts,
        PythStructs.Price memory price
    ) internal pure returns (uint256[] memory pyusdAmounts) {
        uint256 basePrice = PythUtils.convertToUint(
            price.price,
            price.expo,
            18
        );

        for (uint8 i = 0; i < amounts.length; i++) {
            pyusdAmounts[i] = amounts[i] * basePrice;
        }
        return pyusdAmounts;
    }

    function _distribute(
        address[] memory winners,
        uint256[] memory pyusdAmounts
    ) internal {
        uint8 length = uint8(winners.length);

        for (uint8 i = 0; i < length; i++) {
            if (winners[i] != address(0)) {
                bool success = pyusd.transfer(winners[i], pyusdAmounts[i]);
                if (!success) {
                    revert TransferFailed();
                }
            }
        }

        emit Distributed(winners, pyusdAmounts);
    }

    // Rules:
    // For the last few digits, the more digits matched, the higher the reward.
    // if All match: 1000_000 TWD
    // if 7 match: 200_000 TWD
    // if 6 match: 50_000 TWD
    // if 5 match: 10_000 TWD
    // if 4 match: 1_000 TWD
    // Rest will not get any reward.
    function _matchDigits(
        uint256 vrf
    )
        internal
        view
        returns (address[] memory winners, uint256[] memory amounts)
    {
        uint256 vrf7 = vrf % 1e7;
        uint256 vrf6 = vrf % 1e6;
        uint256 vrf5 = vrf % 1e5;
        uint256 vrf4 = vrf % 1e4;

        winners[0] = receipts[vrf7];
        winners[1] = receipts[vrf6];
        winners[2] = receipts[vrf5];
        winners[3] = receipts[vrf4];

        if (winners[0] != address(0)) {
            amounts[0] = 1000_000;
        }
        if (winners[1] != address(0)) {
            amounts[1] = 50_000;
        }
        if (winners[2] != address(0)) {
            amounts[2] = 10_000;
        }
        if (winners[3] != address(0)) {
            amounts[3] = 1_000;
        }

        return (winners, amounts);
    }

    function _onlyAdmin() internal view {
        if (msg.sender != admin) {
            revert NotAdmin();
        }
    }

    function _onlyMerchant(address receiver) internal view {
        if (!merchants[receiver]) {
            revert NotMerchant();
        }
    }

    /*//////////////////////////////////////////////////////////////
                                GETTERS
    //////////////////////////////////////////////////////////////*/

    // This method is required by the IEntropyConsumer interface.
    // It returns the address of the entropy contract which will call the callback.
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }
}
