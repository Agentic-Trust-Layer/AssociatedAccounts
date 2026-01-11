"use client";

import { useState } from "react";

export default function Home() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTest() {
    setRunning(true);
    setResult(null);
    setError(null);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ERC-8092 Association Delegation Test</h1>
        <p className="text-gray-400 mb-8">
          This test demonstrates the full flow of creating an ERC-8092 association with an EOA initiator and an agent account approver,
          then updating the approver signature using the agent account via ERC-4337 (gasless).
        </p>

        <button
          onClick={runTest}
          disabled={running}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
        >
          {running ? "Running test..." : "Run Test"}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <pre className="text-sm text-red-200 whitespace-pre-wrap">{error}</pre>
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
      </div>
    </div>
  );
}

