import crypto from "node:crypto";

const INTERNAL_API_KEY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function requireSigningSecret(secret) {
  if (!secret) {
    throw new Error("API_ENCRYPTION_SECRET is required for internal API keys");
  }

  return secret;
}

export function generateInternalApiKey(secret, now = Date.now()) {
  const signingSecret = requireSigningSecret(secret);
  const timestamp = now.toString();
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const payload = `${timestamp}:${randomBytes}`;
  const signature = crypto
    .createHmac("sha256", signingSecret)
    .update(payload)
    .digest("hex");

  return `int_${Buffer.from(`${payload}:${signature}`).toString("base64")}`;
}

export function verifyInternalApiKey(apiKey, secret, now = Date.now()) {
  if (!secret || !apiKey.startsWith("int_")) {
    return false;
  }

  try {
    const payload = Buffer.from(apiKey.substring(4), "base64").toString();
    const [timestamp, randomBytes, signature, ...extraParts] = payload.split(":");

    if (!timestamp || !randomBytes || !signature || extraParts.length > 0) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}:${randomBytes}`)
      .digest();
    const providedSignature = Buffer.from(signature, "hex");

    if (
      providedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(providedSignature, expectedSignature)
    ) {
      return false;
    }

    const issuedAt = Number(timestamp);
    const keyAge = now - issuedAt;

    return Number.isSafeInteger(issuedAt) && keyAge >= 0 && keyAge < INTERNAL_API_KEY_MAX_AGE_MS;
  } catch {
    return false;
  }
}
