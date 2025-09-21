// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library HuddleLib {
    error ZeroAddressDetected();
    error FieldCannotBeEmpty();
    error CounterOverflow();
    error CounterUnderflow();

    function validateAddress(address addr) internal pure {
        if (addr == address(0)) revert ZeroAddressDetected();
    }

    function validateString(string calldata str) internal pure {
        if (bytes(str).length == 0) revert FieldCannotBeEmpty();
    }

    function calculateFee(uint256 amount, uint256 feePercent) internal pure returns (uint256 fee, uint256 net) {
        unchecked {
            fee = (amount * feePercent) / 10000;
            net = amount - fee;
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}