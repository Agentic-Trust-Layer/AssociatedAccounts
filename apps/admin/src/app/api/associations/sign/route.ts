export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { getAdminWallet, getSepoliaProvider } from "@/lib/wallet";
import { getAssociationsProxyAddress } from "@/lib/config";
import { tryParseEvmV1 } from "@/lib/erc7930";

const DOMAIN_TYPEHASH = ethers.id("EIP712Domain(string name,string version)");
const NAME_HASH = ethers.id("AssociatedAccounts");
const VERSION_HASH = ethers.id("1");
const MESSAGE_TYPEHASH = ethers.id(
  "AssociatedAccountRecord(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data)"
);
const abi = ethers.AbiCoder.defaultAbiCoder();

const ASSOCIATIONS_ABI = [
  "function storeAssociation((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record) sar)",
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
      fromAccount?: string; // smart account address to send transaction from (optional, uses EOA if not provided)
      storeOnChain?: boolean; // whether to store on-chain (default: false)
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

    // If storeOnChain is true, store the signature on-chain
    // Note: The ERC-8092 contract doesn't support updating existing associations.
    // If the association already exists, this will fail with AssociationAlreadyExists.
    let txHash: string | undefined;
    let receipt: any | undefined;
    let storeError: string | undefined;

    if (body.storeOnChain) {
      try {
        const proxy = getAssociationsProxyAddress();
        const contract = new ethers.Contract(proxy, ASSOCIATIONS_ABI, wallet);

        // Determine which signature to use (new or existing)
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
      } catch (e: any) {
        // Store failed (likely AssociationAlreadyExists), but signature generation succeeded
        storeError = e?.message || "Failed to store association on-chain";
        console.error("[API][associations][sign] Failed to store on-chain:", e);
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

