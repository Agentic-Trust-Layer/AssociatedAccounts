import { ethers } from "ethers";

const DEFAULTS = {
  sepoliaRpcUrl: "https://rpc.sepolia.org",
  // keep lowercase so ethers can checksum-normalize it
  associationsStoreProxy: "0x3d282c9e5054e3d819639246c177676a98cb0a1e",
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

export function getAssociationsProxyAddress(): string {
  const raw = (process.env.ASSOCIATIONS_STORE_PROXY ?? DEFAULTS.associationsStoreProxy).trim();
  // Accept lowercase or mixed case; normalize to a checksummed address for ethers.
  return ethers.getAddress(raw.toLowerCase());
}


