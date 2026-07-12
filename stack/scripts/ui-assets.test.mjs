import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("local Next Image sources use root-relative public paths", () => {
  const landingPage = readFileSync("components/landing-page.tsx", "utf8");
  const deliveryHub = readFileSync("app/delivery-hub/page.tsx", "utf8");

  assert.match(landingPage, /src="\/mailbox\.png"/);
  assert.match(deliveryHub, /src="\/case\.png"/);
});
