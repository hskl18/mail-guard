/**
 * @param {string} ca
 */
export function createVerifiedSslConfig(ca) {
  return {
    ca,
    rejectUnauthorized: true,
  };
}
