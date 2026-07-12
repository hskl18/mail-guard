/**
 * Committee access is an operator-managed allowlist, never a client claim.
 *
 * @param {string | null | undefined} userId
 * @param {string | null | undefined} configuredReviewerIds
 */
export function isCommitteeReviewer(userId, configuredReviewerIds) {
  if (!userId || !configuredReviewerIds) return false;

  return configuredReviewerIds
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .includes(userId);
}
