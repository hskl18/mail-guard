import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const landingPage = readFileSync("components/landing-page.tsx", "utf8");

test("landing page identifies Mail Guard as a software prototype", () => {
  assert.match(landingPage, /software prototype/i);
  assert.match(
    landingPage,
    /real deployment requires\s+validation with mailbox hardware/i,
  );
});

test("landing page does not publish unverified product claims", () => {
  const unsupportedClaims = [
    /99\.9% uptime/i,
    /6-12 month/i,
    /end-to-end/i,
    /mobile app/i,
    /no additional subscription fees/i,
    /free membership/i,
    /pre-installed sensors/i,
    /integration with property management systems/i,
  ];

  for (const claim of unsupportedClaims) {
    assert.doesNotMatch(landingPage, claim);
  }
});

test("landing page does not render placeholder footer links", () => {
  assert.doesNotMatch(landingPage, /href=["']#["']/);
});
