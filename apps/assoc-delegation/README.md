# ERC-8092 Association Delegation Test App

This app demonstrates the full flow of:
1. Fetching an agent account from the discovery service
2. Creating an ERC-8092 association with initiator (EOA) and approver (agent account)
3. Storing the association on-chain with initiator signature
4. Updating the approver signature using a **session smart account + MetaMask delegation** (gasless via bundler)

## Deployments (Ethereum Sepolia)

- **AssociationsStore proxy**: `0x3d282c9E5054E3d819639246C177676A98cB0a1E` ([View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x3d282c9e5054e3d819639246c177676a98cb0a1e))
- **Implementation**: `0x1719f33e9F86d7a6AE905621C9dcAaa5e4214410` ([View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x1719f33e9f86d7a6ae905621c9dcaaa5e4214410))
- **ProxyAdmin**: `0x0C16e38cf224FF95bD241aA8051Db3995C9a2A4E` ([View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x0c16e38cf224ff95bd241aa8051db3995c9a2a4e))
- **ScDelegationEnforcer (marker)**: `0x107d5586Cb98C00d03B696d594eA15e6CE9F50d3` ([View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x107d5586cb98c00d03b696d594ea15e6ce9f50d3))
- **ScDelegationVerifier**: `0xAd762a8bBFafc2BeA41a2400F9bE5de8B5Fd1617` ([View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xad762a8bbfafc2bea41a2400f9be5de8b5fd1617))

## Environment Variables

The app uses environment variables from the root `.env` file or can have its own `.env.local` file.

### Required Variables

- `ADMIN_PRIVATE_KEY` - Admin wallet private key (used to fetch agents from discovery)
- `INITIATOR_PRIVATE_KEY` - EOA initiator private key (will sign initiator signature)
- `AGENT_OWNER_PRIVATE_KEY` - Agent owner EOA private key (must match the EOA owner of the agent account)
- `SEPOLIA_RPC_URL` - RPC URL for Sepolia network
- `AGENTIC_TRUST_DISCOVERY_URL` - Discovery service URL (default: https://8004-agent.io)
- `AGENTIC_TRUST_DISCOVERY_API_KEY` - Discovery service API key
- `AGENTIC_TRUST_BUNDLER_URL_SEPOLIA` - Bundler URL for ERC-4337 (e.g., Pimlico)

### Optional Variables

- `AGENT_ID` - Agent ID to use (default: 133)
- `AGENT_ACCOUNT_ADDRESS` - Override agent account address (if not set, will fetch from discovery)
- `ASSOCIATIONS_STORE_PROXY` - Associations Store proxy address (default: 0x3d282c9E5054E3d819639246C177676A98cB0a1E)

## Usage

1. Ensure all required environment variables are set in the root `.env` file or create `apps/assoc-delegation/.env.local`

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Build the SDK (if not already built):
   ```bash
   cd packages/erc8092-sdk && npm run build && cd ../..
   ```

4. Run the app:
   ```bash
   cd apps/assoc-delegation
   npm run dev
   ```

5. Open http://localhost:3000 (or the port Next.js assigns)

6. Click "Run Test" button to execute the association delegation test
7. Click "List Associations" to query all association records for the agent and display full details (including signatures and session delegate address for SC-DELEGATION).

## What It Does

1. **Fetches Agent Account**: Uses the discovery service to get the agent account address for the specified `AGENT_ID`, or uses `AGENT_ACCOUNT_ADDRESS` if provided.

2. **Creates Association Record**: Creates an ERC-8092 `AssociatedAccountRecord` with:
   - Initiator: The EOA from `INITIATOR_PRIVATE_KEY`
   - Approver: The agent account (smart account)
   - Key types: `0x0001` (K1/EOA) for initiator, `0x8004` (SC-DELEGATION) for approver

   Optional: set `INITIATOR_KEY_TYPE=0x8004` to make the **initiator signature** use SC-DELEGATION as well.

3. **Stores Association**: Sends a transaction from the initiator EOA to store the association with the initiator signature.

4. **Builds SC-DELEGATION approver signature proof (0x8004)**:
   - Creates a fresh **session delegate EOA**
   - The session delegate signs the **raw association digest** (ECDSA over `bytes32`)
   - Creates a MetaMask DF delegation chain from the agent account (approver) to the session EOA, with a **binding caveat**:
     - `caveat.enforcer == scDelegationEnforcer`
     - `caveat.terms == digest` (32 bytes)
   - Packs the proof into `approverSignature = abi.encode((address delegate, bytes delegateSignature, bytes delegations))`

5. **Updates Approver Signature (execution delegation)**:
   - Creates a fresh **session smart account**
   - Creates + signs a **MetaMask delegation** from the agent account to the session smart account, scoped to `updateAssociationSignatures(...)`
   - The session account sends a sponsored UserOp to `DelegationManager.redeemDelegations(...)`, which executes `updateAssociationSignatures(...)` **as the agent account**
   - The approver signature is the **SC-DELEGATION proof** (so third parties can validate it via ERC-8092 without relying on agent ERC-1271 being delegation-aware)

## Notes

- SC-DELEGATION (`0x8004`) is validated by the AssociationsStore/AssociatedAccountsLib stack, not by calling `agentAccount.isValidSignature(hash, signature)` directly.
- The session delegate signature is ECDSA over the raw EIP-712 digest bytes32 (no message prefix).
- The DelegationManager DF signatures are verified using EIP-712 domain: name=`DelegationManager`, version=`1`, chainId=`block.chainid`, verifyingContract=`delegationManager`.
- Most non-UI logic lives in `@associatedaccounts/erc8092-sdk` (EIP-712 hashing, DF typed digest helpers, SC-DELEGATION proof encode/decode, proxy probing).

## Updated Features

- **Update initiator or approver signatures**: the underlying contract supports updating either signature via `updateAssociationSignatures(...)`.
- **ERC-1271 support**: validation checks the standard magic value `0x1626ba7e`.
- **MetaMask Smart Account delegation**: this app includes a working example of session-account delegation + redemption to execute as the agent account.

