#!/bin/bash
# Check if required environment variables are set

echo "Checking environment variables for assoc-delegation app..."
echo ""

REQUIRED=(
  "ADMIN_PRIVATE_KEY"
  "INITIATOR_PRIVATE_KEY"
  "AGENT_OWNER_PRIVATE_KEY"
  "SEPOLIA_RPC_URL"
  "AGENTIC_TRUST_DISCOVERY_URL"
  "AGENTIC_TRUST_DISCOVERY_API_KEY"
  "AGENTIC_TRUST_BUNDLER_URL_SEPOLIA"
)

OPTIONAL=(
  "AGENT_ID"
  "AGENT_ACCOUNT_ADDRESS"
  "ASSOCIATIONS_STORE_PROXY"
)

missing=0

# Check required vars
echo "Required variables:"
for var in "${REQUIRED[@]}"; do
  if [ -z "${!var}" ]; then
    echo "  ❌ $var - NOT SET"
    ((missing++))
  else
    echo "  ✅ $var - set (${#!var} chars)"
  fi
done

echo ""
echo "Optional variables:"
for var in "${OPTIONAL[@]}"; do
  if [ -z "${!var}" ]; then
    echo "  ⚠️  $var - not set (will use default)"
  else
    echo "  ✅ $var - set"
  fi
done

echo ""
if [ $missing -eq 0 ]; then
  echo "✅ All required environment variables are set!"
else
  echo "❌ $missing required variable(s) missing!"
  echo ""
  echo "Add them to your .env file in the project root or create apps/assoc-delegation/.env.local"
  exit 1
fi

