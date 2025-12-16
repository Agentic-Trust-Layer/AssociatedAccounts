export type AgentListItem = {
  chainId?: number;
  id: string;
  address: string; // preferred agent AA address
  ownerAddress?: string; // agentOwner from discovery (often the AA)
  label?: string;
};


