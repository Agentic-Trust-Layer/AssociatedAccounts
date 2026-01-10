import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = Record<string, string | undefined>;
type SessionPackage = {
  agentId: number;
  chainId: number;
  aa: `0x${string}`;
  sessionAA?: `0x${string}`;
  selector: `0x${string}`;
  sessionKey: { privateKey: `0x${string}`; address: `0x${string}`; validAfter: number; validUntil: number };
  entryPoint: `0x${string}`;
  bundlerUrl: string;
  signedDelegation: any;
  delegationRedeemData?: `0x${string}`;
};

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

app.get('/health', (c) => c.json({ ok: true }));

app.get('/.well-known/agent.json', (c) => {
  const origin = new URL(c.req.url).origin.replace(/\/$/, '');
  const name = c.env?.AGENT_NAME || 'agent';
  const description = c.env?.AGENT_DESCRIPTION || 'A simple Agentic Trust agent.';
  return c.json({
    name,
    description,
    endpoints: [
      { name: 'A2A', endpoint: `${origin}/a2a`, version: '0.3.0' },
      { name: 'MCP', endpoint: `${origin}/mcp`, version: '2025-06-18' },
    ],
    skills: [
      {
        id: 'demo.echo',
        name: 'Echo',
        description: 'Echoes input back. Useful for wiring and testing.',
      },
      {
        id: 'agent.feedback.requestAuth',
        name: 'agent.feedback.requestAuth',
        description: 'Issue feedbackAuth for a client (requires SessionPackage configuration).',
      },
    ],
  });
});

function a2aOk(response: unknown) {
  return {
    success: true,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    response,
  };
}

function a2aErr(error: string, status = 400) {
  return {
    status,
    body: {
      success: false,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      error,
    },
  };
}

function defaultPublicRpcUrl(chainId: number): string {
  if (chainId === 11155111) return 'https://rpc.sepolia.org';
  if (chainId === 84532) return 'https://sepolia.base.org';
  if (chainId === 11155420) return 'https://sepolia.optimism.io';
  return 'https://rpc.sepolia.org';
}

function syncAgenticTrustEnv(env: Env) {
  // @agentic-trust/core/server reads process.env for chain configuration.
  // In Workers, we mirror bindings into process.env and globalThis.
  (globalThis as any).__agenticTrustEnv = (globalThis as any).__agenticTrustEnv || {};
  const pe = ((globalThis as any).process?.env ?? (globalThis as any).process?.env) as any;
  if ((globalThis as any).process) {
    (globalThis as any).process.env = (globalThis as any).process.env || {};
  }
  for (const [k, v] of Object.entries(env || {})) {
    if (typeof v === 'string' && k.startsWith('AGENTIC_TRUST_')) {
      try {
        (globalThis as any).process.env[k] = v;
      } catch {
        // ignore
      }
      (globalThis as any).__agenticTrustEnv[k] = v;
    }
  }
  void pe;
}

function loadSessionPackageFromEnv(env: Env): SessionPackage | null {
  const raw = (env.AGENTIC_TRUST_SESSION_PACKAGE_JSON || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPackage;
  } catch {
    return null;
  }
}

async function handleA2A(c: any) {
  const body = (await c.req.json().catch(() => ({}))) as any;
  const skillId = typeof body.skillId === 'string' ? body.skillId : '';
  const payload = (body.payload ?? {}) as any;

  if (!skillId) {
    const err = a2aErr('skillId is required', 400);
    return c.json(err.body, err.status);
  }

  if (skillId === 'demo.echo') {
    return c.json(
      a2aOk({
        skillId,
        output: {
          echoed: payload ?? null,
          metadata: body.metadata ?? null,
        },
      }),
    );
  }

  if (skillId === 'agent.feedback.requestAuth') {
    const clientAddress = String(payload?.clientAddress ?? '').trim();
    const agentIdParam = payload?.agentId;
    const expirySeconds =
      typeof payload?.expirySeconds === 'number' && Number.isFinite(payload.expirySeconds)
        ? payload.expirySeconds
        : undefined;

    if (!clientAddress || !clientAddress.startsWith('0x')) {
      const err = a2aErr('clientAddress is required in payload for agent.feedback.requestAuth', 400);
      return c.json(err.body, err.status);
    }

    syncAgenticTrustEnv(c.env || {});

    // Ensure an RPC URL exists (fallback to public) so core can construct clients.
    const chainId =
      typeof payload?.chainId === 'number' && Number.isFinite(payload.chainId) ? payload.chainId : 11155111;
    const rpcKey =
      chainId === 11155111
        ? 'AGENTIC_TRUST_RPC_URL_SEPOLIA'
        : chainId === 84532
          ? 'AGENTIC_TRUST_RPC_URL_BASE_SEPOLIA'
          : chainId === 11155420
            ? 'AGENTIC_TRUST_RPC_URL_OPTIMISM_SEPOLIA'
            : 'AGENTIC_TRUST_RPC_URL_SEPOLIA';
    if (!(c.env as any)[rpcKey]) {
      (c.env as any)[rpcKey] = defaultPublicRpcUrl(chainId);
      syncAgenticTrustEnv(c.env || {});
    }

    const sessionPackage = loadSessionPackageFromEnv(c.env || {});
    if (!sessionPackage) {
      const err = a2aErr(
        'SessionPackage missing. Set AGENTIC_TRUST_SESSION_PACKAGE_JSON as a Wrangler secret and redeploy.',
        400,
      );
      return c.json(err.body, err.status);
    }

    const agentIdResolved =
      agentIdParam !== undefined && agentIdParam !== null ? String(agentIdParam) : String(sessionPackage.agentId);

    try {
      // IMPORTANT: Lazy import inside handler.
      // Wrangler validates worker module global scope and disallows async I/O / randomness there.
      // @agentic-trust/core/server has some initialization that must only run inside handlers.
      const { getAgenticTrustClient } = await import('@agentic-trust/core/server');
      const atClient = await getAgenticTrustClient();
      const agent = await atClient.agents.getAgent(agentIdResolved);
      if (!agent) {
        const err = a2aErr('Agent not found', 404);
        return c.json(err.body, err.status);
      }
      // SessionPackage is parsed from env JSON; cast to satisfy core's stricter typing.
      agent.setSessionPackage(sessionPackage as any);
      const issued = await agent.requestAuth({
        clientAddress: clientAddress as `0x${string}`,
        agentId: agentIdResolved,
        expirySeconds,
        skillId,
      });
      return c.json(a2aOk({ feedbackAuth: issued.feedbackAuth, agentId: issued.agentId, chainId }));
    } catch (e: any) {
      const err = a2aErr(e?.message || 'Failed to create feedbackAuth', 500);
      return c.json(err.body, err.status);
    }
  }

  const err = a2aErr('Skill not implemented', 404);
  return c.json({ ...err.body, skillId }, err.status);
}

app.post('/a2a', handleA2A);
// Compatibility: core/server provider historically posts to /api/a2a
app.post('/api/a2a', handleA2A);

app.post('/mcp', async (c) => {
  return c.json(
    {
      ok: false,
      error: 'MCP endpoint stub. Implement MCP protocol handling here.',
    },
    501,
  );
});
app.post('/api/mcp', async (c) => {
  return c.json(
    {
      ok: false,
      error: 'MCP endpoint stub. Implement MCP protocol handling here.',
    },
    501,
  );
});

export default app;
