#!/usr/bin/env node

/**
 * @file check-schema - Ajv validation over the local schema profile and quality profile
 * Documentation: documentation/conventions/quality-gates.md
 */

import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { readVersionedProfile } from "./quality-policy/profile-schema.mjs";

/**
 * @param {string} root
 * @param {string} relPath
 * @returns {any}
 */
function readJson(root, relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

/**
 * @param {string} root
 * @returns {string[]}
 */
function collectLayoutFiles(root) {
  return fs
    .readdirSync(path.join(root, "layouts"))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join("layouts", name));
}

/**
 * @param {import("ajv").default} ajv
 * @param {any} schema
 * @param {string} root
 * @param {string} relPath
 * @returns {string | null}
 */
function validateFile(ajv, schema, root, relPath) {
  const valid = ajv.validate(schema, readJson(root, relPath));
  if (valid) return null;
  const errors = ajv.errors || [];
  return `${relPath}: ${ajv.errorsText(errors, { separator: "; " })}`;
}

/**
 * @param {{root?: string, print?: boolean}} [options]
 * @returns {{ok: boolean, failures: string[]}}
 */
export function runSchemaCheck(options = {}) {
  const root = options.root || process.cwd();
  const print = options.print !== false;

  const ajv = new Ajv({ allErrors: true });
  const profile = readVersionedProfile(path.join(root, "tools/quality-policy/project-schema-profile.json"), [
    "baseSchema",
    "pluginSchema",
    "layoutSchema"
  ]);
  ajv.addSchema(readJson(root, profile.baseSchema));
  const pluginSchema = readJson(root, profile.pluginSchema);
  const layoutSchema = readJson(root, profile.layoutSchema);
  const qualityProfileSchema = readJson(root, "schemas/portable-profile.schema.json");

  /** @type {string[]} */
  const failures = [];
  const pluginFailure = validateFile(ajv, pluginSchema, root, "plugin.json");
  if (pluginFailure) failures.push(pluginFailure);
  for (const relPath of collectLayoutFiles(root)) {
    const failure = validateFile(ajv, layoutSchema, root, relPath);
    if (failure) failures.push(failure);
  }
  const qualityProfileFailure = validateFile(
    ajv,
    qualityProfileSchema,
    root,
    "tools/quality-policy/project-profile.json"
  );
  if (qualityProfileFailure) failures.push(qualityProfileFailure);

  if (print) {
    if (failures.length > 0) {
      for (const failure of failures) console.error(failure);
    } else {
      console.log("Ajv schema validation passed.");
    }
  }
  return { ok: failures.length === 0, failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runSchemaCheck();
  process.exitCode = result.ok ? 0 : 1;
}
