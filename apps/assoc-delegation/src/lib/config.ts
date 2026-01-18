import { ethers } from "ethers";

const DEFAULTS = {
  sepoliaRpcUrl: "https://rpc.sepolia.org",
  associationsStoreProxy: "0x3418a5297c75989000985802b8ab01229cdddd24",
} as const;

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export function getSepoliaRpcUrl(): string {
  return process.env.SEPOLIA_RPC_URL ?? DEFAULTS.sepoliaRpcUrl;
}

export function getAdminPrivateKey(): string {
  const pk = req("ADMIN_PRIVATE_KEY");
  if (!pk.startsWith("0x") || pk.length !== 66) {
    throw new Error("ADMIN_PRIVATE_KEY must be a 0x-prefixed 32-byte hex private key");
  }
  return pk;
}

export function getInitiatorPrivateKey(): string {
  const pk = req("INITIATOR_PRIVATE_KEY");
  if (!pk.startsWith("0x") || pk.length !== 66) {
    throw new Error("INITIATOR_PRIVATE_KEY must be a 0x-prefixed 32-byte hex private key");
  }
  return pk;
}

export function getAgentOwnerPrivateKey(): string {
  const pk = req("AGENT_OWNER_PRIVATE_KEY");
  if (!pk.startsWith("0x") || pk.length !== 66) {
    throw new Error("AGENT_OWNER_PRIVATE_KEY must be a 0x-prefixed 32-byte hex private key");
  }
  return pk;
}

export function getAssociationsProxyAddress(): string {
  const raw = (process.env.ASSOCIATIONS_STORE_PROXY ?? DEFAULTS.associationsStoreProxy).trim();
  return ethers.getAddress(raw.toLowerCase());
}

export function getAgentId(): number {
  const agentId = process.env.AGENT_ID ? parseInt(process.env.AGENT_ID, 10) : 336;
  if (isNaN(agentId)) throw new Error("AGENT_ID must be a valid number");
  return agentId;
}

export function getAgentAccountAddress(): string | null {
  const addr = process.env.AGENT_ACCOUNT_ADDRESS;
  if (!addr) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error("AGENT_ACCOUNT_ADDRESS must be a valid Ethereum address");
  }
  return ethers.getAddress(addr);
}

