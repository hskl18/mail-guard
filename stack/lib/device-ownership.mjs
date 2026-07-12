/**
 * Build the only database scope allowed for user-owned device routes.
 * The caller must pass the Clerk user ID from the verified server session.
 *
 * @param {string} deviceId
 * @param {string | null | undefined} sessionUserId
 */
export function createDeviceOwnershipScope(deviceId, sessionUserId) {
  if (!sessionUserId) return null;

  return {
    whereClause: "id = ? AND clerk_id = ?",
    parameters: [deviceId, sessionUserId],
  };
}
