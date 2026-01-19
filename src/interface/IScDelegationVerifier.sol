// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ScDelegationLib} from "../ScDelegationLib.sol";

interface IScDelegationVerifier {
    function validate(bytes32 hash, address signer, bytes calldata proof, ScDelegationLib.Config calldata cfg)
        external
        view
        returns (bool);
}

