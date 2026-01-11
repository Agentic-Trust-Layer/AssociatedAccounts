"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AssociateModal } from "@/components/AssociateModal";
import { AssociationsModal } from "@/components/AssociationsModal";
import { AssociationsGraphModal } from "@/components/AssociationsGraphModal";
import type { AgentListItem } from "@/lib/types";

type AgentsResponse =
  | { ok: true; ownerAddress: string; agents: AgentListItem[] }
  | { ok: false; error: string };

export function AgentsList() {
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [selected, setSelected] = useState<AgentListItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [assocOpen, setAssocOpen] = useState(false);
  const [assocFor, setAssocFor] = useState<AgentListItem | null>(null);
  const [graphOpen, setGraphOpen] = useState(false);
  const [graphFor, setGraphFor] = useState<AgentListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/agents", { cache: "no-store" });
      const json = (await res.json()) as AgentsResponse;
      console.log("************** json", json);
      if (!cancelled) setData(json);
    })().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setData({ ok: false, error: msg });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const agents = useMemo(() => (data?.ok ? data.agents : []), [data]);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div className="text-sm font-medium">Your agents</div>
        {data?.ok ? (
          <div className="text-xs text-white/60">
            Owner: <span className="font-mono text-white/80">{data.ownerAddress}</span>
          </div>
        ) : null}
      </div>

      <div className="p-2">
        {data === null ? (
          <div className="p-4 text-sm text-white/70">Loading 1 …</div>
        ) : data.ok === false ? (
          <div className="p-4 text-sm text-red-200">
            {data.error}
            <div className="mt-2 text-xs text-white/60">
              Make sure <code className="text-white/80">AGENTIC_TRUST_DISCOVERY_URL</code> and{" "}
              <code className="text-white/80">AGENTIC_TRUST_DISCOVERY_API_KEY</code> are set in{" "}
              <code className="text-white/80">apps/admin/.env.local</code>.
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="p-4 text-sm text-white/70">No agents found.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {agents.map((a) => (
              <li key={a.id}>
                <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-white/5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {a.label ?? "Agent"} <span className="font-mono text-xs text-white/60">#{a.id}</span>
                      {typeof a.chainId === "number" ? (
                        <span className="ml-2 font-mono text-xs text-white/50">chain {a.chainId}</span>
                      ) : null}
                    </div>
                    <div className="truncate font-mono text-xs text-white/60">{a.address}</div>
                    {a.agentOwnerAddress ? (
                      <div className="truncate font-mono text-[11px] text-white/40">
                        agentOwner: {a.agentOwnerAddress}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                      onClick={() => {
                        setAssocFor(a);
                        setAssocOpen(true);
                      }}
                    >
                      Show
                    </button>
                    <button
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                      onClick={() => {
                        setGraphFor(a);
                        setGraphOpen(true);
                      }}
                    >
                      Graph
                    </button>
                    <button
                      className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-black"
                      onClick={() => {
                        setSelected(a);
                        setIsOpen(true);
                      }}
                    >
                      Associate
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AssociateModal
        open={isOpen}
        onOpenChange={setIsOpen}
        initiator={selected}
        agents={agents}
      />

      <AssociationsModal
        open={assocOpen}
        onOpenChange={setAssocOpen}
        account={assocFor?.address || assocFor?.agentOwnerAddress || null}
        label={assocFor?.label}
        agentId={assocFor?.id ?? null}
      />

      <AssociationsGraphModal
        open={graphOpen}
        onOpenChange={setGraphOpen}
        center={graphFor}
        agentsIndex={agents}
      />
    </section>
  );
}


