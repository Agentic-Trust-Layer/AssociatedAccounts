"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import clsx from "clsx";

type Assoc = {
  associationId: string;
  initiator: string;
  approver: string;
  counterparty: string;
  validAt: number;
  validUntil: number;
  revokedAt: number;
  initiatorSignature: string;
  approverSignature: string;
  initiatorBytes?: string; // original bytes from contract
  approverBytes?: string; // original bytes from contract
  interfaceId?: string;
  data?: string;
};

type Resp =
  | { ok: true; chainId: number; account: string; associations: Assoc[] }
  | { ok: false; error: string };

export function AssociationsModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: string | null;
  label?: string;
  agentId?: string | null;
}) {
  const { open, onOpenChange, account, label, agentId } = props;
  const [data, setData] = useState<Resp | null>(null);
  const [revokeTx, setRevokeTx] = useState<string | null>(null);
  const [revokeReceipt, setRevokeReceipt] = useState<any | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [signingFor, setSigningFor] = useState<{ associationId: string; role: "initiator" | "approver" } | null>(null);
  const [signatureResult, setSignatureResult] = useState<Record<string, { initiator?: string; approver?: string }>>({});

  async function refresh() {
    if (!account) return;
    const res = await fetch(`/api/associations?account=${encodeURIComponent(account)}`, { cache: "no-store" });
    const json = (await res.json()) as Resp;
    setData(json);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setData(null);
    (async () => {
      // If account is not available but agentId is, fetch agent info first
      let accountToUse = account;
      console.log("************** accountToUse = ", accountToUse);
      console.log("************** agentId = ", agentId);
      if (agentId) {
        try {
          const agentRes = await fetch(`/api/agents/${agentId}`, { cache: "no-store" });
          const agentData = await agentRes.json();
          console.log("************** agentData = ", agentData);
          if (agentData.agent?.rawAgent?.agentAccount) {
            accountToUse = agentData.agent.rawAgent.agentAccount;
          }
        } catch (e) {
          console.error("Failed to fetch agent info:", e);
        }
      }
      
      if (!accountToUse) {
        if (!cancelled) setData({ ok: false, error: "Agent account not found" });
        return;
      }
      
      console.log("************** fetching associations for : ", accountToUse);
      const res = await fetch(`/api/associations?account=${encodeURIComponent(accountToUse)}`, { cache: "no-store" });
      const json = (await res.json()) as Resp;
      if (!cancelled) setData(json);
    })().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (!cancelled) setData({ ok: false, error: msg });
    });
    return () => {
      cancelled = true;
    };
  }, [open, account, agentId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content
          className={clsx(
            "fixed left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-white/10 bg-[#0f1629] p-5 shadow-2xl"
          )}
        >
          <Dialog.Title className="text-base font-semibold">Associations</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-white/60">
            {label ?? "Agent"}: <span className="font-mono text-white/80">{account ?? "—"}</span>
          </Dialog.Description>

          <div className="mt-4">
            {data === null ? (
              <div className="text-sm text-white/70"> Loading 3 ...</div>
            ) : data.ok === false ? (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm">{data.error}</div>
            ) : data.associations.length === 0 ? (
              <div className="text-sm text-white/70">No associations found.</div>
            ) : (
              <div className="space-y-2">
                {data.associations.map((a, i) => {
                  const active = a.revokedAt === 0;
                  return (
                    <div key={`${a.initiator}-${a.approver}-${i}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs text-white/60">#{i + 1}</div>
                        <div className="flex items-center gap-2">
                          <div
                            className={clsx(
                              "rounded-md px-2 py-1 text-xs",
                              active ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"
                            )}
                          >
                            {active ? "active" : "revoked"}
                          </div>
                          {active ? (
                            <button
                              className="rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                              onClick={async () => {
                                if (!account) return;
                                setRevokeTx(null);
                                setRevokeReceipt(null);
                                setRevokeError(null);
                                try {
                                  const res = await fetch("/api/associations/revoke", {
                                    method: "POST",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({
                                      associationId: a.associationId,
                                      fromAccount: account,
                                      revokedAt: 0,
                                    }),
                                  });
                                  const json = await res.json();
                                  if (!json.ok) throw new Error(json.error ?? "Failed to revoke");
                                  setRevokeTx(json.txHash ?? json.userOpHash);

                                  if (json.txHash) {
                                    for (let k = 0; k < 30; k++) {
                                      const r = await fetch(`/api/tx/receipt?hash=${json.txHash}`, { cache: "no-store" }).then((x) =>
                                        x.json()
                                      );
                                      setRevokeReceipt(r);
                                      if (r.ok && r.found) break;
                                      await new Promise((resolve) => setTimeout(resolve, 2000));
                                    }
                                  }
                                  await refresh();
                                } catch (err: any) {
                                  setRevokeError(err?.message ?? "Failed to revoke");
                                }
                              }}
                            >
                              Revoke
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs">
                        <div>
                          <div className="text-white/60">initiator</div>
                          <div className="font-mono">{a.initiator}</div>
                        </div>
                        <div>
                          <div className="text-white/60">approver</div>
                          <div className="font-mono">{a.approver}</div>
                        </div>
                        <div>
                          <div className="text-white/60">counterparty</div>
                          <div className="font-mono">{a.counterparty}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-white/60">validAt</div>
                            <div className="font-mono">{a.validAt}</div>
                          </div>
                          <div>
                            <div className="text-white/60">validUntil</div>
                            <div className="font-mono">{a.validUntil}</div>
                          </div>
                          <div>
                            <div className="text-white/60">revokedAt</div>
                            <div className="font-mono">{a.revokedAt}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60">associationId</div>
                          <div className="font-mono text-xs break-all">{a.associationId}</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="text-white/60">initiatorSignature</div>
                            <button
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                              onClick={async () => {
                                if (!a.initiatorBytes || !a.approverBytes) return;
                                setSigningFor({ associationId: a.associationId, role: "initiator" });
                                try {
                                  const res = await fetch("/api/associations/sign", {
                                    method: "POST",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({
                                      initiator: a.initiatorBytes,
                                      approver: a.approverBytes,
                                      validAt: a.validAt,
                                      validUntil: a.validUntil,
                                      interfaceId: a.interfaceId || "0x00000000",
                                      data: a.data || "0x",
                                      role: "initiator",
                                      storeOnChain: true,
                                      associationId: a.associationId,
                                      fromAccount: a.initiator,
                                      existingInitiatorSignature: a.initiatorSignature !== "0x" ? a.initiatorSignature : undefined,
                                      existingApproverSignature: a.approverSignature !== "0x" ? a.approverSignature : undefined,
                                    }),
                                  });
                                  const json = await res.json();
                                  if (json.ok) {
                                    setSignatureResult((prev) => ({
                                      ...prev,
                                      [a.associationId]: { ...prev[a.associationId], initiator: json.signature },
                                    }));
                                    // Refresh associations if stored on-chain
                                    if (json.txHash && account) {
                                      await refresh();
                                    } else if (json.storeError) {
                                      console.warn("Signature generated but not stored:", json.storeError);
                                    }
                                  } else {
                                    console.error("Failed to sign:", json.error);
                                  }
                                } catch (e) {
                                  console.error("Error signing:", e);
                                } finally {
                                  setSigningFor(null);
                                }
                              }}
                              disabled={signingFor?.associationId === a.associationId && signingFor?.role === "initiator"}
                            >
                              {signingFor?.associationId === a.associationId && signingFor?.role === "initiator"
                                ? "Signing..."
                                : "Sign"}
                            </button>
                          </div>
                          <div className="font-mono text-xs break-all">
                            {signatureResult[a.associationId]?.initiator ||
                              (a.initiatorSignature === "0x" || !a.initiatorSignature ? "—" : a.initiatorSignature)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="text-white/60">approverSignature</div>
                            <button
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                              onClick={async () => {
                                if (!a.initiatorBytes || !a.approverBytes) return;
                                setSigningFor({ associationId: a.associationId, role: "approver" });
                                try {
                                  const res = await fetch("/api/associations/sign", {
                                    method: "POST",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({
                                      initiator: a.initiatorBytes,
                                      approver: a.approverBytes,
                                      validAt: a.validAt,
                                      validUntil: a.validUntil,
                                      interfaceId: a.interfaceId || "0x00000000",
                                      data: a.data || "0x",
                                      role: "approver",
                                      storeOnChain: true,
                                      associationId: a.associationId,
                                      fromAccount: a.approver,
                                      existingInitiatorSignature: a.initiatorSignature !== "0x" ? a.initiatorSignature : undefined,
                                      existingApproverSignature: a.approverSignature !== "0x" ? a.approverSignature : undefined,
                                    }),
                                  });
                                  const json = await res.json();
                                  if (json.ok) {
                                    setSignatureResult((prev) => ({
                                      ...prev,
                                      [a.associationId]: { ...prev[a.associationId], approver: json.signature },
                                    }));
                                    // Refresh associations if stored on-chain
                                    if (json.txHash && account) {
                                      await refresh();
                                    } else if (json.storeError) {
                                      console.warn("Signature generated but not stored:", json.storeError);
                                    }
                                  } else {
                                    console.error("Failed to sign:", json.error);
                                  }
                                } catch (e) {
                                  console.error("Error signing:", e);
                                } finally {
                                  setSigningFor(null);
                                }
                              }}
                              disabled={signingFor?.associationId === a.associationId && signingFor?.role === "approver"}
                            >
                              {signingFor?.associationId === a.associationId && signingFor?.role === "approver"
                                ? "Signing..."
                                : "Sign"}
                            </button>
                          </div>
                          <div className="font-mono text-xs break-all">
                            {signatureResult[a.associationId]?.approver ||
                              (a.approverSignature === "0x" || !a.approverSignature ? "—" : a.approverSignature)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {revokeTx ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              Revoke tx: <span className="font-mono">{revokeTx}</span>
              {revokeReceipt?.ok && revokeReceipt.found ? (
                <span className="ml-2 text-white/70">
                  (status {String(revokeReceipt.receipt.status)}, block {String(revokeReceipt.receipt.blockNumber)})
                </span>
              ) : null}
            </div>
          ) : null}
          {revokeError ? (
            <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm">{revokeError}</div>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Dialog.Close asChild>
              <button className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


