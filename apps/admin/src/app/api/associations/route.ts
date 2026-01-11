export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { getSepoliaProvider } from "@/lib/wallet";
import { getAssociationsProxyAddress, getSepoliaRpcUrl } from "@/lib/config";
import { formatEvmV1, tryParseEvmV1 } from "@/lib/erc7930";

const ABI = [
  "function getAssociationIdsForAccount(bytes account) view returns (bytes32[] associationIds)",
  "function getAssociationsForAccount(bytes account) view returns ((uint40 revokedAt,bytes2 initiatorKeyType,bytes2 approverKeyType,bytes initiatorSignature,bytes approverSignature,(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data) record)[] sars)",
] as const;

const DOMAIN_TYPEHASH = ethers.id("EIP712Domain(string name,string version)");
const NAME_HASH = ethers.id("AssociatedAccounts");
const VERSION_HASH = ethers.id("1");
const MESSAGE_TYPEHASH = ethers.id(
  "AssociatedAccountRecord(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data)"
);
const abi = ethers.AbiCoder.defaultAbiCoder();

function domainSeparator(): string {
  return ethers.keccak256(abi.encode(["bytes32", "bytes32", "bytes32"], [DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH]));
}

function associationIdFromRecord(rec: {
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
        ethers.keccak256(rec.initiator),
        ethers.keccak256(rec.approver),
        rec.validAt,
        rec.validUntil,
        rec.interfaceId,
        ethers.keccak256(rec.data),
      ]
    )
  );
  return ethers.keccak256(ethers.solidityPacked(["bytes2", "bytes32", "bytes32"], ["0x1901", domainSeparator(), hs]));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account");
    if (!account) return NextResponse.json({ ok: false, error: "Missing account" }, { status: 400 });

    console.log("[API][associations] Request for account:", account);

    const provider = getSepoliaProvider();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Handle chainId:0x... format (extract the address part)
    let addr: string;
    const chainIdMatch = account.match(/^\d+:(0x[0-9a-fA-F]{40})$/);
    if (chainIdMatch) {
      addr = ethers.getAddress(chainIdMatch[1]);
      console.log("[API][associations] Extracted address from chainId:format:", addr);
    } else if (account.startsWith("0x")) {
      addr = ethers.getAddress(account);
      console.log("[API][associations] Using plain address:", addr);
    } else {
      // Handle ENS names
      console.log("[API][associations] Resolving ENS name:", account);
      const resolved = await provider.resolveName(account);
      if (!resolved) throw new Error(`Could not resolve ENS name: ${account}`);
      addr = ethers.getAddress(resolved);
      console.log("[API][associations] Resolved ENS to:", addr);
    }
    
    const interoperable = formatEvmV1(chainId, addr);
    console.log("[API][associations] Formatted interoperable address:", interoperable);

    const proxy = getAssociationsProxyAddress();
    console.log("[API][associations] Calling contract at:", proxy);
    console.log("[API][associations] Provider network chainId:", chainId, "name:", network.name);
    
    const contract = new ethers.Contract(proxy, ABI, provider);
    
    // Try calling the contract directly - don't fail on code check as RPC might have issues
    let code = "";
    try {
      code = await provider.getCode(proxy);
      console.log("[API][associations] Contract code length:", code.length);
    } catch (e: any) {
      console.warn("[API][associations] Could not check contract code:", e?.message);
    }
    
    console.log("[API][associations] Calling getAssociationsForAccount...");
    const sars = await contract.getAssociationsForAccount(interoperable);
    console.log("[API][associations] Received", Array.isArray(sars) ? sars.length : 0, "associations");

    const mapped = (sars as any[]).map((sar) => {
      const initiatorParsed = tryParseEvmV1(sar.record.initiator);
      const approverParsed = tryParseEvmV1(sar.record.approver);
      const initiatorAddr = initiatorParsed?.address ?? sar.record.initiator;
      const approverAddr = approverParsed?.address ?? sar.record.approver;
      const associationId = associationIdFromRecord({
        initiator: sar.record.initiator,
        approver: sar.record.approver,
        validAt: Number(sar.record.validAt),
        validUntil: Number(sar.record.validUntil),
        interfaceId: sar.record.interfaceId,
        data: sar.record.data,
      });

      const aLower = addr.toLowerCase();
      const counterparty =
        initiatorAddr.toLowerCase() === aLower ? approverAddr : approverAddr.toLowerCase() === aLower ? initiatorAddr : approverAddr;
      return {
        associationId,
        revokedAt: Number(sar.revokedAt),
        initiator: initiatorAddr,
        approver: approverAddr,
        counterparty,
        validAt: Number(sar.record.validAt),
        validUntil: Number(sar.record.validUntil),
        initiatorSignature: typeof sar.initiatorSignature === "string" ? sar.initiatorSignature : "0x",
        approverSignature: typeof sar.approverSignature === "string" ? sar.approverSignature : "0x",
        initiatorBytes: typeof sar.record.initiator === "string" ? sar.record.initiator : undefined,
        approverBytes: typeof sar.record.approver === "string" ? sar.record.approver : undefined,
        interfaceId: typeof sar.record.interfaceId === "string" ? sar.record.interfaceId : "0x00000000",
        data: typeof sar.record.data === "string" ? sar.record.data : "0x",
      };
    });

    return NextResponse.json({ ok: true, chainId, account: addr, associations: mapped });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[API][associations] Error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}


