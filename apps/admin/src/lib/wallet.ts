import { ethers } from "ethers";
import { getAdminPrivateKey, getSepoliaRpcUrl } from "@/lib/config";

export function getSepoliaProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getSepoliaRpcUrl(), 11155111);
}

export function getAdminWallet(): ethers.Wallet {
  return new ethers.Wallet(getAdminPrivateKey());
}

export async function getOwnerAddress(wallet: ethers.Wallet): Promise<string> {
  return await wallet.getAddress();
}


