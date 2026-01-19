// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal interface for MetaMask DelegationManager functions needed by SC-DELEGATION validation.
interface IDelegationManager {
    function disabledDelegations(bytes32 delegationHash) external view returns (bool isDisabled);
}

