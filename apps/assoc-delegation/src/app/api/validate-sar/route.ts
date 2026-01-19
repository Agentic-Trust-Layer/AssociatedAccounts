export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";

import { getChainRpcUrl } from "@agentic-trust/core/server";
import { ASSOCIATIONS_STORE_ABI, associationIdFromRecord, eip712Hash } from "@associatedaccounts/erc8092-sdk";
import { pickAssociationsStoreProxy } from "@associatedaccounts/erc8092-sdk/server";

import { getAssociationsProxyAddressCandidates } from "@/lib/config";

const CHAIN_ID = 11155111;

function normalizeBytes(v: unknown): `0x${string}` {
  if (typeof v !== "string") throw new Error("Expected hex string");
  if (!v.startsWith("0x")) throw new Error("Expected 0x-prefixed hex string");
  return v as `0x${string}`;
}

function normalizeBytes2(v: unknown): `0x${string}` {
  const s = normalizeBytes(v);
  if (s.length !== 6) throw new Error("Expected bytes2 (0x + 4 hex chars)");
  return s;
}

function normalizeBytes4(v: unknown): `0x${string}` {
  const s = normalizeBytes(v);
  if (s.length !== 10) throw new Error("Expected bytes4 (0x + 8 hex chars)");
  return s;
}

function normalizeUint40(v: unknown): bigint {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  if (!Number.isFinite(n) || n < 0) throw new Error("Expected uint40 number");
  return BigInt(Math.floor(n));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sar = body?.sar;
    if (!sar) return NextResponse.json({ ok: false, error: "Missing body.sar" }, { status: 400 });

    const sarForCall = {
      revokedAt: normalizeUint40(sar.revokedAt),
      initiatorKeyType: normalizeBytes2(sar.initiatorKeyType),
      approverKeyType: normalizeBytes2(sar.approverKeyType),
      initiatorSignature: normalizeBytes(sar.initiatorSignature),
      approverSignature: normalizeBytes(sar.approverSignature),
      record: {
        initiator: normalizeBytes(sar.record?.initiator),
        approver: normalizeBytes(sar.record?.approver),
        validAt: normalizeUint40(sar.record?.validAt),
        validUntil: normalizeUint40(sar.record?.validUntil),
        interfaceId: normalizeBytes4(sar.record?.interfaceId),
        data: normalizeBytes(sar.record?.data),
      },
    };

    const rpcUrl = getChainRpcUrl(CHAIN_ID);
    const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
    const proxy = await pickAssociationsStoreProxy({
      rpcUrl,
      candidates: getAssociationsProxyAddressCandidates(),
      requireDelegationConfig: true,
    });

    const valid = await publicClient.readContract({
      address: proxy as `0x${string}`,
      abi: parseAbi(ASSOCIATIONS_STORE_ABI),
      functionName: "validateSignedAssociationRecord",
      args: [sarForCall as any],
    });

    const associationId = associationIdFromRecord({
      initiator: sarForCall.record.initiator,
      approver: sarForCall.record.approver,
      validAt: Number(sarForCall.record.validAt),
      validUntil: Number(sarForCall.record.validUntil),
      interfaceId: sarForCall.record.interfaceId,
      data: sarForCall.record.data,
    } as any);
    const digest = eip712Hash({
      initiator: sarForCall.record.initiator,
      approver: sarForCall.record.approver,
      validAt: Number(sarForCall.record.validAt),
      validUntil: Number(sarForCall.record.validUntil),
      interfaceId: sarForCall.record.interfaceId,
      data: sarForCall.record.data,
    } as any);

    return NextResponse.json({
      ok: true,
      proxy,
      associationId,
      digest,
      valid: !!valid,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

