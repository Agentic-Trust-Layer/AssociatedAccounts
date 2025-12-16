"use client";

import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background as ReactFlowBackground,
  Controls as ReactFlowControls,
  MiniMap as ReactFlowMiniMap,
  type Node as RFNode,
  type Edge as RFEdge,
} from "@xyflow/react";
import type { AgentListItem } from "@/lib/types";

type Assoc = {
  associationId: string;
  initiator: string;
  approver: string;
  counterparty: string;
  validAt: number;
  validUntil: number;
  revokedAt: number;
};

type Resp =
  | { ok: true; chainId: number; account: string; associations: Assoc[] }
  | { ok: false; error: string };

function shortAddr(a: string) {
  return a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function AssociationsGraphModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  center: AgentListItem | null;
  agentsIndex: AgentListItem[];
}) {
  const { open, onOpenChange, center, agentsIndex } = props;
  const [data, setData] = useState<Resp | null>(null);
  const [expanded, setExpanded] = useState<Record<string, Resp>>({});

  const byAddress = useMemo(() => {
    const m = new Map<string, AgentListItem>();
    for (const a of agentsIndex) {
      m.set(a.address.toLowerCase(), a);
    }
    return m;
  }, [agentsIndex]);

  useEffect(() => {
    if (!open || !center?.address) return;
    let cancelled = false;
    setData(null);
    setExpanded({});
    (async () => {
      const res = await fetch(`/api/associations?account=${encodeURIComponent(center.address)}`, { cache: "no-store" });
      const json = (await res.json()) as Resp;
      if (!cancelled) setData(json);
    })().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setData({ ok: false, error: msg });
    });
    return () => {
      cancelled = true;
    };
  }, [open, center?.address]);

  // Expand the graph: fetch associations for each first-hop counterparty (depth = 2 total).
  useEffect(() => {
    if (!open || !center?.address) return;
    if (!data || data.ok === false) return;
    const rootAddr = center.address.toLowerCase();
    const firstHops = Array.from(
      new Set(
        (data.associations ?? [])
          .map((a) => a.counterparty?.toLowerCase?.() ?? "")
          .filter((a) => a && a !== rootAddr)
      )
    ).slice(0, 12); // keep it bounded

    if (firstHops.length === 0) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        firstHops.map(async (addr) => {
          const res = await fetch(`/api/associations?account=${encodeURIComponent(addr)}`, { cache: "no-store" });
          const json = (await res.json()) as Resp;
          return [addr, json] as const;
        })
      );
      if (cancelled) return;
      setExpanded((prev) => {
        const next = { ...prev };
        for (const r of results) {
          if (r.status === "fulfilled") {
            const [addr, json] = r.value;
            next[addr] = json;
          }
        }
        return next;
      });
    })().catch(() => {
      // ignore expansion errors; root graph still renders
    });

    return () => {
      cancelled = true;
    };
  }, [open, center?.address, data]);

  const graph = useMemo(() => {
    const centerAddr = center?.address?.toLowerCase();
    const associations = data && "ok" in data && data.ok ? data.associations : [];

    // Collect first-hop counterpart addresses (relative to center query)
    const counterparts = new Map<string, { count: number; activeCount: number }>();
    for (const a of associations) {
      const other = a.counterparty?.toLowerCase?.() ?? null;
      if (!other) continue;
      const prev = counterparts.get(other) ?? { count: 0, activeCount: 0 };
      prev.count += 1;
      if (a.revokedAt === 0) prev.activeCount += 1;
      counterparts.set(other, prev);
    }

    const nodes: RFNode[] = [];
    const edges: RFEdge[] = [];
    const seenNode = new Set<string>();
    const seenEdge = new Set<string>();

    const centerLabel = center
      ? `#${center.id} ${center.label ?? "Agent"}\n${shortAddr(center.address)}`
      : "Agent";
    const centerId = centerAddr ? `a-${centerAddr}` : "center";
    nodes.push({
      id: centerId,
      // Selected agent: fixed at top-center (others are below)
      position: { x: 0, y: -260 },
      data: { label: centerLabel },
      style: {
        background: "#0f172a",
        color: "white",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 10,
        width: 240,
        textAlign: "center",
        whiteSpace: "pre-line",
      },
    });
    seenNode.add(centerId);

    const entries = Array.from(counterparts.entries());
    // First-hop: row beneath the selected agent.
    const spacingX = 300;
    const rowY = 0;
    entries.forEach(([addr, meta], idx) => {
      const x = Math.round((idx - (entries.length - 1) / 2) * spacingX);
      const y = rowY;
      const known = byAddress.get(addr);
      const id = `a-${addr}`;
      const label = `${known ? `#${known.id} ${known.label ?? "Agent"}` : `Agent`}\n${shortAddr(addr)}\n${meta.activeCount}/${meta.count} active`;
      nodes.push({
        id,
        position: { x, y },
        data: { label },
        style: {
          background: "rgba(255,255,255,0.06)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 10,
          width: 240,
          textAlign: "center",
          whiteSpace: "pre-line",
        },
      });
      seenNode.add(id);
    });

    // Second-hop: associations for first-hop nodes.
    // We only expand nodes we fetched (`expanded`), and add the "other side" as second-hop nodes.
    const secondHopByParent = new Map<string, string[]>();
    for (const [parentAddr, resp] of Object.entries(expanded)) {
      if (!resp || resp.ok === false) continue;
      const parentId = `a-${parentAddr.toLowerCase()}`;
      const out: string[] = [];
      for (const a of resp.associations ?? []) {
        const other = a.counterparty?.toLowerCase?.() ?? "";
        if (!other) continue;
        // Hide the back-edge to center in the second-hop layout (edge itself will still exist via associationId)
        if (other === centerAddr) continue;
        out.push(other);
      }
      secondHopByParent.set(parentId, Array.from(new Set(out)).slice(0, 8));
    }

    for (const [parentId, seconds] of secondHopByParent.entries()) {
      const parentNode = nodes.find((n) => n.id === parentId);
      const baseX = parentNode?.position?.x ?? 0;
      seconds.forEach((addr, i) => {
        const id = `a-${addr}`;
        if (!seenNode.has(id)) {
          const known = byAddress.get(addr);
          const label = `${known ? `#${known.id} ${known.label ?? "Agent"}` : `Agent`}\n${shortAddr(addr)}`;
          nodes.push({
            id,
            position: { x: baseX, y: 260 + i * 140 },
            data: { label },
            style: {
              background: "rgba(255,255,255,0.04)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12,
              padding: 10,
              width: 240,
              textAlign: "center",
              whiteSpace: "pre-line",
            },
          });
          seenNode.add(id);
        }
      });
    }

    // Build edges from all fetched association sets (root + expanded), deduped by associationId.
    const allAssocs: Assoc[] = [];
    allAssocs.push(...associations);
    for (const r of Object.values(expanded)) {
      if (r && r.ok) allAssocs.push(...(r.associations ?? []));
    }

    for (const a of allAssocs) {
      const id = `e-${a.associationId}`;
      if (seenEdge.has(id)) continue;
      seenEdge.add(id);

      const s = a.initiator.toLowerCase();
      const t = a.approver.toLowerCase();
      const source = `a-${s}`;
      const target = `a-${t}`;
      // Ensure endpoints exist (as small nodes) if they weren't already created via layout.
      for (const [addrLower, nodeId] of [
        [s, source],
        [t, target],
      ] as const) {
        if (!seenNode.has(nodeId)) {
          const known = byAddress.get(addrLower);
          const label = `${known ? `#${known.id} ${known.label ?? "Agent"}` : `Agent`}\n${shortAddr(addrLower)}`;
          nodes.push({
            id: nodeId,
            position: { x: 0, y: 520 }, // fallback; fitView will handle
            data: { label },
            style: {
              background: "rgba(255,255,255,0.03)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12,
              padding: 10,
              width: 240,
              textAlign: "center",
              whiteSpace: "pre-line",
            },
          });
          seenNode.add(nodeId);
        }
      }

      edges.push({
        id,
        source,
        target,
        animated: a.revokedAt === 0,
        style: {
          stroke: a.revokedAt === 0 ? "#22c55e" : "rgba(255,255,255,0.25)",
          strokeDasharray: a.revokedAt === 0 ? undefined : "6 4",
        },
      });
    }

    return { nodes, edges };
  }, [data, expanded, center, byAddress]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content
          className={clsx(
            "fixed left-1/2 top-1/2 h-[86vh] w-[94vw] max-w-5xl -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-white/10 bg-[#0f1629] p-4 shadow-2xl"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold">Associations graph</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-white/60">
                Center: <span className="font-mono text-white/80">{center?.address ?? "—"}</span>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">Close</button>
            </Dialog.Close>
          </div>

          <div className="mt-3 h-[calc(86vh-88px)] overflow-hidden rounded-lg border border-white/10">
            {data === null ? (
              <div className="p-4 text-sm text-white/70">Loading…</div>
            ) : data.ok === false ? (
              <div className="p-4 text-sm text-red-200">{data.error}</div>
            ) : (
              <ReactFlow
                nodes={graph.nodes}
                edges={graph.edges}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
              >
                <ReactFlowBackground />
                <ReactFlowMiniMap pannable zoomable />
                <ReactFlowControls showInteractive={false} />
              </ReactFlow>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


