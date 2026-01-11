export type AgentListItem = {
  chainId?: number;
  id: string;
  address: string; // preferred agent AA address
  agentOwnerAddress?: string; // discovery `agentOwner` (often the AA / smart account)
  eoaOwnerAddress?: string; // discovery `eoaOwner` (if present)
  label?: string;
};


