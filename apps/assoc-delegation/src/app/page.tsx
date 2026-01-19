"use client";

import { useState } from "react";

export default function Home() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState(false);
  const [associations, setAssociations] = useState<any>(null);
  const [assocError, setAssocError] = useState<string | null>(null);
  const [validateById, setValidateById] = useState<Record<string, { loading: boolean; ok?: boolean; valid?: boolean; error?: string; digest?: string }>>({});

  async function runTest() {
    setRunning(true);
    setResult(null);
    setError(null);
    setAssociations(null);
    setAssocError(null);
    setValidateById({});

    try {
      const res = await fetch("/api/test", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setResult(json.summary);
      } else {
        setError(json.error || "Unknown error");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }

  async function listAssociations() {
    setListing(true);
    setAssociations(null);
    setAssocError(null);
    setValidateById({});

    try {
      const res = await fetch("/api/associations", { method: "GET" });
      const json = await res.json();
      if (json.ok) {
        setAssociations(json);
      } else {
        setAssocError(json.error || "Unknown error");
      }
    } catch (e: unknown) {
      setAssocError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setListing(false);
    }
  }

  async function validateOneAssociation(a: any) {
    const id = a?.associationId as string;
    if (!id) return;
    setValidateById((m) => ({ ...m, [id]: { loading: true } }));

    try {
      // Reconstruct SAR from the record itself (no secrets).
      const sar = {
        revokedAt: a.revokedAt ?? 0,
        initiatorKeyType: a.initiatorKeyType,
        approverKeyType: a.approverKeyType,
        initiatorSignature: a.initiatorSignature,
        approverSignature: a.approverSignature,
        record: {
          initiator: a.record?.initiator,
          approver: a.record?.approver,
          validAt: a.record?.validAt ?? 0,
          validUntil: a.record?.validUntil ?? 0,
          interfaceId: a.record?.interfaceId ?? "0x00000000",
          data: a.record?.data ?? "0x",
        },
      };

      const res = await fetch("/api/validate-sar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sar }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Validation failed");
      setValidateById((m) => ({ ...m, [id]: { loading: false, ok: true, valid: !!json.valid, digest: json.digest } }));
    } catch (e: any) {
      setValidateById((m) => ({ ...m, [id]: { loading: false, ok: false, error: e?.message || String(e) } }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ERC-8092 Association Delegation Test</h1>
        <p className="text-gray-400 mb-8">
          This test demonstrates the full flow of creating an ERC-8092 association with an EOA initiator and an agent account approver,
          then updating the approver signature using the agent account via ERC-4337 (gasless).
        </p>

        <div className="flex gap-3 flex-wrap items-center">
          <button
            onClick={runTest}
            disabled={running || listing}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
          >
            {running ? "Running test..." : "Run Test"}
          </button>
          <button
            onClick={listAssociations}
            disabled={listing || running}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
          >
            {listing ? "Loading..." : "List Associations"}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <pre className="text-sm text-red-200 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {assocError && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Association Query Error</h2>
            <pre className="text-sm text-red-200 whitespace-pre-wrap">{assocError}</pre>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-green-900/30 border border-green-500 rounded-lg">
            <h2 className="text-xl font-semibold text-green-400 mb-4">Test Completed Successfully!</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Agent Account:</span>{" "}
                <span className="font-mono">{result.agentAccount}</span>
              </div>
              <div>
                <span className="text-gray-400">Initiator EOA:</span>{" "}
                <span className="font-mono">{result.initiatorEOA}</span>
              </div>
              <div>
                <span className="text-gray-400">Association ID:</span>{" "}
                <span className="font-mono break-all">{result.associationId}</span>
              </div>
              {result.storeTransactionHash && (
                <div>
                  <span className="text-gray-400">Store Transaction:</span>{" "}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.storeTransactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline font-mono"
                  >
                    {result.storeTransactionHash}
                  </a>
                </div>
              )}
              {result.updateTransactionHash && (
                <div>
                  <span className="text-gray-400">Update Transaction:</span>{" "}
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.updateTransactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline font-mono"
                  >
                    {result.updateTransactionHash}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {associations && (
          <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Associations</h2>
            <div className="text-sm text-gray-300 mb-4 space-y-1">
              <div>
                <span className="text-gray-400">Proxy:</span> <span className="font-mono">{associations.proxy}</span>
              </div>
              <div>
                <span className="text-gray-400">Agent:</span>{" "}
                <span className="font-mono">{associations.agentAccount}</span>{" "}
                <span className="text-gray-400">(id={associations.agentId})</span>
              </div>
              <div>
                <span className="text-gray-400">Count:</span> {associations.count}
              </div>
            </div>

            <div className="space-y-4">
              {(associations.associations || []).map((a: any) => (
                <div key={a.associationId} className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-gray-400">associationId</div>
                      <div className="flex items-center gap-2">
                        {validateById[a.associationId]?.ok === true && (
                          <span
                            className={
                              validateById[a.associationId]?.valid ? "text-emerald-300 font-semibold" : "text-red-300 font-semibold"
                            }
                          >
                            {validateById[a.associationId]?.valid ? "VALID" : "INVALID"}
                          </span>
                        )}
                        <button
                          onClick={() => validateOneAssociation(a)}
                          disabled={!!validateById[a.associationId]?.loading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium"
                        >
                          {validateById[a.associationId]?.loading ? "Validating..." : "Validate"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="font-mono break-all">{a.associationId}</div>
                    </div>
                    {validateById[a.associationId]?.error && (
                      <div className="p-3 rounded-md bg-red-900/30 border border-red-600">
                        <div className="text-red-300 font-semibold mb-1">Validation failed</div>
                        <div className="text-red-200 text-xs whitespace-pre-wrap">{validateById[a.associationId]?.error}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-gray-400">digest</div>
                      <div className="font-mono break-all">{a.digest}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-400">initiator</div>
                        <div className="font-mono break-all">{a.record?.initiatorAddress || a.record?.initiator}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">approver</div>
                        <div className="font-mono break-all">{a.record?.approverAddress || a.record?.approver}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-400">initiatorKeyType</div>
                        <div>{a.initiatorKeyTypeLabel || a.initiatorKeyType}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">approverKeyType</div>
                        <div>{a.approverKeyTypeLabel || a.approverKeyType}</div>
                      </div>
                    </div>
                    {a.sessionDelegate && (
                      <div>
                        <div className="text-gray-400">session (delegate) address</div>
                        <div className="font-mono break-all">{a.sessionDelegate}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-gray-400">validAt</div>
                        <div className="font-mono">{a.record?.validAt}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">validUntil</div>
                        <div className="font-mono">{a.record?.validUntil}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">revokedAt</div>
                        <div className="font-mono">{a.revokedAt}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-400">interfaceId</div>
                        <div className="font-mono">{a.record?.interfaceId}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">data</div>
                        <div className="font-mono break-all">{a.record?.data}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">initiatorSignature</div>
                      <div className="font-mono break-all">{a.initiatorSignature}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">approverSignature</div>
                      <div className="font-mono break-all">{a.approverSignature}</div>
                    </div>
                    {a.delegateSignature && (
                      <div>
                        <div className="text-gray-400">session (delegate) signature</div>
                        <div className="font-mono break-all">{a.delegateSignature}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-gray-300">Raw JSON</summary>
              <pre className="mt-2 text-xs text-gray-200 whitespace-pre-wrap">{JSON.stringify(associations, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

