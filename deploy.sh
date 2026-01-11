#!/bin/bash
# Deployment script for AssociationsStore to Sepolia
# Usage: export SEPOLIA_RPC_URL="..." DEPLOY_PRIVATE_KEY="..." [ETHERSCAN_API_KEY="..."]
# Then: bash deploy.sh

set -e

if [ -z "$SEPOLIA_RPC_URL" ]; then
  echo "Error: SEPOLIA_RPC_URL environment variable is not set"
  exit 1
fi

if [ -z "$DEPLOY_PRIVATE_KEY" ]; then
  echo "Error: DEPLOY_PRIVATE_KEY environment variable is not set"
  exit 1
fi

echo "Deploying AssociationsStore to Sepolia..."
echo "RPC URL: ${SEPOLIA_RPC_URL:0:30}..."
echo "Deployer address will be derived from private key"

if [ -n "$ETHERSCAN_API_KEY" ]; then
  echo "Etherscan API key provided - contracts will be verified"
  forge script script/Deploy.s.sol:Deploy \
    --rpc-url "$SEPOLIA_RPC_URL" \
    --broadcast \
    --verify \
    --etherscan-api-key "$ETHERSCAN_API_KEY" \
    -vvvv
else
  echo "No Etherscan API key - contracts will NOT be verified"
  forge script script/Deploy.s.sol:Deploy \
    --rpc-url "$SEPOLIA_RPC_URL" \
    --broadcast \
    -vvvv
fi

echo ""
echo "Deployment complete! Check the output above for contract addresses."
