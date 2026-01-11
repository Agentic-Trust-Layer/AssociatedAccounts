import { ethers } from "ethers";
import { getAdminPrivateKey, getSepoliaRpcUrl, getInitiatorPrivateKey, getAgentOwnerPrivateKey } from "@/lib/config";

export function getSepoliaProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getSepoliaRpcUrl(), 11155111);
}

export function getAdminWallet(): ethers.Wallet {
  return new ethers.Wallet(getAdminPrivateKey());
}

export function getInitiatorWallet(): ethers.Wallet {
  return new ethers.Wallet(getInitiatorPrivateKey());
}

export function getAgentOwnerWallet(): ethers.Wallet {
  return new ethers.Wallet(getAgentOwnerPrivateKey());
}

export async function getOwnerAddress(wallet: ethers.Wallet): Promise<string> {
  return await wallet.getAddress();
}

