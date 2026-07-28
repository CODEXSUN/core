import { AsyncLocalStorage } from "node:async_hooks";
import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { seedCoreTenantPermissions } from "../auth/tenant-permission.seed.js";
import { env } from "../env.js";
import { commonMigrationSteps } from "../modules/common/common.migration.js";
import { seedCommonModule } from "../modules/common/common.seed.js";
import { removeUnknownCountrySeed } from "../modules/common/location/country/index.js";
import { seedMasterModule } from "../modules/master/index.js";
import { masterMigrationSteps } from "../modules/master/master.migration.js";
import { seedOrganisationModule } from "../modules/organisation/index.js";
import { organisationMigrationSteps } from "../modules/organisation/organisation.migration.js";

export type CoreDatabase = Record<string, unknown>;

type CoreDatabaseContext = {
  database?: Kysely<CoreDatabase>;
  databaseName: string;
};

const context = new AsyncLocalStorage<CoreDatabaseContext>();
type CoreConnectionEntry = { database: Kysely<CoreDatabase>; lastUsedAt: number };

const connections = new Map<string, CoreConnectionEntry>();
const migrated = new Set<string>();
const bootstrapping = new Map<string, Promise<void>>();
const connectionIdleMs = 10 * 60 * 1000;
const evictionTimer = setInterval(() => void evictIdleCoreDatabases(), 60_000);
evictionTimer.unref();

export const coreTenantMigrations = [
  {
    description: "Flatten legacy Core table names before module-owned migrations.",
    name: "003_flatten_core_table_names"
  },
  ...commonMigrationSteps.map(({ description, key }) => ({ description, name: key })),
  ...organisationMigrationSteps.map(({ description, key }) => ({ description, name: key })),
  ...masterMigrationSteps.map(({ description, key }) => ({ description, name: key })),
  {
    description: "Prefix every Core-owned physical table while preserving legacy query aliases.",
    name: "004_prefix_core_table_names"
  }
] as const;

export function resolveCoreDatabaseName(value: unknown, allowMasterDatabase = false) {
  const requested = typeof value === "string" ? value.trim() : "";
  if (!requested) throw new Error("x-tenant-db is required for Core database access.");
  if (!/^[a-zA-Z0-9_]+$/.test(requested)) throw new Error("Invalid tenant database name.");
  if (!allowMasterDatabase && requested === env.DB_MASTER_NAME)
    throw new Error("Core tables cannot use the Platform master database.");
  return requested;
}

export function runWithCoreDatabase<T>(
  databaseName: string,
  callback: () => T,
  database?: Kysely<CoreDatabase>
) {
  return context.run(
    {
      ...(database ? { database } : {}),
      databaseName: resolveCoreDatabaseName(databaseName, database !== undefined)
    },
    callback
  );
}

export function getCoreDatabase(databaseName = context.getStore()?.databaseName) {
  const activeContext = context.getStore();
  const name = resolveCoreDatabaseName(
    databaseName,
    activeContext?.database !== undefined && activeContext.databaseName === databaseName
  );
  if (activeContext?.database && activeContext.databaseName === name) {
    return activeContext.database;
  }
  const existing = connections.get(name);
  if (existing) {
    existing.lastUsedAt = Date.now();
    return existing.database;
  }
  const database = new Kysely<CoreDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: name,
        host: env.DB_HOST,
        password: env.DB_PASSWORD,
        port: env.DB_PORT,
        connectionLimit: 4,
        idleTimeout: connectionIdleMs + 60_000,
        maxIdle: 1,
        queueLimit: 100,
        timezone: "Z",
        user: env.DB_USER
      } satisfies PoolOptions)
    })
  });
  connections.set(name, { database, lastUsedAt: Date.now() });
  return database;
}

export async function bootstrapCoreDatabase(databaseName: string, database?: Kysely<CoreDatabase>) {
  const name = resolveCoreDatabaseName(databaseName, database !== undefined);
  if (migrated.has(name)) return;
  const active = bootstrapping.get(name);
  if (active) return active;
  const promise = runWithCoreDatabase(
    name,
    async () => {
      if (!database) await ensureDatabase(name);
      const activeDatabase = database ?? getCoreDatabase(name);
      await migrateCoreModules(activeDatabase);
      await seedCoreModules(activeDatabase);
      migrated.add(name);
    },
    database
  );
  bootstrapping.set(name, promise);
  try {
    await promise;
  } finally {
    bootstrapping.delete(name);
  }
}

export async function migrateCoreTenantDatabase(databaseName: string) {
  const name = resolveCoreDatabaseName(databaseName);
  const active = bootstrapping.get(name);
  if (active) await active.catch(() => undefined);
  await closeCoreDatabaseConnection(name);
  migrated.delete(name);
  await runWithCoreDatabase(name, async () => {
    await ensureDatabase(name);
    await migrateCoreModules(getCoreDatabase(name));
  });
}

export async function seedCoreTenantDatabase(databaseName: string) {
  const name = resolveCoreDatabaseName(databaseName);
  await runWithCoreDatabase(name, async () => {
    await ensureDatabase(name);
    const database = getCoreDatabase(name);
    await migrateCoreModules(database);
    await seedCoreModules(database);
    migrated.add(name);
  });
}

async function recordCoreMigration(database: Kysely<CoreDatabase>, name: string) {
  await sql`
    INSERT IGNORE INTO schema_migrations (package_id, name)
    VALUES ('@codexsun/core', ${name})
  `.execute(database);
}

async function hasCoreMigration(database: Kysely<CoreDatabase>, name: string) {
  const result = await sql<{ migration_count: number | string }>`
    SELECT COUNT(*) AS migration_count
    FROM schema_migrations
    WHERE package_id = '@codexsun/core' AND name = ${name}
  `.execute(database);
  return Number(result.rows[0]?.migration_count ?? 0) > 0;
}

async function runPendingCoreMigrationSteps(
  database: Kysely<CoreDatabase>,
  steps: readonly {
    key: string;
    migrate: (database: Kysely<CoreDatabase>) => Promise<unknown>;
  }[]
) {
  for (const step of steps) {
    if (await hasCoreMigration(database, step.key)) continue;
    await step.migrate(database);
    await recordCoreMigration(database, step.key);
  }
}

async function migrateCoreModules(database: Kysely<CoreDatabase>) {
  await flattenLegacyCoreTableNames(database);
  await runPendingCoreMigrationSteps(database, commonMigrationSteps);
  await runPendingCoreMigrationSteps(database, organisationMigrationSteps);
  await runPendingCoreMigrationSteps(database, masterMigrationSteps);
  if (!(await hasCoreMigration(database, "004_prefix_core_table_names"))) {
    await prefixCoreTableNames(database);
    await recordCoreMigration(database, "004_prefix_core_table_names");
  }
}

async function seedCoreModules(database: Kysely<CoreDatabase>) {
  // Seed dependency order mirrors the schema dependency order: shared lookup
  // records first, tenant organisation defaults second, transactional masters last.
  await seedCommonModule();
  await seedOrganisationModule();
  await seedMasterModule();
  await removeUnknownCountrySeed();
  await seedCoreTenantPermissions(database as unknown as Kysely<unknown>);
}

async function flattenLegacyCoreTableNames(database: Kysely<CoreDatabase>) {
  await sql
    .raw(
      "CREATE TABLE IF NOT EXISTS schema_migrations (" +
        "id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, package_id VARCHAR(160) NOT NULL DEFAULT 'legacy', " +
        "name VARCHAR(160) NOT NULL UNIQUE, " +
        "applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    )
    .execute(database);
  const result = await sql<{ table_name: string }>`
    SELECT TABLE_NAME AS table_name
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND (TABLE_NAME LIKE 'core\_common\_%' OR TABLE_NAME LIKE 'core\_master\_%')
    ORDER BY TABLE_NAME
  `.execute(database);

  for (const { table_name: legacyName } of result.rows) {
    const currentName = legacyName
      .replace(/^core_common_/, "core_")
      .replace(/^core_master_/, "core_");
    const existing = await sql<{ table_count: number | string }>`
      SELECT COUNT(*) AS table_count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${currentName}
    `.execute(database);
    if (Number(existing.rows[0]?.table_count ?? 0) > 0) {
      throw new Error(`Cannot flatten Core table ${legacyName}: ${currentName} already exists.`);
    }
    await sql.raw(`RENAME TABLE \`${legacyName}\` TO \`${currentName}\``).execute(database);
  }

  await ensureCoreMigrationJournal(database);
  await recordCoreMigration(database, "003_flatten_core_table_names");
}

async function ensureCoreMigrationJournal(database: Kysely<CoreDatabase>) {
  await sql`
    ALTER TABLE schema_migrations
    ADD COLUMN IF NOT EXISTS package_id VARCHAR(160) NOT NULL DEFAULT 'legacy' AFTER id
  `.execute(database);
  const legacyJournal = await tableType(database, "core_schema_migrations");
  if (legacyJournal === "BASE TABLE") {
    await sql`
      INSERT IGNORE INTO schema_migrations (package_id, name, applied_at)
      SELECT '@codexsun/core', name, applied_at
      FROM core_schema_migrations
    `.execute(database);
    await sql`DROP TABLE core_schema_migrations`.execute(database);
  }
  await sql`
    UPDATE schema_migrations
    SET package_id = '@codexsun/core'
    WHERE package_id = 'legacy'
      AND (
        name LIKE 'core.%'
        OR name IN ('003_flatten_core_table_names', '004_prefix_core_table_names')
      )
  `.execute(database);
}

const coreOwnedTables = [
  "address_types",
  "bank_names",
  "brands",
  "cities",
  "colours",
  "companies",
  "companies_addresses",
  "companies_bank_accounts",
  "companies_emails",
  "companies_phones",
  "companies_social_links",
  "contact_groups",
  "contact_types",
  "contacts",
  "contacts_addresses",
  "contacts_bank_accounts",
  "contacts_emails",
  "contacts_phones",
  "contacts_social_links",
  "countries",
  "currencies",
  "default_company_settings",
  "destinations",
  "districts",
  "financial_years",
  "hsn_codes",
  "ledger_groups",
  "ledgers",
  "months",
  "payment_terms",
  "pincodes",
  "priorities",
  "product_categories",
  "product_groups",
  "product_types",
  "products",
  "sales_types",
  "sizes",
  "states",
  "stock_rejection_types",
  "styles",
  "taxes",
  "transports",
  "units",
  "warehouses",
  "work_order_types",
  "work_orders"
] as const;

async function prefixCoreTableNames(database: Kysely<CoreDatabase>) {
  for (const legacyName of coreOwnedTables) {
    const prefixedName = `core_${legacyName}`;
    const legacyType = await tableType(database, legacyName);
    const prefixedType = await tableType(database, prefixedName);

    if (legacyType === "BASE TABLE" && prefixedType) {
      throw new Error(
        `Cannot prefix Core table ${legacyName}: ${prefixedName} already exists as ${prefixedType}.`
      );
    }
    if (legacyType === "BASE TABLE") {
      await sql.raw(`RENAME TABLE \`${legacyName}\` TO \`${prefixedName}\``).execute(database);
    }
    if ((await tableType(database, prefixedName)) === "BASE TABLE") {
      await sql
        .raw(
          `CREATE OR REPLACE ALGORITHM=MERGE VIEW \`${legacyName}\` AS ` +
            `SELECT * FROM \`${prefixedName}\``
        )
        .execute(database);
    }
  }
}

async function tableType(database: Kysely<CoreDatabase>, tableName: string) {
  const result = await sql<{ table_type: string }>`
    SELECT TABLE_TYPE AS table_type
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${tableName}
  `.execute(database);
  return result.rows[0]?.table_type;
}

export async function bootstrapRegisteredCoreDatabases() {
  const databaseNames = await registeredTenantDatabaseNames();
  await Promise.all(databaseNames.map((databaseName) => bootstrapCoreDatabase(databaseName)));
}

export async function closeCoreDatabase() {
  const open = Array.from(connections.values(), (entry) => entry.database);
  connections.clear();
  migrated.clear();
  await Promise.all(open.map((database) => database.destroy()));
}

async function closeCoreDatabaseConnection(name: string) {
  const entry = connections.get(name);
  if (!entry) return;
  connections.delete(name);
  await entry.database.destroy();
}

export async function evictIdleCoreDatabases(now = Date.now()) {
  const idle = Array.from(connections.entries()).filter(
    ([name, entry]) => now - entry.lastUsedAt >= connectionIdleMs && !bootstrapping.has(name)
  );
  for (const [name, entry] of idle) {
    if (connections.get(name) !== entry) continue;
    connections.delete(name);
    await entry.database.destroy();
  }
  return idle.length;
}

async function ensureDatabase(databaseName: string) {
  const connection = await createConnection({
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    timezone: "Z",
    user: env.DB_USER
  });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function registeredTenantDatabaseNames() {
  const connection = await createConnection({
    database: env.DB_MASTER_NAME,
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    timezone: "Z",
    user: env.DB_USER
  });
  try {
    const [rows] = await connection.query(
      "SELECT db_name FROM tenants WHERE db_name IS NOT NULL AND status <> 'deleted'"
    );
    return (rows as Array<{ db_name: string }>).map(({ db_name }) =>
      resolveCoreDatabaseName(db_name)
    );
  } finally {
    await connection.end();
  }
}
