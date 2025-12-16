import { ethers } from "ethers";
import { formatEvmV1 } from "@/lib/erc7930";

const DOMAIN_TYPEHASH = ethers.id("EIP712Domain(string name,string version)");
const NAME_HASH = ethers.id("AssociatedAccounts");
const VERSION_HASH = ethers.id("1");
const MESSAGE_TYPEHASH = ethers.id(
  "AssociatedAccountRecord(bytes initiator,bytes approver,uint40 validAt,uint40 validUntil,bytes4 interfaceId,bytes data)"
);

const abi = ethers.AbiCoder.defaultAbiCoder();

function domainSeparator(): string {
  return ethers.keccak256(abi.encode(["bytes32", "bytes32", "bytes32"], [DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH]));
}

function hashStruct(params: {
  initiator: string;
  approver: string;
  validAt: number;
  validUntil: number;
  interfaceId: string;
  data: string;
}): string {
  return ethers.keccak256(
    abi.encode(
      ["bytes32", "bytes32", "bytes32", "uint40", "uint40", "bytes4", "bytes32"],
      [
        MESSAGE_TYPEHASH,
        ethers.keccak256(params.initiator),
        ethers.keccak256(params.approver),
        params.validAt,
        params.validUntil,
        params.interfaceId,
        ethers.keccak256(params.data),
      ]
    )
  );
}

function eip712Hash(params: Parameters<typeof hashStruct>[0]): string {
  const ds = domainSeparator();
  const hs = hashStruct(params);
  return ethers.keccak256(ethers.solidityPacked(["bytes2", "bytes32", "bytes32"], ["0x1901", ds, hs]));
}

export async function buildSignedAssociation(params: {
  chainId: number;
  wallet: ethers.Wallet;
  initiatorAddress: string;
  approverAddress: string;
  initiatorKeyType: string; // bytes2 hex
  approverKeyType: string; // bytes2 hex
  // if true, sign with ADMIN_PRIVATE_KEY *only* when initiator/approver is that EOA.
  signIfEOA?: boolean;
  validAt?: number;
}) {
  const now = typeof params.validAt === "number" ? params.validAt : Math.floor(Date.now() / 1000);
  const initiator = formatEvmV1(params.chainId, params.initiatorAddress);
  const approver = formatEvmV1(params.chainId, params.approverAddress);

  const record = {
    initiator,
    approver,
    validAt: now,
    validUntil: 0,
    interfaceId: "0x00000000",
    data: "0x",
  };

  let initiatorSignature = "0x";
  let approverSignature = "0x";

  if (params.signIfEOA) {
    const digest = eip712Hash(record);
    const signerAddr = (await params.wallet.getAddress()).toLowerCase();
    if (params.initiatorAddress.toLowerCase() === signerAddr) {
      initiatorSignature = await params.wallet.signMessage(ethers.getBytes(digest));
    }
    if (params.approverAddress.toLowerCase() === signerAddr) {
      approverSignature = await params.wallet.signMessage(ethers.getBytes(digest));
    }
  }

  return {
    revokedAt: 0,
    initiatorKeyType: params.initiatorKeyType,
    approverKeyType: params.approverKeyType,
    initiatorSignature,
    approverSignature,
    record,
  };
}


