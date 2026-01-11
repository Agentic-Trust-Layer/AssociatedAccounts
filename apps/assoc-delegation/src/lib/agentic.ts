import type { Wallet } from "ethers";

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

// Server-side only. Uses the discovery indexer's owned-agents endpoint.
export async function getAgentById(agentId: number | string, ownerAddress: string): Promise<{ agentAccount: string; agentOwner?: string; eoaOwner?: string; label?: string } | null> {
  const { getDiscoveryClient } = await import("@agentic-trust/core/server");
  const discoveryClient = await getDiscoveryClient();

  const agents = await discoveryClient.getOwnedAgents(ownerAddress, {
    limit: 1000,
    offset: 0,
    orderBy: "agentId",
    orderDirection: "DESC",
  });

  const agent = agents.find((a: any) => String(a.agentId ?? a.id) === String(agentId));
  if (!agent) return null;

  const agentAccount = pickAgentAccount(agent);
  if (!agentAccount) return null;

  return {
    agentAccount,
    agentOwner: typeof agent.agentOwner === "string" ? agent.agentOwner : undefined,
    eoaOwner: typeof agent.eoaOwner === "string" ? agent.eoaOwner : undefined,
    label: agent.agentName ?? agent.name ?? undefined,
  };
}

