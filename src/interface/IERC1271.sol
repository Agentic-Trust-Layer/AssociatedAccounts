// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC1271 {
    /// @notice Validates the `signature` against the given `hash`.
    ///
    /// @dev MUST be defined by the implementation.
    /// @dev Returns the ERC-1271 magic value (0x1626ba7e) if valid, else 0xffffffff.
    ///
    /// @param hash      The hash whose signature has been performed on.
    /// @param signature The signature associated with `hash`.
    ///
    /// @return The ERC-1271 magic value (0x1626ba7e) if the signature is valid, else 0xffffffff.
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4);
}
