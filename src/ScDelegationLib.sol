// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SignatureChecker} from "lib/openzeppelin-contracts/contracts/utils/cryptography/SignatureChecker.sol";
import {IDelegationManager} from "./interface/IDelegationManager.sol";

/// @notice Minimal MetaMask Delegation Framework verifier for SC-DELEGATION.
/// @dev This is a custom “message authorization” scheme:
///      - a delegate EOA signs an arbitrary hash (the ERC-8092 association digest)
///      - a delegation chain from the approver (delegator) to the delegate is provided
///      - delegations are verified via MetaMask DelegationManager EIP-712 typed signatures
///      - a required “binding caveat” is checked by presence of (enforcer == scDelegationEnforcer, terms == hash)
library ScDelegationLib {
    // Mirrors @metamask/delegation-core
    bytes32 internal constant ROOT_AUTHORITY =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    // From @metamask/delegation-core/dist/index.mjs
    bytes32 internal constant DELEGATION_TYPEHASH =
        0x88c1d2ecf185adf710588203a5f263f0ff61be0d33da39792cde19ba9aa4331e;
    bytes32 internal constant CAVEAT_TYPEHASH =
        0x80ad7e1b04ee6d994a125f4714ca0720908bd80ed16063ec8aee4b88e9253e2d;

    // EIP-712 domain for DelegationManager (toolkit default: name=DelegationManager, version=1)
    bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 internal constant DELEGATION_MANAGER_NAME_HASH = keccak256("DelegationManager");
    bytes32 internal constant DELEGATION_MANAGER_VERSION_HASH = keccak256("1");

    struct Caveat {
        address enforcer;
        bytes terms;
        bytes args;
    }

    struct Delegation {
        address delegate;
        address delegator;
        bytes32 authority;
        Caveat[] caveats;
        uint256 salt;
        bytes signature;
    }

    struct Proof {
        address delegate; // final delegate/session EOA
        bytes delegateSignature; // ECDSA over the raw hash
        bytes delegations; // abi.encode(Delegation[]) (MetaMask DF shape)
    }

    struct Config {
        address delegationManager;
        address scDelegationEnforcer;
    }

    function validate(bytes32 hash, address signer, bytes memory proofBytes, Config memory cfg)
        internal
        view
        returns (bool)
    {
        if (cfg.delegationManager == address(0) || cfg.scDelegationEnforcer == address(0)) return false;

        Proof memory p = abi.decode(proofBytes, (Proof));
        if (p.delegate == address(0)) return false;
        if (p.delegateSignature.length == 0) return false;
        if (p.delegations.length == 0) return false;

        // 1) delegate must have signed the raw hash bytes
        // Support both EOAs (ECDSA) and contract delegates (ERC-1271).
        if (!SignatureChecker.isValidSignatureNow(p.delegate, hash, p.delegateSignature)) return false;

        // 2) verify delegation chain
        Delegation[] memory ds = abi.decode(p.delegations, (Delegation[]));
        if (ds.length == 0) return false;
        if (ds[0].delegator != signer) return false;
        if (ds[ds.length - 1].delegate != p.delegate) return false;
        // Require digest-binding caveat on the delegation that targets the leaf delegate.
        // This enables session-package roots (agent -> session) to remain stable while allowing per-digest binding
        // on a later hop (session -> leaf).
        if (!_hasBindingCaveatToLeaf(ds, cfg.scDelegationEnforcer, hash, p.delegate)) return false;

        bytes32 prevOffchainHash = bytes32(0);
        for (uint256 i = 0; i < ds.length; i++) {
            Delegation memory d = ds[i];

            // chain linking: next.delegator == current.delegate
            if (i + 1 < ds.length) {
                if (ds[i + 1].delegator != d.delegate) return false;
            }

            // authority linking
            if (i == 0) {
                if (d.authority != ROOT_AUTHORITY) return false;
            } else {
                if (d.authority != prevOffchainHash) return false;
            }

            // signature validity (MetaMask DelegationManager EIP-712)
            bytes32 offchainHash = _hashDelegationOffchain(d);
            if (IDelegationManager(cfg.delegationManager).disabledDelegations(offchainHash)) return false;

            bytes32 typedDigest = _hashDelegationTyped(d, cfg.delegationManager);
            if (!SignatureChecker.isValidSignatureNow(d.delegator, typedDigest, d.signature)) return false;

            prevOffchainHash = offchainHash;
        }

        return true;
    }

    function _hasBindingCaveatToLeaf(Delegation[] memory ds, address enforcer, bytes32 hash, address leafDelegate)
        private
        pure
        returns (bool)
    {
        for (uint256 i = 0; i < ds.length; i++) {
            if (ds[i].delegate != leafDelegate) continue;
            if (_hasBindingCaveat(ds[i].caveats, enforcer, hash)) return true;
        }
        return false;
    }

    function _hasBindingCaveat(Caveat[] memory caveats, address enforcer, bytes32 hash) private pure returns (bool) {
        for (uint256 i = 0; i < caveats.length; i++) {
            if (caveats[i].enforcer != enforcer) continue;
            bytes memory terms = caveats[i].terms;
            if (terms.length != 32) continue;
            bytes32 termsHash = bytes32(0);
            assembly {
                termsHash := mload(add(terms, 0x20))
            }
            if (termsHash == hash) return true;
        }
        return false;
    }

    function _hashDelegationTyped(Delegation memory d, address delegationManager) private view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                DELEGATION_MANAGER_NAME_HASH,
                DELEGATION_MANAGER_VERSION_HASH,
                block.chainid,
                delegationManager
            )
        );
        bytes32 structHash = _hashDelegationStruct(d);
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function _hashDelegationOffchain(Delegation memory d) private pure returns (bytes32) {
        return _hashDelegationStruct(d);
    }

    function _hashDelegationStruct(Delegation memory d) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DELEGATION_TYPEHASH,
                d.delegate,
                d.delegator,
                d.authority,
                _hashCaveatsArray(d.caveats),
                d.salt
            )
        );
    }

    function _hashCaveatsArray(Caveat[] memory caveats) private pure returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](caveats.length);
        for (uint256 i = 0; i < caveats.length; i++) {
            hashes[i] = _hashCaveat(caveats[i]);
        }
        return keccak256(abi.encodePacked(hashes));
    }

    function _hashCaveat(Caveat memory c) private pure returns (bytes32) {
        return keccak256(abi.encode(CAVEAT_TYPEHASH, c.enforcer, keccak256(c.terms)));
    }
}

