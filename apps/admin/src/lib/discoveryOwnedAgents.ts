import type { AIAgentDiscoveryClient } from "@agentic-trust/8004-ext-sdk";

export type OwnedAgentsOrderBy =
  | "agentId"
  | "agentName"
  | "createdAtTime"
  | "createdAtBlock"
  | "agentOwner"
  | "eoaOwner";
export type OwnedAgentsOrderDirection = "ASC" | "DESC";

const AGENT_FIELDS = `
  chainId
  agentId
  agentAccount
  agentName
  agentCategory
  didIdentity
  didAccount
  didName
  agentUri
  createdAtBlock
  createdAtTime
  updatedAtTime
  type
  description
  image
  a2aEndpoint
  agentAccountType
  did
  mcp
  x402support
  active
  supportedTrust
  rawJson
  feedbackCount
  feedbackAverageScore
  validationPendingCount
  validationCompletedCount
  validationRequestedCount
`;

type OwnedAgentsOptions = {
  chainId?: number;
  limit?: number;
  offset?: number;
  orderBy?: OwnedAgentsOrderBy;
  orderDirection?: OwnedAgentsOrderDirection;
};

function uniqStrings(xs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of xs) {
    const k = String(x);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function buildEoaCandidates(eoaAddress: string, chainId?: number): string[] {
  const raw = String(eoaAddress || "").trim();
  const lower = raw.toLowerCase();
  const cands: string[] = [raw];
  if (lower && lower !== raw) cands.push(lower);
  if (typeof chainId === "number" && Number.isFinite(chainId)) {
    cands.push(`${chainId}:${raw}`);
    if (lower && lower !== raw) cands.push(`${chainId}:${lower}`);
  }
  return uniqStrings(cands);
}

/**
 * Ensure `discoveryClient.getOwnedAgents(eoaAddress, opts)` exists.
 * This matches your working code shape exactly, even if the SDK build doesn't include the method.
 */
export function ensureGetOwnedAgents(discoveryClient: AIAgentDiscoveryClient) {
  const c = discoveryClient as any;
  // Always use our polyfill GraphQL query since the indexer stores addresses as chainId:address
  // and we need to try multiple candidate formats (the SDK's built-in method doesn't handle this)
  c.getOwnedAgents = async (eoaAddress: string, opts: OwnedAgentsOptions = {}) => {
    const limit = typeof opts.limit === "number" ? opts.limit : 100;
    const offset = typeof opts.offset === "number" ? opts.offset : 0;
    const orderBy = opts.orderBy ?? "agentId";
    const orderDirection = opts.orderDirection ?? "DESC";

    // Use searchAgentsGraph with eoaOwner filter (the GraphQL schema doesn't have getOwnedAgents)
    // searchAgentsGraph returns AgentSearchResult { agents: [...] }
    const q = `
      query SearchOwnedAgents($where: AgentWhereInput, $first: Int, $skip: Int, $orderBy: AgentOrderBy, $orderDirection: OrderDirection) {
        searchAgentsGraph(where: $where, first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
          agents {
            ${AGENT_FIELDS}
          }
        }
      }
    `;

    const candidates = buildEoaCandidates(eoaAddress, opts.chainId);
    let lastErr: unknown = null;
    for (const cand of candidates) {
      try {
        const variables: any = {
          where: { eoaOwner: cand },
          first: limit,
          skip: offset,
        };
        // Map orderBy if needed
        if (orderBy && orderDirection) {
          variables.orderBy = orderBy;
          variables.orderDirection = orderDirection;
        }
        const data = await c.request(q, variables);
        const agents = data?.searchAgentsGraph?.agents;
        if (Array.isArray(agents) && agents.length > 0) return agents;
        if (Array.isArray(agents) && candidates.length === 1) return agents;
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return [];
  };

  return discoveryClient as any;
}


