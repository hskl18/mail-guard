import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { initialSchemaMigration } from "./migrations/001-initial-schema.mjs";


test("database initialization is not exposed as an HTTP route", () => {
  assert.equal(existsSync("app/api/init-db/route.ts"), false);
});

test("schema migration is ordered and idempotent", () => {
  assert.ok(initialSchemaMigration.statements.length > 1);
  assert.ok(
    initialSchemaMigration.statements.every((statement) =>
      /CREATE TABLE IF NOT EXISTS/.test(statement),
    ),
  );

  const deviceSerialsIndex = initialSchemaMigration.statements.findIndex(
    (statement) => statement.includes("device_serials"),
  );
  const apiKeysIndex = initialSchemaMigration.statements.findIndex(
    (statement) => statement.includes("api_keys"),
  );
  assert.ok(deviceSerialsIndex < apiKeysIndex);
});

test("initial schema supports every device status field written by routes", () => {
  const iotDeviceStatus = initialSchemaMigration.statements.find((statement) =>
    statement.includes("CREATE TABLE IF NOT EXISTS iot_device_status"),
  );
  const devices = initialSchemaMigration.statements.find((statement) =>
    statement.includes("CREATE TABLE IF NOT EXISTS devices"),
  );

  assert.ok(iotDeviceStatus);
  assert.ok(devices);

  for (const column of [
    "firmware_version",
    "battery_level",
    "signal_strength",
    "temperature_celsius",
  ]) {
    assert.match(iotDeviceStatus, new RegExp(`\\b${column}\\b`));
  }

  for (const column of [
    "firmware_version",
    "battery_level",
    "signal_strength",
  ]) {
    assert.match(devices, new RegExp(`\\b${column}\\b`));
  }
});

test("IoT device status has one row per serial number", () => {
  const iotDeviceStatus = initialSchemaMigration.statements.find((statement) =>
    statement.includes("CREATE TABLE IF NOT EXISTS iot_device_status"),
  );

  assert.ok(iotDeviceStatus);
  assert.match(iotDeviceStatus, /UNIQUE(?: KEY \w+)?\s*\(serial_number\)/i);
});

test("migration defaults to a secret-free dry run", () => {
  const result = spawnSync(process.execPath, ["scripts/migrate-db.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { PATH: process.env.PATH },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Dry run only/);
  assert.doesNotMatch(result.stdout + result.stderr, /Connecting to|password/i);
});

test("pnpm argument separator is accepted", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/migrate-db.mjs", "--", "--dry-run"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    },
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Dry run only/);
});

test("apply requires explicit confirmation before reading database config", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/migrate-db.mjs", "--apply"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_MIGRATION_CONFIRM=apply/);
  assert.doesNotMatch(result.stderr, /MYSQL_PASSWORD/);
});

test("apply requires an explicit target after loading database config", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/migrate-db.mjs", "--apply"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        DATABASE_MIGRATION_CONFIRM: "apply",
        MYSQL_HOST: "database.example.com",
        MYSQL_PORT: "3306",
        MYSQL_USER: "operator",
        MYSQL_PASSWORD: "secret",
        MYSQL_DATABASE: "mailguard",
      },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /DATABASE_MIGRATION_TARGET=database\.example\.com\/mailguard/,
  );
});
