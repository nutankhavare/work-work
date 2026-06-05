import "dotenv/config";
import { Pool } from "pg";
import type { PoolClient } from "pg";
import { execSync } from "child_process";

const databaseUrl = process.env.DATABASE_URL;
let host = process.env.PGHOST;

if (host && host.includes(".") && !host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
  try {
    const dnsLines = execSync(`dig +short ${host}`, { encoding: "utf8" }).trim().split("\n");
    const ip = dnsLines.find(l => l.match(/^\d+\.\d+\.\d+\.\d+$/));
    if (ip) {
      console.log(`[db] Resolved host ${host} to IP ${ip} successfully`);
      host = ip;
    }
  } catch (dnsErr) {
    console.warn(`[db] dig DNS resolution failed, using raw host:`, dnsErr);
  }
}

const port = process.env.PGPORT ? Number(process.env.PGPORT) : undefined;
const user = process.env.PGUSER;
const password = process.env.PGPASSWORD;
const database = process.env.PGDATABASE;

const hasDiscretePgConfig = Boolean(host && user && password && database);
const hasConnectionString = Boolean(databaseUrl);
const canInitializePool = hasDiscretePgConfig || hasConnectionString;

if (!canInitializePool) {
  console.warn("[db] PostgreSQL configuration not found. Backend will run in fallback mode until DB credentials are provided.");
}

if (hasDiscretePgConfig && String(password).includes("REPLACE_WITH_")) {
  console.warn("[db] PGPASSWORD is still a placeholder. Backend will run in fallback mode until real DB password is set.");
}

if (!hasDiscretePgConfig && databaseUrl?.startsWith("prisma+postgres://")) {
  console.warn(
    "[db] DATABASE_URL uses prisma+postgres protocol. Provide Azure PG URL or PG* vars. Running in fallback mode.",
  );
}

const sslMode = (process.env.PGSSLMODE || "").toLowerCase();
const useSsl =
  sslMode === "require" ||
  sslMode === "verify-ca" ||
  sslMode === "verify-full" ||
  databaseUrl?.includes("sslmode=require") ||
  databaseUrl?.includes("sslmode=verify-full");

const sslConfig = useSsl
  ? {
      // Azure Database for PostgreSQL requires TLS.
      // Keep this false unless you provide and validate a CA cert.
      rejectUnauthorized: false,
    }
  : undefined;

type PoolLike = Pick<Pool, "query" | "connect">;

const disabledPool: PoolLike = {
  query: async () => {
    throw new Error("PostgreSQL is not configured. Set valid Azure credentials in backend/.env");
  },
  connect: async () => {
    throw new Error("PostgreSQL is not configured. Set valid Azure credentials in backend/.env");
  },
};

const pool: PoolLike =
  canInitializePool && !(hasDiscretePgConfig && String(password).includes("REPLACE_WITH_")) && !databaseUrl?.startsWith("prisma+postgres://")
    ? hasDiscretePgConfig
      ? new Pool({
          host,
          port: port ?? 5432,
          user,
          password,
          database,
          ssl: sslConfig,
          max: 8, // Reduced capacity to allow test runners to connect
          connectionTimeoutMillis: 10000, // 10s timeout to prevent hanging
          idleTimeoutMillis: 30000, // Close idle connections after 30s
        })
      : new Pool({
          connectionString: databaseUrl,
          ssl: sslConfig,
          max: 8,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
        })
    : disabledPool;

/**
 * Execute a database operation with Row-Level Security (RLS) enabled.
 *
 * Uses SET LOCAL (transaction-scoped) so the org context is automatically
 * cleared when the transaction ends — preventing context leaking to the
 * next request that reuses this pooled connection.
 *
 * @throws if orgId is falsy (defensive guard against missing tenant context)
 * @throws if SET LOCAL app.current_org_id fails (propagates, triggers ROLLBACK)
 */
export async function withRLS<T>(orgId: string, callback: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!orgId) {
    throw new Error("[RLS] Missing orgId — cannot apply RLS context without a valid organization ID");
  }

  const client = (await pool.connect()) as PoolClient;
  try {
    // 1. Open explicit transaction — required for SET LOCAL to be scoped correctly
    await client.query("BEGIN");

    // 2. Apply RLS tenant context (transaction-scoped, auto-cleared on COMMIT/ROLLBACK)
    //    Intentionally NOT caught here — if SET LOCAL fails, we want it to throw
    //    and trigger the ROLLBACK in the catch block below.
    await client.query(`SELECT set_config('app.current_org_id', $1, true)`, [orgId]);

    // 3. Execute the business logic using the same client
    const result = await callback(client);

    // 4. Commit only after successful execution
    await client.query("COMMIT");

    return result;
  } catch (err) {
    // 5. Rollback on ANY failure (SET LOCAL, callback, or commit)
    try {
      await client.query("ROLLBACK");
    } catch {
      // ROLLBACK failure is non-fatal — swallow to always reach finally
    }
    throw err;
  } finally {
    // 6. Always release the client back to the pool
    client.release();
  }
}

export default pool as Pool;
