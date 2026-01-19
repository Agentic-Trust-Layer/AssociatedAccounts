// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Optional marker caveat enforcer address for SC-DELEGATION binding.
/// @dev SC-DELEGATION verification checks `caveat.enforcer == scDelegationEnforcer` and that `terms == digest`.
///      We don't require this contract to implement the DF enforcer interface for signature validation; it is
///      useful as a stable deployable address to reference in delegations/caveats.
contract ScDelegationEnforcer {}

