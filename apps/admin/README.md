## Associated Accounts Admin (Next.js)

### Setup

Create `apps/admin/.env.local`:

```bash
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/..."
ADMIN_PRIVATE_KEY="0x..."
ASSOCIATIONS_STORE_PROXY="0x8346903837f89BaC08B095DbF5c1095071a0f349"
AGENTIC_TRUST_DISCOVERY_URL="https://.../graphql-or-base"
AGENTIC_TRUST_DISCOVERY_API_KEY="..."
AGENTIC_TRUST_ADMIN_PRIVATE_KEY="0x..." # optional; only needed if you use Agentic Trust signing features
AGENTIC_TRUST_RPC_URL_11155111="https://eth-sepolia.g.alchemy.com/v2/..." # used by @agentic-trust/core
AGENTIC_TRUST_IDENTITY_REGISTRY_11155111="0x..." # your ERC-8004 identity registry address (if needed)
AGENTIC_TRUST_REPUTATION_REGISTRY_11155111="0x..." # (if needed)
```

### Run

```bash
cd /home/barb/aa/AssociatedAccounts/apps/admin
npm install
npm run dev
```


