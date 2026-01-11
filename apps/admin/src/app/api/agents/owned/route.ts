export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { getDiscoveryClient } from "@agentic-trust/core/server";

function parseEoaParam(input: string): { eoaAddress: string } | null {
  const raw = String(input || "").trim();
  if (!raw) return null;

  // Accept either:
  // - 0xabc...
  // - 11155111:0xabc...  (extract the address part)
  if (raw.startsWith("0x")) {
    if (!ethers.isAddress(raw)) return null;
    return { eoaAddress: ethers.getAddress(raw) };
  }

  const m = raw.match(/^\d+:(0x[0-9a-fA-F]{40})$/);
  if (m) {
    const addr = m[1];
    if (!ethers.isAddress(addr)) return null;
    return { eoaAddress: ethers.getAddress(addr) };
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eoaAddressRaw = searchParams.get("eoaAddress");
    const source = searchParams.get("source") || "unknown";
    const debug = searchParams.get("debug") === "1";

    if (!eoaAddressRaw) {
      return NextResponse.json({ error: "eoaAddress parameter is required" }, { status: 400 });
    }

    const parsed = parseEoaParam(eoaAddressRaw);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid EOA address. Use "0x..." or "chainId:0x..."' },
        { status: 400 }
      );
    }
    const eoaAddress = parsed.eoaAddress;

    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const orderBy = searchParams.get("orderBy") || "agentId";
    const orderDirection = (searchParams.get("orderDirection") || "DESC") as "ASC" | "DESC";

    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const discoveryClient = await getDiscoveryClient();
    const agents = await discoveryClient.getOwnedAgents(eoaAddress, {
      limit,
      offset,
      orderBy: orderBy as any,
      orderDirection,
    });

    const addrPreview =
      typeof eoaAddress === "string" && eoaAddress.length > 10
        ? `${eoaAddress.slice(0, 6)}…${eoaAddress.slice(-4)}`
        : eoaAddress;
    console.info("[API][agents/owned]", { source, eoa: addrPreview, count: agents.length });

    const discoveryUrl = String(process.env.AGENTIC_TRUST_DISCOVERY_URL || "").trim();
    return NextResponse.json({
      success: true,
      agents,
      total: agents.length,
      debug:
        debug || agents.length === 0
          ? {
              source,
              discoveryUrlPresent: Boolean(discoveryUrl),
              discoveryUrl,
              apiKeyPresent: Boolean(String(process.env.AGENTIC_TRUST_DISCOVERY_API_KEY || "").trim()),
            }
          : undefined,
    });
  } catch (error: any) {
    console.error("[API] Error fetching owned agents:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch owned agents",
        debug:
          process.env.NODE_ENV === "production"
            ? {
                discoveryUrlPresent: Boolean(String(process.env.AGENTIC_TRUST_DISCOVERY_URL || "").trim()),
                apiKeyPresent: Boolean(String(process.env.AGENTIC_TRUST_DISCOVERY_API_KEY || "").trim()),
                discoveryEndpoint: (() => {
                  const raw = String(process.env.AGENTIC_TRUST_DISCOVERY_URL || "").trim();
                  if (!raw) return "";
                  return raw.endsWith("/graphql") ? raw : `${raw.replace(/\/$/, "")}/graphql`;
                })(),
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}


