export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDiscoveryClient } from "@agentic-trust/core/server";
import { ensureGetOwnedAgents } from "@/lib/discoveryOwnedAgents";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eoaAddress = searchParams.get("eoaAddress");
    const source = searchParams.get("source") || "unknown";
    const debug = searchParams.get("debug") === "1";

    if (!eoaAddress) {
      return NextResponse.json({ error: "eoaAddress parameter is required" }, { status: 400 });
    }

    if (typeof eoaAddress !== "string" || !eoaAddress.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid EOA address format" }, { status: 400 });
    }

    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const orderBy = searchParams.get("orderBy") || "agentId";
    const orderDirection = (searchParams.get("orderDirection") || "DESC") as "ASC" | "DESC";

    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const discoveryClient = await getDiscoveryClient();
    const dc = ensureGetOwnedAgents(discoveryClient as any);
    const agents = await (dc as any).getOwnedAgents(eoaAddress, {
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


