# ERC-8092 Association Delegation Test App

This app demonstrates the full flow of:
1. Fetching an agent account from the discovery service
2. Creating an ERC-8092 association with initiator (EOA) and approver (agent account)
3. Storing the association on-chain with initiator signature
4. Updating the approver signature using the agent account via ERC-4337 (gasless)

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
- `ASSOCIATIONS_STORE_PROXY` - Associations Store proxy address (default: 0x3418A5297C75989000985802B8ab01229CDDDD24)

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

## What It Does

1. **Fetches Agent Account**: Uses the discovery service to get the agent account address for the specified `AGENT_ID`, or uses `AGENT_ACCOUNT_ADDRESS` if provided.

2. **Creates Association Record**: Creates an ERC-8092 `AssociatedAccountRecord` with:
   - Initiator: The EOA from `INITIATOR_PRIVATE_KEY`
   - Approver: The agent account (smart account)
   - Key types: `0x0001` (K1/EOA) for initiator, `0x8002` (ERC1271) for approver

3. **Stores Association**: Sends a transaction from the initiator EOA to store the association with the initiator signature.

4. **Updates Approver Signature**: Uses ERC-4337 to send a gasless transaction from the agent account to update the approver signature. The signature is signed by the agent owner EOA and validated via ERC-1271 on the agent account.

## Notes

- The app uses `0x8002` (ERC1271) as the key type for smart accounts, not `0x8001`.
- Signatures for ERC-1271 validation are created by signing the raw EIP-712 hash directly (without message prefix).
- The agent account must be a contract (smart account) that supports ERC-1271 validation.
- The agent owner EOA private key must match the owner of the agent account.

