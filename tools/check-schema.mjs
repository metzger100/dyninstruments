#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";

const root = process.cwd();
const ajv = new Ajv({ allErrors: true });
ajv.addSchema(readJson("schemas/avnav-plugin-base.schema.json"));
const pluginSchema = readJson("schemas/plugin.schema.json");
const layoutSchema = readJson("schemas/layout.schema.json");
/** @type {string[]} */
const failures = [];

validateFile(pluginSchema, "plugin.json");
fs.readdirSync(path.join(root, "layouts"))
  .filter(function (name) {
    return name.endsWith(".json");
  })
  .sort()
  .forEach(function (name) {
    validateFile(layoutSchema, path.join("layouts", name));
  });

if (failures.length > 0) {
  failures.forEach(function (failure) {
    console.error(failure);
  });
  process.exitCode = 1;
} else {
  console.log("Ajv schema validation passed.");
}

/** @param {string} relPath @returns {any} */
function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

/** @param {any} schema @param {string} relPath */
function validateFile(schema, relPath) {
  const valid = ajv.validate(schema, readJson(relPath));
  if (valid) return;

  const errors = ajv.errors || [];
  const details = ajv.errorsText(errors, { separator: "; " });
  failures.push(relPath + ": " + details);
}
