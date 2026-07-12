import assert from "node:assert/strict";
import test from "node:test";

import { createDeviceOwnershipScope } from "../lib/device-ownership.mjs";
import { createVerifiedSslConfig } from "../lib/database-tls.mjs";
import {
  generateInternalApiKey,
  verifyInternalApiKey,
} from "../lib/internal-api-key.mjs";

test("device ownership parameters come only from the authenticated session", () => {
  const attackerBody = { clerk_id: "attacker_user" };
  const scope = createDeviceOwnershipScope("device-7", "session_user");

  assert.deepEqual(scope, {
    whereClause: "id = ? AND clerk_id = ?",
    parameters: ["device-7", "session_user"],
  });
  assert.equal(scope.parameters.includes(attackerBody.clerk_id), false);
});

test("device ownership scope requires an authenticated session", () => {
  assert.equal(createDeviceOwnershipScope("device-7", null), null);
});

test("configured database CA always verifies the server certificate", () => {
  assert.deepEqual(createVerifiedSslConfig("trusted-ca"), {
    ca: "trusted-ca",
    rejectUnauthorized: true,
  });
});

test("internal API keys fail closed when the signing secret is missing", () => {
  assert.throws(
    () => generateInternalApiKey(undefined),
    /API_ENCRYPTION_SECRET is required/,
  );
  assert.equal(verifyInternalApiKey("int_arbitrary", undefined), false);
});

test("internal API key signatures round trip and reject tampering", () => {
  const secret = "offline-test-secret-with-sufficient-entropy";
  const apiKey = generateInternalApiKey(secret, 1_700_000_000_000);

  assert.equal(verifyInternalApiKey(apiKey, secret, 1_700_000_000_001), true);

  const encodedPayload = apiKey.slice(4);
  const payload = Buffer.from(encodedPayload, "base64").toString("utf8");
  const tamperedPayload = `${payload.slice(0, -1)}${payload.endsWith("0") ? "1" : "0"}`;
  const tamperedKey = `int_${Buffer.from(tamperedPayload).toString("base64")}`;

  assert.equal(
    verifyInternalApiKey(tamperedKey, secret, 1_700_000_000_001),
    false,
  );
});
