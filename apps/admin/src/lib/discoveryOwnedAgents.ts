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
  agentOwner
  agentName
  agentCategory
  didIdentity
  didAccount
  didName
  tokenUri
  createdAtBlock
  createdAtTime
  updatedAtTime
  type
  description
  image
  a2aEndpoint
  ensEndpoint
  agentAccountEndpoint
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
  limit?: number;
  offset?: number;
  orderBy?: OwnedAgentsOrderBy;
  orderDirection?: OwnedAgentsOrderDirection;
};

/**
 * Ensure `discoveryClient.getOwnedAgents(eoaAddress, opts)` exists.
 * This matches your working code shape exactly, even if the SDK build doesn't include the method.
 */
export function ensureGetOwnedAgents(discoveryClient: AIAgentDiscoveryClient) {
  const c = discoveryClient as any;
  if (typeof c.getOwnedAgents === "function") return discoveryClient as any;

  c.getOwnedAgents = async (eoaAddress: string, opts: OwnedAgentsOptions = {}) => {
    const limit = typeof opts.limit === "number" ? opts.limit : 100;
    const offset = typeof opts.offset === "number" ? opts.offset : 0;
    const orderBy = opts.orderBy ?? "agentId";
    const orderDirection = opts.orderDirection ?? "DESC";

    const q = `
      query OwnedAgents($eoaAddress: String!, $limit: Int, $offset: Int, $orderBy: String, $orderDirection: String) {
        getOwnedAgents(eoaAddress: $eoaAddress, limit: $limit, offset: $offset, orderBy: $orderBy, orderDirection: $orderDirection) {
          ${AGENT_FIELDS}
        }
      }
    `;
    const data = await c.request(q, { eoaAddress, limit, offset, orderBy, orderDirection });
    const agents = data?.getOwnedAgents;
    return Array.isArray(agents) ? agents : [];
  };

  return discoveryClient as any;
}


