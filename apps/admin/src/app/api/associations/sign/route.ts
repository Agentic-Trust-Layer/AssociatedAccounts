export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { getAdminWallet, getSepoliaProvider } from "@/lib/wallet";
import { getAssociationsProxyAddress, getAdminPrivateKey, getSepoliaRpcUrl } from "@/lib/config";
import { tryParseEvmV1 } from "@/lib/erc7930";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient } from "viem/account-abstraction";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import { getChainBundlerUrl, sepolia } from "@agentic-trust/core/server";
import { createPimlicoClient } from "permissionless/clients/pimlico";

const DOMAIN_TYPEHASH = ethers.id("EIP712Domain(string name,string version)");
const NAME_HASH = ethers.id("AssociatedAccounts");
const VERSION_HASH = ethers.id("1");
const MESSAGE_TYPEHASH = ethers.id(
  "AssociatedAccountRecord(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data)"
);
const abi = ethers.AbiCoder.defaultAbiCoder();

const ASSOCIATIONS_ABI = [
  "function storeAssociation((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record) sar)",
  "function updateAssociationSignatures(bytes32 associationId, bytes initiatorSignature, bytes approverSignature)",
  "function getAssociation(bytes32 associationId) view returns (uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data)",
] as const;

function domainSeparator(): string {
  return ethers.keccak256(abi.encode(["bytes32", "bytes32", "bytes32"], [DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH]));
}

function eip712Hash(record: {
  initiator: string;
  approver: string;
  validAt: number;
  validUntil: number;
  interfaceId: string;
  data: string;
}): string {
  const hs = ethers.keccak256(
    abi.encode(
      ["bytes32", "bytes32", "bytes32", "uint40", "uint40", "bytes4", "bytes32"],
      [
        MESSAGE_TYPEHASH,
        ethers.keccak256(record.initiator),
        ethers.keccak256(record.approver),
        record.validAt,
        record.validUntil,
        record.interfaceId,
        ethers.keccak256(record.data),
      ]
    )
  );
  return ethers.keccak256(ethers.solidityPacked(["bytes2", "bytes32", "bytes32"], ["0x1901", domainSeparator(), hs]));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      initiator: string; // bytes (interoperable address)
      approver: string; // bytes (interoperable address)
      validAt: number;
      validUntil: number;
      interfaceId: string;
      data: string;
      role: "initiator" | "approver"; // which signature to generate
      fromAccount?: string; // smart account address to send transaction from (required for updates)
      storeOnChain?: boolean; // whether to store on-chain (default: false)
      associationId?: string; // association ID if updating existing association
      existingInitiatorSignature?: string; // existing initiator signature (if updating)
      existingApproverSignature?: string; // existing approver signature (if updating)
    };

    if (!body?.initiator || !body?.approver || !body?.role) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const provider = getSepoliaProvider();
    const wallet = getAdminWallet().connect(provider);
    const ownerAddress = await wallet.getAddress();

    const record = {
      initiator: body.initiator,
      approver: body.approver,
      validAt: body.validAt,
      validUntil: body.validUntil,
      interfaceId: body.interfaceId,
      data: body.data,
    };

    const digest = eip712Hash(record);
    const signature = await wallet.signMessage(ethers.getBytes(digest));

    // If storeOnChain is true, store/update the signature on-chain
    let txHash: string | undefined;
    let receipt: any | undefined;
    let storeError: string | undefined;

    if (body.storeOnChain) {
      try {
        const proxy = getAssociationsProxyAddress();
        const contract = new ethers.Contract(proxy, ASSOCIATIONS_ABI, wallet);

        if (body.associationId) {
          // Update existing association signatures - must be sent from the smart account
          // NOTE: If the association was created with an incorrect keyType (e.g., 0x0001 for a smart account
          // that requires 0x8002), the validation will fail. New associations created via /api/associate
          // automatically detect the correct keyType (0x0001 for EOA, 0x8002 for smart accounts).
          if (!body.fromAccount) {
            throw new Error("fromAccount is required when updating existing associations");
          }

          // Parse the initiator/approver addresses from the interoperable format
          const initiatorParsed = tryParseEvmV1(body.initiator);
          const approverParsed = tryParseEvmV1(body.approver);
          const initiatorAddr = initiatorParsed?.address?.toLowerCase();
          const approverAddr = approverParsed?.address?.toLowerCase();
          const fromAccount = ethers.getAddress(body.fromAccount).toLowerCase();

          // Verify that fromAccount matches the role being signed
          if (body.role === "initiator" && fromAccount !== initiatorAddr) {
            throw new Error(`fromAccount ${fromAccount} does not match initiator ${initiatorAddr}`);
          }
          if (body.role === "approver" && fromAccount !== approverAddr) {
            throw new Error(`fromAccount ${fromAccount} does not match approver ${approverAddr}`);
          }

          // Only update the signature for the role being signed
          const updateInitiator = body.role === "initiator" ? signature : "0x";
          const updateApprover = body.role === "approver" ? signature : "0x";

          // Send via ERC-4337 UserOperation from the smart account
          const rpcUrl = getSepoliaRpcUrl();
          const bundlerUrl = getChainBundlerUrl(11155111);
          const eoa = privateKeyToAccount(getAdminPrivateKey() as `0x${string}`);

          const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
          const walletClient = createWalletClient({ chain: sepolia, transport: http(rpcUrl), account: eoa });

          const smartAccount = await toMetaMaskSmartAccount({
            client: publicClient as any,
            implementation: Implementation.Hybrid,
            signer: { walletClient: walletClient as any },
            address: body.fromAccount as any,
          });

          const pimlicoClient = createPimlicoClient({ transport: http(bundlerUrl), chain: sepolia } as any);
          const bundlerClient = createBundlerClient({
            transport: http(bundlerUrl),
            chain: sepolia,
          });
          const { fast: fee } = await (pimlicoClient as any).getUserOperationGasPrice();

          const proxyAddr = getAssociationsProxyAddress();
          const iface = new ethers.Interface(ASSOCIATIONS_ABI);
          const calldata = iface.encodeFunctionData("updateAssociationSignatures", [
            body.associationId,
            updateInitiator,
            updateApprover,
          ]);

          const baseRequest = await bundlerClient.prepareUserOperation({
            account: smartAccount as any,
            calls: [{ to: proxyAddr as any, data: calldata as any, value: 0n }],
            maxFeePerGas: fee.maxFeePerGas,
            maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
            parameters: ["factory", "fees", "nonce", "signature"],
          } as any);

          // Extract only userOp fields, excluding account and other non-userOp fields
          const { account: _account, ...userOp } = baseRequest as any;
          const sponsored = await (pimlicoClient as any).sponsorUserOperation({
            userOperation: userOp,
            paymasterContext: { mode: "SPONSORED" },
            entryPoint: (smartAccount as any).entryPoint,
          });

          const hasPaymaster =
            typeof (sponsored as any)?.paymasterAndData === "string" ||
            typeof (sponsored as any)?.paymaster === "string";
          if (!hasPaymaster) {
            throw new Error(
              "Paymaster sponsorship did not return paymaster fields. " +
                "Check that AGENTIC_TRUST_BUNDLER_URL_SEPOLIA points to a Pimlico-compatible paymaster RPC."
            );
          }

          const unsignedFinal = { ...userOp, ...sponsored };
          const userOpSignature = await (smartAccount as any).signUserOperation(unsignedFinal);

          const userOpHash = await bundlerClient.sendUserOperation({
            ...unsignedFinal,
            signature: userOpSignature,
            entryPointAddress: (smartAccount as any).entryPoint.address,
          } as any);

          const uoReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
          txHash =
            (uoReceipt as any)?.receipt?.transactionHash ??
            (uoReceipt as any)?.receipt?.transactionReceipt?.transactionHash ??
            null;
          
          // Get the transaction receipt
          if (txHash) {
            const provider = getSepoliaProvider();
            receipt = await provider.getTransactionReceipt(txHash);
          }
        } else {
          // Store new association
          const initiatorSignature =
            body.role === "initiator" ? signature : body.existingInitiatorSignature || "0x";
          const approverSignature =
            body.role === "approver" ? signature : body.existingApproverSignature || "0x";

          const sar = {
            revokedAt: 0,
            initiatorKeyType: "0x0001", // EOA key type
            approverKeyType: "0x0001", // EOA key type
            initiatorSignature,
            approverSignature,
            record,
          };

          const tx = await contract.storeAssociation(sar);
          receipt = await tx.wait();
          txHash = tx.hash;
        }
      } catch (e: any) {
        // Store/update failed, but signature generation succeeded
        const errorMsg = e?.message || "Failed to store/update association on-chain";
        let userFriendlyError = errorMsg;
        
        // Check for InvalidAssociation error (0x456db081)
        if (errorMsg.includes("0x456db081") || errorMsg.includes("InvalidAssociation") || errorMsg.includes("simulation with reason: 0x456db081")) {
          userFriendlyError = 
            "Association validation failed. This association was likely created with the wrong keyType " +
            "(EOA keyType 0x0001 instead of smart account keyType 0x8002). " +
            "Existing associations with incorrect keyType cannot be updated. " +
            "Please revoke this association and create a new one with the correct keyType.";
        }
        
        storeError = userFriendlyError;
        console.error("[API][associations][sign] Failed to store/update on-chain:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      signature,
      digest,
      role: body.role,
      signer: ownerAddress,
      txHash,
      receipt: receipt
        ? {
            status: receipt.status,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed?.toString?.() ?? String(receipt.gasUsed),
          }
        : undefined,
      storeError,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[API][associations][sign] Error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

