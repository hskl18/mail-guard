import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

import dotenv from "dotenv";

import { initialSchemaMigration } from "./migrations/001-initial-schema.mjs";

const operatorConfirmation = process.env.DATABASE_MIGRATION_CONFIRM;
const operatorTarget = process.env.DATABASE_MIGRATION_TARGET;

dotenv.config({ path: ".env.local" });
dotenv.config();

const migrations = [initialSchemaMigration];
const apply = process.argv.includes("--apply");
const unknownArguments = process.argv.slice(2).filter((argument) =>
  !["--", "--apply", "--dry-run"].includes(argument),
);

if (unknownArguments.length > 0 || (apply && process.argv.includes("--dry-run"))) {
  console.error("Usage: node scripts/migrate-db.mjs [--dry-run | --apply]");
  process.exit(1);
}

if (!apply) {
  console.log("Dry run only. No database connection will be opened.");
  for (const migration of migrations) {
    console.log(
      `${migration.version}: ${migration.statements.length} idempotent schema statements`,
    );
  }
  process.exit(0);
}

if (operatorConfirmation !== "apply") {
  console.error("Set DATABASE_MIGRATION_CONFIRM=apply to execute migrations.");
  process.exit(1);
}

const requiredDatabaseVariables = [
  "MYSQL_HOST",
  "MYSQL_PORT",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
];
const missingVariables = requiredDatabaseVariables.filter(
  (name) => !process.env[name],
);

if (missingVariables.length > 0) {
  console.error(
    `Missing database configuration: ${missingVariables.join(", ")}`,
  );
  process.exit(1);
}

const expectedTarget = `${process.env.MYSQL_HOST}/${process.env.MYSQL_DATABASE}`;
if (operatorTarget !== expectedTarget) {
  console.error(
    `Set DATABASE_MIGRATION_TARGET=${expectedTarget} in the operator shell to confirm the target.`,
  );
  process.exit(1);
}

const mysql = await import("mysql2/promise");
const ssl = process.env.MYSQL_SSL_CA
  ? {
      ca: readFileSync(process.env.MYSQL_SSL_CA, "utf8"),
      rejectUnauthorized: true,
    }
  : undefined;
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: false,
  ssl,
});

try {
  const [[lockResult]] = await connection.query(
    "SELECT GET_LOCK(?, 30) AS acquired",
    ["mailguard_schema_migrations"],
  );
  if (lockResult.acquired !== 1) {
    throw new Error("Could not acquire the database migration lock.");
  }

  for (const migration of migrations) {
    const [migrationTableStatement, ...schemaStatements] = migration.statements;
    await connection.execute(migrationTableStatement);

    const checksum = createHash("sha256")
      .update(schemaStatements.join("\n"))
      .digest("hex");

    const [appliedRows] = await connection.execute(
      "SELECT version, checksum FROM schema_migrations WHERE version = ?",
      [migration.version],
    );

    if (Array.isArray(appliedRows) && appliedRows.length > 0) {
      if (appliedRows[0].checksum !== checksum) {
        throw new Error(
          `${migration.version}: checksum mismatch; applied migrations are immutable.`,
        );
      }
      console.log(`${migration.version}: already applied`);
      continue;
    }

    const managedTables = schemaStatements
      .map((statement) => statement.match(/CREATE TABLE IF NOT EXISTS ([a-z_]+)/i)?.[1])
      .filter(Boolean);
    const placeholders = managedTables.map(() => "?").join(",");
    const [existingTables] = await connection.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN (${placeholders})`,
      [process.env.MYSQL_DATABASE, ...managedTables],
    );
    if (Array.isArray(existingTables) && existingTables.length > 0) {
      throw new Error(
        `${migration.version}: unmanaged existing schema detected; migrate it explicitly instead of marking it current.`,
      );
    }

    for (const statement of schemaStatements) {
      await connection.execute(statement);
    }

    await connection.execute(
      "INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)",
      [migration.version, checksum],
    );
    console.log(`${migration.version}: applied`);
  }
} finally {
  await connection.query("SELECT RELEASE_LOCK(?)", [
    "mailguard_schema_migrations",
  ]).catch(() => undefined);
  await connection.end();
}
