import assert from "node:assert/strict";
import test from "node:test";

import { isCommitteeReviewer } from "../lib/committee-authorization.mjs";

test("committee access fails closed without an operator allowlist", () => {
  assert.equal(isCommitteeReviewer("user_1", undefined), false);
  assert.equal(isCommitteeReviewer(undefined, "user_1"), false);
});

test("committee access accepts only an exact allowlisted Clerk user ID", () => {
  const reviewers = "user_1, user_2";

  assert.equal(isCommitteeReviewer("user_2", reviewers), true);
  assert.equal(isCommitteeReviewer("user_20", reviewers), false);
});
