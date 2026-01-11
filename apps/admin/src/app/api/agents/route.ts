import { NextResponse } from "next/server";
import { getAdminWallet, getOwnerAddress } from "@/lib/wallet";
import { listOwnedAgents } from "@/lib/agentic";

export async function GET() {
  try {
    const wallet = getAdminWallet();
    const ownerAddress = await getOwnerAddress(wallet);
    if (!ownerAddress || !ownerAddress.startsWith("0x")) {
      return NextResponse.json(
        { ok: false, error: `Invalid owner address: ${ownerAddress}` },
        { status: 500 }
      );
    }
    const agents = await listOwnedAgents({ ownerAddress, wallet });
    console.log("************** agents", agents);
    return NextResponse.json({ ok: true, ownerAddress, agents });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[API][agents] Error:", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}


