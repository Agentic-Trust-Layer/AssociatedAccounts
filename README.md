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
| **Proxy** | `0x8346903837f89BaC08B095DbF5c1095071a0f349` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x8346903837f89bac08b095dbf5c1095071a0f349) |
| Implementation | `0x8a0d549E7799D54B7730BB167Ff92983b1F3e5b5` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x8a0d549e7799d54b7730bb167ff92983b1f3e5b5) |
| ProxyAdmin | `0x341aA8119033340173C1A6944124d52bF8198551` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x341aa8119033340173c1a6944124d52bf8198551) |
| ScDelegationEnforcer (marker) | `0xd92ccc840b130920c2041BEEd4dB143d8EbF72a8` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xd92ccc840b130920c2041beed4db143d8ebf72a8) |
| ScDelegationVerifier | `0x3F5795716DffEc92bd3eb861BBc9Bc01d5b9bCb9` | [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x3f5795716dffec92bd3eb861bbc9bc01d5b9bcb9) |

> **Note:** Always interact with the Proxy address. The implementation contract contains the logic, but the proxy maintains the state and is upgradeable. 

## Updated Features

- **Signature updates**: `updateAssociationSignatures(bytes32 associationId, bytes initiatorSignature, bytes approverSignature)` allows updating **either** signature on an existing association (only the initiator can update the initiator signature; only the approver can update the approver signature).
- **ERC-1271 support**: ERC-1271 validation uses the standard `bytes4` magic value return from `isValidSignature(bytes32,bytes)` (`0x1626ba7e`).
- **MetaMask Smart Account delegation examples**:
  - **Execution delegation**: see `apps/assoc-delegation` for an end-to-end example where a **session smart account** redeems a delegation to execute `updateAssociationSignatures` as the agent account (gasless via bundler).
  - **SC-DELEGATION (0x8004)**: a new keyType that allows third parties to validate an approver signature created by a **delegate/session key**, backed by a MetaMask Delegation Framework chain.

## SC-DELEGATION (keyType `0x8004`) — Detailed Design

### Goal

ERC-1271 alone cannot “magically” treat a delegate’s ECDSA signature as the delegator’s signature unless the smart account’s `isValidSignature` explicitly implements delegation proof verification. **SC-DELEGATION adds delegation-aware signature verification to ERC-8092 association records** by validating a MetaMask Delegation Framework chain directly in the AssociatedAccounts contract stack.

### Where it’s validated (on-chain)

- `AssociationsStore.storeAssociation(...)` validates the incoming `SignedAssociationRecord`
- `AssociationsStore.updateAssociationSignatures(...)` **re-validates** after updating signatures
- both use:
  - `AssociatedAccountsLib.validateAssociatedAccountWithConfig(...)`
  - which dispatches `approverKeyType == SC_DELEGATION (0x8004)` to an **external verifier**:
    - `IScDelegationVerifier(scDelegationVerifier).validate(hash, approverAddress, proof, cfg)`

> We use an external `ScDelegationVerifier` because `AssociationsStore` must remain under the EVM 24KB contract size limit.

### Required configuration (per AssociationsStore proxy)

The proxy stores these addresses (set at `initialize(...)` and updatable by owner via `setDelegationConfig(...)`):

- `delegationManager`: MetaMask DelegationManager contract address (verifying contract for DF EIP-712 signatures)
- `scDelegationEnforcer`: a stable **marker address** that must appear in the root delegation as a “binding caveat”
- `scDelegationVerifier`: external verifier contract used for SC-DELEGATION validation

If any are unset (zero), SC-DELEGATION validation fails.

### Proof format (what goes in `initiatorSignature` / `approverSignature`)

When `initiatorKeyType = 0x8004` **or** `approverKeyType = 0x8004`, the corresponding signature field must be an ABI-encoded proof:

```solidity
// Solidity shape (see ScDelegationLib.Proof)
struct Proof {
  address delegate;        // session/delegate EOA
  bytes   delegateSignature; // ECDSA signature over the raw association digest (bytes32)
  bytes   delegations;     // abi.encode(Delegation[]) - MetaMask DF delegation chain
}

bytes approverSignature = abi.encode(Proof(delegate, delegateSignature, delegations));
```

### What is signed, exactly?

- **Association digest**: `hash = AssociatedAccountsLib.eip712Hash(record)`
- **Delegate signs**: `delegateSignature = sign(hash)` (ECDSA over raw `bytes32`, no message prefix)

### Delegation chain requirements (MetaMask DF)

The proof contains a delegation chain `Delegation[]` (decoded from `proof.delegations`), and SC-DELEGATION validates:

- **Chain endpoints**
  - `delegations[0].delegator == approver` (the association record’s approver address)
  - `delegations[last].delegate == proof.delegate` (the session/delegate EOA)
- **Root authority**
  - `delegations[0].authority == ROOT_AUTHORITY` (`0xffff...ffff`)
- **Authority linking**
  - for `i>0`: `delegations[i].authority == hashDelegationStruct(delegations[i-1])`
- **Delegator ↔ delegate linking**
  - for `i < last`: `delegations[i+1].delegator == delegations[i].delegate`
- **Not disabled**
  - for each delegation `d`: `DelegationManager.disabledDelegations(hashDelegationStruct(d)) == false`
- **Valid DF signatures (EIP-712)**
  - for each delegation `d`:
    - compute DF EIP-712 typed digest using domain:
      - name=`DelegationManager`
      - version=`1`
      - chainId=`block.chainid`
      - verifyingContract=`delegationManager`
    - require `SignatureChecker.isValidSignatureNow(d.delegator, typedDigest, d.signature)`
      - this supports EOA and ERC-1271 delegators

#### Why `DelegationManager` is the EIP-712 `verifyingContract`

MetaMask Delegation Framework (DF) delegations are **signed “for” the DelegationManager contract**, not for `AssociationsStore` and not for the approver smart account. Concretely:

- **What’s being signed**: each delegation’s `signature` authorizes a specific `Delegation` struct (delegate, delegator, authority chain, caveats, salt).
- **Who verifies those signatures on-chain**: the DF verification rules are anchored to the DelegationManager contract and its EIP-712 domain.

In `ScDelegationLib`, we reproduce the toolkit’s domain separator:

- **domain.name**: `DelegationManager`
- **domain.version**: `1`
- **domain.chainId**: `block.chainid`
- **domain.verifyingContract**: the on-chain DelegationManager address stored in `AssociationsStore.delegationManager`

Then for each `Delegation` in the chain we compute:

\[
typedDigest = keccak256(\"\\x19\\x01\" \\|\\| domainSeparator \\|\\| hashDelegationStruct(delegation))
\]

and we check:

- `SignatureChecker.isValidSignatureNow(delegation.delegator, typedDigest, delegation.signature)`

This is why `delegationManager` is part of the SC-DELEGATION config: if you point at a different DelegationManager address, you change the EIP-712 domain separator, and all DF signatures become invalid under this scheme.

### Binding caveat (prevents “sign-anything”)

SC-DELEGATION requires a root delegation caveat that binds the delegation to a specific association digest:

- the root delegation (`delegations[0]`) must contain a caveat where:
  - `caveat.enforcer == scDelegationEnforcer`
  - `caveat.terms` is exactly 32 bytes and equals the association digest (`bytes32(hash)`)

This is a “marker” caveat check done by `ScDelegationLib` — it does **not** invoke DF caveat hooks. The marker address exists to give you a stable enforcer address to include in the delegation’s caveats.

### How this differs from “execution delegation”

- **Execution delegation** (typical DF use): session key redeems a delegation to execute a call via DelegationManager.
- **SC-DELEGATION** (this repo): session key signs an off-chain digest, and **any third party** can validate that signature on-chain via ERC-8092 validation, because the contract verifies the DF delegation chain and binding caveat.


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
