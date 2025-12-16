import { AgentsList } from "@/components/AgentsList";

export default function Page() {
  return (
    <main className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-white/60">
            Owned by the server-side deployer key (from <code className="text-white/80">ADMIN_PRIVATE_KEY</code>).
          </p>
        </div>
      </header>

      <AgentsList />
    </main>
  );
}


