"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import clsx from "clsx";
import type { AgentListItem } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiator: AgentListItem | null;
  agents: AgentListItem[];
};

type TxReceiptResponse =
  | { ok: true; found: false }
  | { ok: true; found: true; receipt: { status: number; blockNumber: number; gasUsed: string; transactionHash: string } }
  | { ok: false; error: string };

type AssociateResponse = { ok: true; txHash: string } | { ok: false; error: string };

export function AssociateModal({ open, onOpenChange, initiator, agents }: Props) {
  const [approverId, setApproverId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssociateResponse | null>(null);
  const [receipt, setReceipt] = useState<TxReceiptResponse | null>(null);

  const approver = useMemo(
    () => (approverId ? agents.find((a) => a.id === approverId) ?? null : null),
    [agents, approverId]
  );

  const approverOptions = useMemo(() => {
    if (!initiator) return agents;
    return agents.filter((a) => a.id !== initiator.id);
  }, [agents, initiator]);

  async function submit() {
    if (!initiator || !approver) return;
    setIsSubmitting(true);
    setResult(null);
    setReceipt(null);
    try {
      // Fetch fresh agent information from SDK
      const [initiatorRes, approverRes] = await Promise.all([
        fetch(`/api/agents/${initiator.id}`, { cache: "no-store" }),
        fetch(`/api/agents/${approver.id}`, { cache: "no-store" }),
      ]);

      const initiatorData = await initiatorRes.json();
      const approverData = await approverRes.json();

      console.log("************** initiatorData", initiatorData);
      console.log("************** approverData", approverData);

      if (!initiatorData.ok || !approverData.ok) {
        setResult({
          ok: false,
          error: `Failed to fetch agent info: ${initiatorData.error || approverData.error}`,
        });
        setIsSubmitting(false);
        return;
      }

      // Use agentAccount from the API response (which uses pickAgentAccount to get the correct smart account address)
      const initiatorAgentAccount = initiatorData.agent.agentAccount;
      const approverAgentAccount = approverData.agent.agentAccount;

      console.log("************** initiatorAgentAccount = ", initiatorAgentAccount);
      console.log("************** approverAgentAccount = ", approverAgentAccount);

      if (!initiatorAgentAccount || !approverAgentAccount) {
        setResult({ ok: false, error: "Agent accounts are missing" });
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/associate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          initiatorAddress: initiatorAgentAccount,
          approverAddress: approverAgentAccount,
          // keyType is automatically detected by the API route based on whether addresses are contracts
        }),
      });
      const json = (await res.json()) as AssociateResponse;
      setResult(json);
      if (json.ok) {
        // Poll server for receipt until mined (or timeout).
        for (let i = 0; i < 30; i++) {
          const r = (await fetch(`/api/tx/receipt?hash=${json.txHash}`, { cache: "no-store" }).then((x) =>
            x.json()
          )) as TxReceiptResponse;
          setReceipt(r);
          if (r.ok && r.found) break;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setResult({ ok: false, error: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setApproverId("");
          setIsSubmitting(false);
          setResult(null);
          setReceipt(null);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content
          className={clsx(
            "fixed left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-white/10 bg-[#0f1629] p-5 shadow-2xl"
          )}
        >
          <Dialog.Title className="text-base font-semibold">Associate agents</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-white/60">
            This submits an onchain <code className="text-white/80">storeAssociation</code> tx to your Sepolia proxy.
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/60">Initiator</div>
              <div className="mt-1 font-mono text-sm">{initiator?.address ?? "—"}</div>
            </div>

            <div>
              <label className="text-xs text-white/60">Approver</label>
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                disabled={!initiator || isSubmitting}
              >
                <option value="">Select…</option>
                {approverOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ?? a.address}
                  </option>
                ))}
              </select>
            </div>

            {result ? (
              result.ok ? (
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm">
                  Sent: <span className="font-mono">{result.txHash}</span>
                </div>
              ) : (
                <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm">{result.error}</div>
              )
            ) : null}

            {receipt?.ok && receipt.found ? (
              <div
                className={clsx(
                  "rounded-lg border p-3 text-sm",
                  receipt.receipt.status === 1
                    ? "border-emerald-400/20 bg-emerald-400/10"
                    : "border-red-400/20 bg-red-400/10"
                )}
              >
                Receipt:{" "}
                {receipt.receipt.status === 1 ? (
                  <span className="font-medium">success</span>
                ) : (
                  <span className="font-medium">failed</span>
                )}{" "}
                (block <span className="font-mono">{receipt.receipt.blockNumber}</span>, gas{" "}
                <span className="font-mono">{receipt.receipt.gasUsed}</span>)
              </div>
            ) : receipt?.ok && receipt.found === false ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                Waiting for receipt…
              </div>
            ) : receipt?.ok === false ? (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm">{receipt.error}</div>
            ) : null}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                Close
              </button>
            </Dialog.Close>
            <button
              className={clsx(
                "rounded-lg bg-white px-3 py-2 text-sm font-medium text-black",
                "disabled:opacity-50"
              )}
              disabled={!initiator || !approver || isSubmitting}
              onClick={submit}
            >
              {isSubmitting ? "Submitting…" : "Associate"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


