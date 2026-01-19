// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ScDelegationLib} from "./ScDelegationLib.sol";

/// @notice External verifier contract for SC-DELEGATION proofs.
/// @dev Kept as a separate contract so AssociationsStore stays under the 24KB bytecode limit.
contract ScDelegationVerifier {
    function validate(bytes32 hash, address signer, bytes calldata proof, ScDelegationLib.Config calldata cfg)
        external
        view
        returns (bool)
    {
        return ScDelegationLib.validate(hash, signer, proof, cfg);
    }
}

