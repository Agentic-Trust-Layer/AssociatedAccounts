export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { sepolia } from "viem/chains";

import { getChainRpcUrl } from "@agentic-trust/core/server";
import {
  ASSOCIATIONS_STORE_ABI,
  associationIdFromRecord,
  decodeScDelegationProof,
  eip712Hash,
  formatEvmV1,
  tryParseEvmV1,
} from "@associatedaccounts/erc8092-sdk";
import { pickAssociationsStoreProxy } from "@associatedaccounts/erc8092-sdk/server";

import { getAgentId, getAgentAccountAddress, getAssociationsProxyAddressCandidates } from "@/lib/config";
import { getAdminWallet, getOwnerAddress } from "@/lib/wallet";
import { getAgentById } from "@/lib/agentic";

const CHAIN_ID = 11155111;

function keyTypeLabel(keyType: string): string {
  const kt = keyType.toLowerCase();
  if (kt === "0x0001") return "K1 (EOA)";
  if (kt === "0x8002") return "ERC-1271 (Smart Account)";
  if (kt === "0x8004") return "SC-DELEGATION";
  if (kt === "0x8003") return "ERC-6492";
  return keyType;
}

export async function GET() {
  try {
    const rpcUrl = getChainRpcUrl(CHAIN_ID);
    const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

    // Resolve agent account.
    const agentId = getAgentId();
    let agentAccount = getAgentAccountAddress();
    if (!agentAccount) {
      const adminWallet = getAdminWallet();
      const ownerAddress = await getOwnerAddress(adminWallet);
      const agentInfo = await getAgentById(agentId, ownerAddress);
      if (!agentInfo?.agentAccount) throw new Error(`Agent ${agentId} not found (set AGENT_ACCOUNT_ADDRESS).`);
      agentAccount = agentInfo.agentAccount;
    }

    const proxyCandidates = getAssociationsProxyAddressCandidates();
    const proxy = await pickAssociationsStoreProxy({
      rpcUrl,
      candidates: proxyCandidates,
      requireDelegationConfig: true,
    });

    const agentAccountBytes = formatEvmV1(CHAIN_ID, agentAccount);

    const sars = await publicClient.readContract({
      address: proxy as `0x${string}`,
      abi: parseAbi(ASSOCIATIONS_STORE_ABI),
      functionName: "getAssociationsForAccount",
      args: [agentAccountBytes as `0x${string}`],
    });

    const mapped = (Array.isArray(sars) ? sars : []).map((sar: any) => {
      const rec = sar?.record ?? {};
      const associationId = associationIdFromRecord(rec);
      const digest = eip712Hash(rec);
      const initiatorAddr = typeof rec?.initiator === "string" ? tryParseEvmV1(rec.initiator)?.address ?? null : null;
      const approverAddr = typeof rec?.approver === "string" ? tryParseEvmV1(rec.approver)?.address ?? null : null;

      const initiatorKeyType = typeof sar?.initiatorKeyType === "string" ? sar.initiatorKeyType : "0x";
      const approverKeyType = typeof sar?.approverKeyType === "string" ? sar.approverKeyType : "0x";

      const initiatorSignature = sar?.initiatorSignature ?? "0x";
      const approverSignature = sar?.approverSignature ?? "0x";
      const scDelegationDecoded = approverKeyType.toLowerCase() === "0x8004" ? decodeScDelegationProof(approverSignature) : null;

      return {
        associationId,
        digest,
        revokedAt: Number(sar?.revokedAt ?? 0),
        initiatorKeyType,
        initiatorKeyTypeLabel: keyTypeLabel(initiatorKeyType),
        approverKeyType,
        approverKeyTypeLabel: keyTypeLabel(approverKeyType),
        initiatorSignature,
        approverSignature,
        sessionDelegate: scDelegationDecoded?.delegate ?? null,
        delegateSignature: scDelegationDecoded?.delegateSignature ?? null,
        record: {
          initiator: rec?.initiator ?? "0x",
          initiatorAddress: initiatorAddr,
          approver: rec?.approver ?? "0x",
          approverAddress: approverAddr,
          validAt: Number(rec?.validAt ?? 0),
          validUntil: Number(rec?.validUntil ?? 0),
          interfaceId: rec?.interfaceId ?? "0x00000000",
          data: rec?.data ?? "0x",
        },
      };
    });

    return NextResponse.json({
      ok: true,
      chainId: CHAIN_ID,
      proxy,
      agentId,
      agentAccount,
      agentAccountBytes,
      count: mapped.length,
      associations: mapped,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

