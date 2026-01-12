## Associated Accounts

This specification defines a standard for establishing and verifying associations between accounts. This allows addresses to publicly declare and prove a relationship with other addresses, enabling use cases like sub-account identity inheritance, authorization delegation, and reputation collation. 

This repo implements:

- **`AssociatedAccounts`** - The core interface defining the structs (`AssociatedAccountRecord` and `SignedAssociationRecord`), events, and storage functions for the ERC-8092 standard
- **`AssociatedAccountsLib`** - A helper library providing validation, EIP-712 hashing, and signature verification utilities for Associated Account records
- **`AssociationsStore`** - A reference implementation of an onchain storage contract for managing associations with features like account lookup, active association filtering, and revocation 

## Deployments

The Associations Store has been deployed to **Ethereum Sepolia (chainId 11155111)** behind a **Transparent Upgradeable Proxy**.
This allows upgrading the implementation while keeping state at the proxy address.

| Contract | Address | Link |
|----------|---------|------|
| **Proxy** | `0x3418a5297c75989000985802b8ab01229cdddd24` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x3418a5297c75989000985802b8ab01229cdddd24) |
| Implementation | `0x3075039024b10c408c6ea8fd78fa9f66f29e4ea4` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x3075039024b10c408c6ea8fd78fa9f66f29e4ea4) |
| ProxyAdmin | `0xe413652dc3aa3915ead3813b29f0051e68b3194a` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xe413652dc3aa3915ead3813b29f0051e68b3194a) |

> **Note:** Always interact with the Proxy address. The implementation contract contains the logic, but the proxy maintains the state and is upgradeable. 

## Updated Features

- **Signature updates**: `updateAssociationSignatures(bytes32 associationId, bytes initiatorSignature, bytes approverSignature)` allows updating **either** signature on an existing association (only the initiator can update the initiator signature; only the approver can update the approver signature).
- **ERC-1271 support**: ERC-1271 validation uses the standard `bytes4` magic value return from `isValidSignature(bytes32,bytes)` (`0x1626ba7e`).
- **MetaMask Smart Account delegation examples**: see `apps/assoc-delegation` for an end-to-end example where a **session smart account** redeems a delegation to execute `updateAssociationSignatures` as the agent account (gasless via bundler).


## Documentation

The ERC draft can be found in this PR (will update to canonical link once merged):
https://github.com/ethereum/ERCs/pull/1377/files

## Installation

### As a Foundry dependency

```shell
forge install stevieraykatz/AssociatedAccounts
```

## Development

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Format

```shell
forge fmt
```
