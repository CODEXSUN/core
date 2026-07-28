import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createConnection, type RowDataPacket } from "mysql2/promise";
import {
  bootstrapCoreDatabase,
  closeCoreDatabase,
  migrateCoreTenantDatabase,
  runWithCoreDatabase
} from "../database/core-database.js";
import { env } from "../env.js";
import { ColoursService } from "../modules/common/products/colours/colours.service.js";

const billingCoreContracts = [
  "companies",
  "financial_years",
  "contacts",
  "contacts_addresses",
  "work_orders",
  "ledgers",
  "currencies",
  "products",
  "hsn_codes",
  "colours",
  "sizes",
  "units",
  "taxes",
  "transports",
  "default_company_settings"
] as const;

export async function runCoreStackE2e() {
  const databaseName = `codexsun_core_stack_e2e_${Date.now()}`;
  let connection = await createConnection(connectionOptions());
  try {
    await connection.query(
      `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await bootstrapCoreDatabase(databaseName);
    await migrateCoreTenantDatabase(databaseName);
    await connection.end();
    connection = await createConnection({ ...connectionOptions(), database: databaseName });

    const [physical] = await connection.query<Array<RowDataPacket & { table_name: string }>>(
      `SELECT TABLE_NAME AS table_name
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' AND TABLE_NAME LIKE 'core\\_%'`
    );
    const physicalNames = new Set(physical.map(({ table_name }) => table_name));
    for (const contract of billingCoreContracts)
      assert.equal(physicalNames.has(`core_${contract}`), true);

    const [views] = await connection.query<Array<RowDataPacket & { table_name: string }>>(
      `SELECT TABLE_NAME AS table_name
       FROM information_schema.VIEWS
       WHERE TABLE_SCHEMA=DATABASE()`
    );
    const viewNames = new Set(views.map(({ table_name }) => table_name));
    for (const contract of billingCoreContracts) assert.equal(viewNames.has(contract), true);

    const [seedCounts] = await connection.query<Array<RowDataPacket & { count: number }>>(
      `SELECT
        (SELECT COUNT(*) FROM core_currencies) +
        (SELECT COUNT(*) FROM core_colours) +
        (SELECT COUNT(*) FROM core_sizes) +
        (SELECT COUNT(*) FROM core_units) +
        (SELECT COUNT(*) FROM core_taxes) AS count`
    );
    assert.equal(Number(seedCounts[0]?.count ?? 0) > 0, true);

    await runWithCoreDatabase(databaseName, async () => {
      const service = new ColoursService();
      const created = await service.create({
        isActive: true,
        name: "E2E Backward Compatible Colour",
        sortOrder: 999
      });
      assert.ok(created);
      assert.equal((await service.list({ search: "Backward Compatible" })).length, 1);
      assert.equal((await service.get(String(created.id)))?.name, created.name);
      assert.equal(
        (await service.update(String(created.id), { name: "E2E Updated Colour" }))?.name,
        "E2E Updated Colour"
      );
      assert.equal((await service.setActive(String(created.id), false))?.isActive, false);
      assert.equal((await service.setActive(String(created.id), true))?.isActive, true);
      assert.equal((await service.forceDelete(String(created.id)))?.id, created.id);
      assert.equal(await service.get(String(created.id)), null);
    });
  } finally {
    await closeCoreDatabase();
    await connection.end();
    const cleanup = await createConnection({
      ...connectionOptions(),
      database: env.DB_MASTER_NAME
    });
    await cleanup.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await cleanup.end();
  }
}

function connectionOptions() {
  return {
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCoreStackE2e()
    .then(() => console.log("Core stack migration, seed, compatibility, and CRUD E2E passed."))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
