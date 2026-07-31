import { readJsonPolicy } from "./read-json-policy.mjs";

/** @typedef {Record<string, unknown> & {schemaVersion: number}} VersionedProfile */

/**
 * Read a local profile through the portable profile envelope.
 * @param {string} filePath
 * @param {string[]} allowedKeys
 * @returns {any}
 */
export function readVersionedProfile(filePath, allowedKeys) {
  const profile = readJsonPolicy(filePath);
  if (!profile || typeof profile !== "object" || Array.isArray(profile) || profile.schemaVersion !== 1) {
    throw new Error(`Invalid profile '${filePath}': schemaVersion 1 is required.`);
  }
  const allowed = new Set(["schemaVersion", ...allowedKeys]);
  const unknown = Object.keys(profile).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new Error(`Invalid profile '${filePath}': unknown field(s): ${unknown.join(", ")}.`);
  }
  return /** @type {VersionedProfile} */ (profile);
}
