import type { Wallet } from "ethers";
import type { AgentListItem } from "@/lib/types";
import { ensureGetOwnedAgents } from "@/lib/discoveryOwnedAgents";

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
  return "";
}

// Server-side only. Uses the discovery indexer’s owned-agents endpoint.
export async function listOwnedAgents(params: {
  ownerAddress: string;
  wallet: Wallet;
}): Promise<AgentListItem[]> {
  const { getDiscoveryClient } = await import("@agentic-trust/core/server");
  const discoveryClient = await getDiscoveryClient();

  const dc = ensureGetOwnedAgents(discoveryClient as any);
  const agents = await (dc as any).getOwnedAgents(params.ownerAddress, {
    limit: 100,
    offset: 0,
    orderBy: "agentId",
    orderDirection: "DESC",
  });

  return (agents ?? []).map((a: any, i: number) => ({
    id: String(a.agentId ?? a.id ?? i),
    chainId: typeof a.chainId === "number" ? a.chainId : undefined,
    ownerAddress: typeof a.agentOwner === "string" ? a.agentOwner : undefined,
    address: pickAgentAccount(a),
    label: a.agentName ?? a.name ?? undefined,
  }));
}


