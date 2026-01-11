export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDiscoveryClient } from "@agentic-trust/core/server";

function tryParseRawJson(rawJson: unknown): any | null {
  if (typeof rawJson !== "string" || !rawJson.trim()) return null;
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

function pickAgentAccount(agent: any): string {
  // Prefer the actual AA address from rawJson.agentAccount when present.
  const parsed = tryParseRawJson(agent?.rawJson);
  const aa = parsed?.agentAccount;
  if (typeof aa === "string" && aa.startsWith("0x") && aa.length === 42) return aa;

  // Fallback: last segment of agentAccountEndpoint (eip155:chain:0x...)
  const endpoint = agent?.agentAccountEndpoint;
  if (typeof endpoint === "string" && endpoint.includes(":")) {
    const parts = endpoint.split(":");
    const last = parts[parts.length - 1];
    if (typeof last === "string" && last.startsWith("0x") && last.length === 42) return last;
  }

  // Final fallback: agentAccount field
  const direct = agent?.agentAccount;
  if (typeof direct === "string" && direct.startsWith("0x") && direct.length === 42) return direct;

  // Use agentOwner as fallback
  const agentOwner = typeof agent?.agentOwner === "string" ? agent.agentOwner : undefined;
  if (agentOwner && agentOwner.startsWith("0x") && agentOwner.length === 42) return agentOwner;

  return "";
}

export async function GET(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    if (!agentId) {
      return NextResponse.json({ error: "agentId parameter is required" }, { status: 400 });
    }

    const discoveryClient = await getDiscoveryClient();
    
    // Try to get owner address from wallet
    const { getAdminWallet, getOwnerAddress } = await import("@/lib/wallet");
    const wallet = getAdminWallet();
    const ownerAddress = await getOwnerAddress(wallet);

    if (!ownerAddress || !ownerAddress.startsWith("0x")) {
      return NextResponse.json({ error: "Could not determine valid owner address" }, { status: 500 });
    }

    // Get all owned agents and find the one matching the agentId
    const agents = await discoveryClient.getOwnedAgents(ownerAddress, {
      limit: 1000,
      offset: 0,
      orderBy: "agentId",
      orderDirection: "DESC",
    });

    const agent = agents.find((a: any) => String(a.agentId ?? a.id) === String(agentId));

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const agentAccount = pickAgentAccount(agent);

    return NextResponse.json({
      ok: true,
      agent: {
        id: String(agent.agentId ?? agent.id),
        chainId: typeof agent.chainId === "number" ? agent.chainId : undefined,
        agentAccount,
        agentOwner: typeof agent.agentOwner === "string" ? agent.agentOwner : undefined,
        eoaOwner: typeof agent.eoaOwner === "string" ? agent.eoaOwner : undefined,
        label: agent.agentName ?? agent.name ?? undefined,
        rawAgent: agent,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[API][agents][agentId] Error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

