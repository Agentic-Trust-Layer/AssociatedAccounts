export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { createPublicClient, createWalletClient, http, encodeFunctionData, parseAbi, parseEther, toFunctionSelector } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { toMetaMaskSmartAccount, Implementation, createDelegation, getSmartAccountsEnvironment, ExecutionMode } from "@metamask/smart-accounts-kit";
import { DelegationManager } from "@metamask/smart-accounts-kit/contracts";
import { encodeDelegations } from "@metamask/smart-accounts-kit/utils";
import { getChainRpcUrl, getChainBundlerUrl, requireChainEnvVar, getDiscoveryClient } from "@agentic-trust/core/server";
import { sendSponsoredUserOperation, waitForUserOperationReceipt } from "@agentic-trust/core";
import {
  ASSOCIATIONS_STORE_ABI,
  DF_ROOT_AUTHORITY,
  KEY_TYPE_ERC1271,
  KEY_TYPE_K1,
  KEY_TYPE_SC_DELEGATION,
  associationIdFromRecord,
  dfHashDelegationStruct,
  dfTypedDigest,
  eip712Hash,
  encodeScDelegationProof,
  formatEvmV1,
} from "@associatedaccounts/erc8092-sdk";
import { getAdminWallet, getInitiatorWallet, getAgentOwnerWallet, getSepoliaProvider, getOwnerAddress } from "@/lib/wallet";
import { getAgentId, getAgentAccountAddress, getAssociationsProxyAddressCandidates } from "@/lib/config";
import { getAgentById } from "@/lib/agentic";

const CHAIN_ID = 11155111; // Sepolia

export async function POST(req: Request) {
  try {
    // Always force the session-account delegation flow.
    // This means we will always create a fresh session smart account, create/sign a delegation,
    // and redeem it to run `updateAssociationSignatures`, even if the approver signature is already set.
    const forceDelegationUpdate = true;

    console.log("🚀 Starting ERC-8092 Association Delegation Test\n");

    // Step 1: Get agent account
    const agentId = getAgentId();
    console.log(`Step 1: Getting agent account for agentId ${agentId}`);

    const rpcUrl = getChainRpcUrl(CHAIN_ID);
    const bundlerUrl = getChainBundlerUrl(CHAIN_ID);
    if (!bundlerUrl) {
      throw new Error(`Bundler URL not configured for chain ${CHAIN_ID}`);
    }

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    const provider = getSepoliaProvider();
    let agentAccount: string;

    // Try to get from env first
    const envAgentAccount = getAgentAccountAddress();
    if (envAgentAccount) {
      agentAccount = envAgentAccount;
      console.log("✓ Using agent account from AGENT_ACCOUNT_ADDRESS env var:", agentAccount);
    } else {
      // Get agent owner EOA
      const adminWallet = getAdminWallet();
      const ownerAddress = await getOwnerAddress(adminWallet);

      // Use discovery client to get agent
      const agentInfo = await getAgentById(agentId, ownerAddress);
      if (!agentInfo || !agentInfo.agentAccount) {
        throw new Error(
          `Agent ID ${agentId} not found or agentAccount not available.\n` +
          `Set AGENT_ACCOUNT_ADDRESS environment variable to specify the agent account address directly.`
        );
      }
      agentAccount = agentInfo.agentAccount;
      console.log("✓ Agent account from discovery:", agentAccount);
    }

    // Step 2: Get agent owner EOA
    console.log("\nStep 2: Getting agent owner EOA");
    const agentOwnerEOA = (await publicClient.readContract({
      address: agentAccount as `0x${string}`,
      abi: [{ name: "owner", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }],
      functionName: "owner",
    })) as `0x${string}`;
    console.log("✓ Agent owner EOA:", agentOwnerEOA);

    // Verify agent owner private key matches
    const agentOwnerWallet = getAgentOwnerWallet();
    const agentOwnerAddress = await agentOwnerWallet.getAddress();
    if (agentOwnerAddress.toLowerCase() !== agentOwnerEOA.toLowerCase()) {
      throw new Error(
        `Agent owner private key does not match agent owner EOA.\n` +
        `Expected: ${agentOwnerEOA}\n` +
        `Got: ${agentOwnerAddress}`
      );
    }
    console.log("✓ Agent owner private key loaded");

    // Create agent account client for ERC-4337 transactions
    const agentOwnerAccount = privateKeyToAccount(agentOwnerWallet.privateKey as `0x${string}`);
    const agentWalletClient = createWalletClient({
      chain: sepolia,
      transport: http(rpcUrl),
      account: agentOwnerAccount,
    });

    const agentAccountClient = await toMetaMaskSmartAccount({
      address: agentAccount as `0x${string}`,
      client: publicClient as any,
      implementation: Implementation.Hybrid,
      signer: { walletClient: agentWalletClient as any },
    } as any);

    // Step 3: Get initiator EOA
    console.log("\nStep 3: Loading initiator EOA from INITIATOR_PRIVATE_KEY");
    const initiatorWallet = getInitiatorWallet();
    const initiatorAddress = await initiatorWallet.getAddress();
    console.log("✓ Initiator EOA:", initiatorAddress);

    // Step 4: Create ERC-8092 association record
    console.log("\nStep 4: Creating ERC-8092 association record");
    const latestBlock = await provider.getBlock("latest");
    const chainNow = Number(latestBlock?.timestamp ?? Math.floor(Date.now() / 1000));
    const validAt = Math.max(0, chainNow - 10); // Buffer for clock skew
    const validUntil = 0;
    const interfaceId = "0x00000000";
    const data = "0x";

    const initiatorBytes = formatEvmV1(CHAIN_ID, initiatorAddress);
    const approverBytes = formatEvmV1(CHAIN_ID, agentAccount);

    let record = {
      initiator: initiatorBytes,
      approver: approverBytes,
      validAt,
      validUntil,
      interfaceId,
      data,
    };

    let associationId = associationIdFromRecord(record);
    console.log("✓ Association ID:", associationId);

    // Pick the first proxy that matches the *current* AssociationsStore ABI (must expose delegationManager()).
    // This lets us survive stale `.env` values pointing at old proxies.
    const proxyCandidates = getAssociationsProxyAddressCandidates();
    const cfgAbi = parseAbi([
      "function delegationManager() view returns (address)",
      "function scDelegationEnforcer() view returns (address)",
    ]);
    let associationsProxy: string | null = null;
    for (const candidate of proxyCandidates) {
      try {
        // Check it has code
        const code = await publicClient.getBytecode({ address: candidate as `0x${string}` });
        if (!code || code === "0x") continue;
        // Check it implements the new config getters (old proxies will revert here)
        await publicClient.readContract({
          address: candidate as `0x${string}`,
          abi: cfgAbi,
          functionName: "delegationManager",
          args: [],
        });
        associationsProxy = candidate;
        break;
      } catch {
        // try next candidate
      }
    }
    if (!associationsProxy) {
      throw new Error(
        `No compatible AssociationsStore proxy found. Tried: ${proxyCandidates.join(", ")}. ` +
        `Set ASSOCIATIONS_STORE_PROXY to the newly deployed proxy.`
      );
    }
    console.log("✓ Using AssociationsStore proxy:", associationsProxy);

    // Fetch SC-DELEGATION config early (used for approver proof and optionally initiator proof).
    const dmAddr = (await publicClient.readContract({
      address: associationsProxy as `0x${string}`,
      abi: cfgAbi,
      functionName: "delegationManager",
      args: [],
    })) as `0x${string}`;
    const enforcerAddr = (await publicClient.readContract({
      address: associationsProxy as `0x${string}`,
      abi: cfgAbi,
      functionName: "scDelegationEnforcer",
      args: [],
    })) as `0x${string}`;
    if (dmAddr === "0x0000000000000000000000000000000000000000" || enforcerAddr === "0x0000000000000000000000000000000000000000") {
      throw new Error("AssociationsStore SC-DELEGATION config not initialized (delegationManager/scDelegationEnforcer are zero). Deploy/initialize new proxy.");
    }
    console.log("✓ DelegationManager:", dmAddr);
    console.log("✓ SC Delegation Enforcer:", enforcerAddr);

    // Step 5: Check if association already exists
    console.log("\nStep 5: Checking if association already exists on-chain...");
    let existingAssociation: any = null;
    try {
      const sars = await publicClient.readContract({
        address: associationsProxy as `0x${string}`,
        abi: parseAbi(ASSOCIATIONS_STORE_ABI),
        functionName: "getAssociationsForAccount",
        args: [record.initiator as `0x${string}`],
      });

      if (sars && Array.isArray(sars) && sars.length > 0) {
        for (const sar of sars) {
          const sarRecord = (sar as any).record;
          if (
            sarRecord &&
            sarRecord.initiator !== "0x" &&
            sarRecord.approver === record.approver &&
            sarRecord.interfaceId === record.interfaceId &&
            sarRecord.data === record.data
          ) {
            existingAssociation = sar;
            console.log("✓ Matching association found on-chain!");
            // IMPORTANT: If it exists already, use the *stored* record fields.
            // The associationId/digest are derived from (initiator, approver, validAt, validUntil, interfaceId, data).
            record = {
              initiator: sarRecord.initiator,
              approver: sarRecord.approver,
              validAt: Number(sarRecord.validAt),
              validUntil: Number(sarRecord.validUntil),
              interfaceId: sarRecord.interfaceId,
              data: sarRecord.data,
            };
            associationId = associationIdFromRecord(record);
            console.log("  Using stored record fields:");
            console.log("   - validAt:", record.validAt);
            console.log("   - validUntil:", record.validUntil);
            console.log("   - interfaceId:", record.interfaceId);
            console.log("   - data:", record.data);
            console.log("  Association ID (from stored record):", associationId);
            break;
          }
        }
      }
    } catch (checkErr: any) {
      console.warn("⚠️ Error checking for association:", checkErr?.message);
    }

    // Compute EIP-712 hash from the FINAL record (used for both signatures)
    const digest = eip712Hash(record);
    console.log("  EIP-712 hash:", digest);

    // Step 6: Sign as initiator - only if needed
    // Allow initiatorKeyType to be either K1 (0x0001) or SC-DELEGATION (0x8004).
    const initiatorKeyTypeDefault = (process.env.INITIATOR_KEY_TYPE || KEY_TYPE_K1).toLowerCase();
    let initiatorKeyTypeToUse: string = initiatorKeyTypeDefault;
    let initiatorSignature: string;
    const needsInitiatorSignature = !existingAssociation || !existingAssociation.initiatorSignature || existingAssociation.initiatorSignature === "0x";

    if (needsInitiatorSignature) {
      if (initiatorKeyTypeToUse === KEY_TYPE_SC_DELEGATION) {
        console.log("\nStep 6: Signing as initiator using SC-DELEGATION proof");
        console.log("  EIP-712 hash:", digest);

        // Create initiator delegate/session EOA signature over digest
        const initSessionPriv = generatePrivateKey();
        const initSessionAccount = privateKeyToAccount(initSessionPriv);
        const initSessionSig = new ethers.Wallet(initSessionPriv).signingKey.sign(ethers.getBytes(digest)).serialized;
        console.log("✓ Initiator delegate (session EOA):", initSessionAccount.address);
        console.log("✓ Initiator delegate signature:", initSessionSig.slice(0, 20) + "...");

        // Build a DF root delegation initiatorEOA -> delegateEOA with binding caveat (enforcer==scDelegationEnforcer, terms==digest)
        const initDelegation = {
          delegate: initSessionAccount.address as `0x${string}`,
          delegator: initiatorAddress as `0x${string}`,
          authority: DF_ROOT_AUTHORITY as `0x${string}`,
          caveats: [{ enforcer: enforcerAddr as `0x${string}`, terms: digest as `0x${string}`, args: "0x" as `0x${string}` }],
          salt: BigInt(ethers.hexlify(ethers.randomBytes(32))),
        };
        const initStructHash = dfHashDelegationStruct({
          delegate: initDelegation.delegate,
          delegator: initDelegation.delegator,
          authority: initDelegation.authority,
          caveats: [{ enforcer: enforcerAddr, terms: digest }],
          salt: initDelegation.salt,
        });
        const initTyped = dfTypedDigest({ delegationManager: dmAddr, chainId: CHAIN_ID, delegationStructHash: initStructHash });
        const initDelegationSig = initiatorWallet.signingKey.sign(ethers.getBytes(initTyped)).serialized;
        const initSignedDelegation = { ...initDelegation, signature: initDelegationSig };
        const initDelegationsBytes = encodeDelegations([initSignedDelegation] as any);

        // Encode SC-DELEGATION proof bytes:
        initiatorSignature = encodeScDelegationProof({
          delegate: initSessionAccount.address,
          delegateSignature: initSessionSig,
          delegations: initDelegationsBytes,
        });
        console.log("✓ Initiator SC-DELEGATION proof blob:", initiatorSignature.slice(0, 20) + "...");
      } else {
        initiatorKeyTypeToUse = KEY_TYPE_K1;
        console.log("\nStep 6: Signing as initiator (EOA/K1)");
        // For ERC-8092 K1 signatures, sign the raw EIP-712 digest (no prefix)
        const hashBytes = ethers.getBytes(digest);
        initiatorSignature = initiatorWallet.signingKey.sign(hashBytes).serialized;
        console.log("✓ Initiator signature (raw hash bytes):", initiatorSignature.slice(0, 20) + "...");
      }
    } else {
      console.log("\nStep 6: Skipping initiator signature - association already exists");
      initiatorSignature = existingAssociation.initiatorSignature;
      initiatorKeyTypeToUse = (existingAssociation.initiatorKeyType ?? initiatorKeyTypeDefault) as string;
    }

    // Step 7: Generate approver signature using SC-DELEGATION proof (delegate signs digest + delegation chain)
    console.log("\nStep 7: Generating approver signature using SC-DELEGATION proof");
    console.log("  EIP-712 hash:", digest);

    // 7.1 create session delegate EOA + signature over digest (raw bytes)
    const sessionPriv = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPriv);
    const sessionSig = new ethers.Wallet(sessionPriv).signingKey.sign(ethers.getBytes(digest)).serialized;
    console.log("✓ Delegate (session EOA):", sessionAccount.address);
    console.log("✓ Delegate signature:", sessionSig.slice(0, 20) + "...");

    // 7.2 create a delegation (approver/agent -> delegate) with a binding caveat: terms == digest (32 bytes)
    // NOTE: We build this manually (instead of using createDelegation(scope=...)) because our SC-DELEGATION
    // verifier only depends on the delegation struct + the binding caveat, and createDelegation requires a scope.
    const delegation = {
      delegate: sessionAccount.address as `0x${string}`,
      delegator: agentAccount as `0x${string}`,
      authority: DF_ROOT_AUTHORITY as `0x${string}`, // root authority
      caveats: [
        {
          enforcer: enforcerAddr as `0x${string}`,
          terms: digest as `0x${string}`,
          args: "0x" as `0x${string}`,
        },
      ],
      salt: BigInt(ethers.hexlify(ethers.randomBytes(32))),
    };

    // NOTE: HybridDeleGator delegation signatures are produced by the agent owner via `agentAccountClient.signDelegation`.
    const delegationSignature = await (agentAccountClient as any).signDelegation({ delegation, chainId: CHAIN_ID });
    const signedDelegation = { ...delegation, signature: delegationSignature };
    const delegationsBytes = encodeDelegations([signedDelegation] as any);

    // 7.4 build SC-DELEGATION proof blob as Solidity expects:
    // abi.encode((address delegate, bytes delegateSignature, bytes delegations))
    const approverSignature = encodeScDelegationProof({
      delegate: sessionAccount.address,
      delegateSignature: sessionSig,
      delegations: delegationsBytes,
    });
    console.log("✓ SC-DELEGATION approverSignature proof blob:", approverSignature.slice(0, 20) + "...");

    // Step 8: Store association with initiator signature only (if needed)  
    let storeHash: string | null = null;

    if (needsInitiatorSignature) {
      console.log("\nStep 8: Storing association with initiator signature only");

      // Verify initiator has sufficient balance
      const initiatorBalance = await publicClient.getBalance({ address: initiatorAddress as `0x${string}` });
      const minBalance = parseEther("0.001");
      if (initiatorBalance < minBalance) {
        throw new Error(`Initiator account has insufficient balance. Please fund ${initiatorAddress}`);
      }
      console.log("✓ Initiator account has sufficient balance");

      const sarInitial = {
        revokedAt: 0,
        initiatorKeyType: initiatorKeyTypeToUse, // K1 or SC-DELEGATION
        approverKeyType: KEY_TYPE_SC_DELEGATION, // SC-DELEGATION proof
        initiatorSignature,
        approverSignature: "0x", // Empty - will be set later
        record,
      };

      // Use ethers for signing and sending transaction (consistent with admin app)
      const initiatorProvider = getSepoliaProvider();
      const initiatorWalletConnected = initiatorWallet.connect(initiatorProvider);

      const ASSOCIATIONS_ABI = [
        "function storeAssociation((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record) sar)",
      ] as const;

      const contract = new ethers.Contract(associationsProxy, ASSOCIATIONS_ABI, initiatorWalletConnected);
      
      // Simulate the call first to get better error info
      console.log("  Simulating contract call...");
      try {
        await contract.storeAssociation.staticCall(sarInitial);
        console.log("  ✓ Simulation passed");
      } catch (simErr: any) {
        const errMsg = simErr?.message || String(simErr);
        const dataMatch = errMsg.match(/data:\s*(0x[0-9a-fA-F]{8})/i);
        if (dataMatch) {
          const errorSelector = dataMatch[1];
          if (errorSelector === "0x456db081") {
            const latestBlockNum = await provider.getBlockNumber();
            const latestBlock2 = await provider.getBlock(latestBlockNum);
            const chainTimestamp = Number(latestBlock2?.timestamp ?? 0);
            throw new Error(
              `InvalidAssociation error (0x456db081). The association validation failed. ` +
              `This usually means:\n` +
              `1. The initiator signature is invalid (for its initiatorKeyType)\n` +
              `2. The validAt timestamp is in the future\n` +
              `3. The record structure doesn't match what the contract expects\n\n` +
              `Verify that:\n` +
              `- The digest being signed matches what the contract computes\n` +
              `- The signature/proof is valid for the initiator address\n` +
              `- validAt (${validAt}) <= block.timestamp (current: ${chainTimestamp})`
            );
          }
        }
        throw simErr;
      }

      console.log("  Sending transaction from initiator EOA...");
      const tx = await contract.storeAssociation(sarInitial);
      storeHash = tx.hash;
      console.log("  Transaction hash:", storeHash);

      console.log("  Waiting for receipt...");
      const storeReceipt = await tx.wait();
      if (!storeReceipt) {
        throw new Error("Transaction receipt not found");
      }
      const success = storeReceipt.status === 1;
      if (!success) {
        throw new Error(`Transaction failed with status ${storeReceipt.status}`);
      }
      console.log("✓ Association stored with initiator signature!");
      console.log("  Transaction hash:", tx.hash);
      console.log("  Block number:", storeReceipt.blockNumber);
    } else {
      console.log("\nStep 8: Skipping store - association already exists on-chain");
    }

    // Step 9: Wait for association to be queryable (only if we stored it)
    if (storeHash) {
      console.log("\nStep 9: Waiting for association to be queryable...");
      console.log("  Querying by initiator address:", record.initiator);
      console.log("  Association ID:", associationId);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for state update

      let associationFound = false;
      for (let attempt = 1; attempt <= 10; attempt++) {
        try {
          console.log(`  Attempt ${attempt}/10: Checking for association...`);
          const sars = await publicClient.readContract({
            address: associationsProxy as `0x${string}`,
            abi: parseAbi(ASSOCIATIONS_STORE_ABI),
            functionName: "getAssociationsForAccount",
            args: [record.initiator as `0x${string}`],
          });

          if (sars && Array.isArray(sars) && sars.length > 0) {
            console.log(`    Found ${sars.length} association(s) for initiator`);
            for (const sar of sars) {
              const sarRecord = (sar as any).record;
              if (
                sarRecord &&
                sarRecord.initiator !== "0x" &&
                sarRecord.approver === record.approver &&
                sarRecord.interfaceId === record.interfaceId &&
                sarRecord.data === record.data
              ) {
                associationFound = true;
                console.log(`✓ Association found on-chain after ${attempt} attempt(s)!`);
                console.log(`  Initiator: ${sarRecord.initiator}`);
                console.log(`  Approver: ${sarRecord.approver}`);
                console.log(`  ValidAt: ${sarRecord.validAt}`);
                console.log(`  Initiator key type: ${(sar as any).initiatorKeyType}`);
                console.log(`  Approver key type: ${(sar as any).approverKeyType}`);
                console.log(`  Has initiator signature: ${(sar as any).initiatorSignature && (sar as any).initiatorSignature !== "0x" ? "Yes" : "No"}`);
                console.log(`  Has approver signature: ${(sar as any).approverSignature && (sar as any).approverSignature !== "0x" ? "Yes" : "No"}`);
                break;
              }
            }
            if (associationFound) break;
            console.log(`    No matching association found (different approver/interfaceId/data)`);
          } else {
            console.log(`    No associations found for initiator`);
          }
        } catch (checkErr: any) {
          console.warn(`  ⚠️ Error during association check (attempt ${attempt}):`, checkErr?.message || checkErr);
        }
        if (attempt < 10) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      if (!associationFound && storeHash) {
        console.warn("\n⚠️ Association not found after 10 attempts");
        console.warn("  This might indicate:");
        console.warn("    1. Transaction succeeded but association was not stored");
        console.warn("    2. RPC node has indexing delays");
        console.warn("    3. Transaction may have reverted despite appearing successful");
        console.warn(`  Check transaction on Etherscan: https://sepolia.etherscan.io/tx/${storeHash}`);
      }
    }

    // Step 10: Update approver signature using a session smart account + delegation from agent account
    console.log("\nStep 10: Updating approver signature using delegation (agent -> session smart account)");
    const needsApproverSignature =
      forceDelegationUpdate ||
      !existingAssociation ||
      !existingAssociation.approverSignature ||
      existingAssociation.approverSignature === "0x";
    let updateTxHash: string | null = null;

    if (!needsApproverSignature) {
      console.log("  Approver signature already exists - skipping update");
    } else {
      const associationIdToUse = associationId;

      // Verify agent account is a contract
      const agentCode = await publicClient.getBytecode({ address: agentAccount as `0x${string}` });
      if (!agentCode || agentCode === "0x") {
        throw new Error(`Agent account ${agentAccount} is not a contract. Cannot use ERC-1271 validation.`);
      }
      console.log("    ✓ Agent account is a contract (can use ERC-1271)");

      // Preflight validation.
      // For SC-DELEGATION, the approverSignature is validated by AssociationsStore/AssociatedAccountsLib,
      // NOT by calling agentAccount.isValidSignature(hash, signature) directly.
      console.log("    Preflighting AssociationsStore validation...");
      try {
        const VALIDATE_ABI = parseAbi([
          "function validateSignedAssociationRecord((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record) sar) view returns (bool)",
        ]);
        const sarToValidate = {
          revokedAt: 0,
          initiatorKeyType: initiatorKeyTypeToUse,
          approverKeyType: KEY_TYPE_SC_DELEGATION,
          initiatorSignature: initiatorSignature as `0x${string}`,
          approverSignature: approverSignature as `0x${string}`,
          record,
        };
        const ok = await publicClient.readContract({
          address: associationsProxy as `0x${string}`,
          abi: VALIDATE_ABI,
          functionName: "validateSignedAssociationRecord",
          args: [sarToValidate as any],
        });
        if (!ok) throw new Error("validateSignedAssociationRecord returned false");
        console.log("    ✓ AssociationsStore preflight validation passed");
      } catch (preflightErr: any) {
        throw new Error(`AssociationsStore preflight validation failed: ${preflightErr?.message || preflightErr}`);
      }

      // Build the call we want the agent account to execute (via delegation redemption)
      try {
        const ASSOCIATIONS_UPDATE_ABI = [
          "function updateAssociationSignatures(bytes32 associationId, bytes initiatorSignature, bytes approverSignature)",
        ];
        const updateCallData = encodeFunctionData({
          abi: parseAbi(ASSOCIATIONS_UPDATE_ABI),
          functionName: "updateAssociationSignatures",
          args: [associationIdToUse as `0x${string}`, "0x" as `0x${string}`, approverSignature as `0x${string}`],
        });

        // --- Delegation flow ---
        console.log("    Creating session smart account...");
        const environment = getSmartAccountsEnvironment(CHAIN_ID);
        const delegationManagerAddress = environment.DelegationManager as `0x${string}`;

        const sessionEoa = privateKeyToAccount(generatePrivateKey());
        const sessionWalletClient = createWalletClient({
          chain: sepolia,
          transport: http(rpcUrl),
          account: sessionEoa,
        });

        // Counterfactual session smart account (will be deployed as needed in the UserOp)
        const sessionAccountClient = await toMetaMaskSmartAccount({
          client: publicClient as any,
          environment,
          implementation: Implementation.Hybrid,
          signer: { walletClient: sessionWalletClient as any },
          deployParams: [sessionEoa.address as `0x${string}`, [], [], []],
          deploySalt: generatePrivateKey(),
        } as any);

        console.log("    ✓ Session smart account:", (sessionAccountClient as any).address);

        // Create a scoped delegation: agentAccount -> sessionAccount, allowed to call updateAssociationSignatures on the AssociationsStore proxy.
        const updateSelector = toFunctionSelector("updateAssociationSignatures(bytes32,bytes,bytes)");
        const delegation = createDelegation({
          environment,
          scope: {
            type: "functionCall",
            targets: [associationsProxy as `0x${string}`],
            selectors: [updateSelector],
          },
          from: agentAccount as `0x${string}`,
          to: (sessionAccountClient as any).address as `0x${string}`,
        } as any);

        console.log("    Signing delegation with agent account owner...");
        const delegationSignature = await (agentAccountClient as any).signDelegation({
          delegation: {
            delegate: delegation.delegate,
            delegator: delegation.delegator,
            authority: delegation.authority,
            caveats: delegation.caveats,
            salt: delegation.salt,
          },
          chainId: CHAIN_ID,
        });
        const signedDelegation = { ...delegation, signature: delegationSignature };
        console.log("    ✓ Delegation signed");

        // Redeem delegation, executing the update as the agent account.
        const redeemCalldata = (DelegationManager as any).encode.redeemDelegations({
          delegations: [[signedDelegation]],
          modes: [ExecutionMode.SingleDefault],
          executions: [[{ target: associationsProxy as `0x${string}`, value: 0n, callData: updateCallData }]],
        });

        console.log("    Sending user operation from session smart account (gasless via bundler) to redeem delegation...");
        const userOpHash = await sendSponsoredUserOperation({
          bundlerUrl,
          chain: sepolia,
          accountClient: sessionAccountClient as any,
          calls: [{ to: delegationManagerAddress, data: redeemCalldata, value: 0n }],
        });

        console.log("    Waiting for receipt...");
        const receipt = await waitForUserOperationReceipt({
          bundlerUrl,
          chain: sepolia,
          hash: userOpHash,
        });

        updateTxHash = receipt?.transactionHash || (receipt as any)?.receipt?.transactionHash || userOpHash;
        console.log("✓ Approver signature updated via delegation (session redeemed, agent executed)!");
        console.log("  Transaction hash:", updateTxHash);
      } catch (directErr: any) {
        const errMsg = directErr?.message || String(directErr);
        console.error("❌ Delegated update failed:", errMsg);
        throw new Error(`Failed to update approver signature via delegation: ${errMsg}`);
      }
    }

    console.log("\n==========================================");
    console.log("✓ All steps completed successfully!");
    console.log("==========================================\n");

    return NextResponse.json({
      ok: true,
      summary: {
        agentAccount,
        initiatorEOA: initiatorAddress,
        associationId,
        storeTransactionHash: storeHash || null,
        updateTransactionHash: updateTxHash || null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("❌ Error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

