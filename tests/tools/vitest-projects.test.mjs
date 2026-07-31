/**
 * Contract tests for vitest.config.js's project coverage.
 *
 * The whole reason the config partitions test files into named projects is that a new test
 * file must never be silently excluded from every gate. These assert that every real test file
 * under tests/ is matched by exactly one configured project, so a future pattern edit that
 * mis-partitions the suite fails loudly instead of quietly dropping coverage.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

import vitestConfig from "../../vitest.config.js";

const ROOT = process.cwd();
const FIXTURE_ROOT = "tests/tools/lint-fixtures/";

/**
 * Supports `*` (within one path segment) and `**` (across segments), the only two glob tokens
 * this repository's vitest.config.js patterns use.
 * @param {string} pattern
 * @returns {RegExp}
 */
function globToRegExp(pattern) {
  const directoryGlob = "__GLOBSTAR_DIRECTORY__";
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\/\*\*\//g, directoryGlob)
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(directoryGlob, "/(?:.*/)?");
  return new RegExp(`^${escaped}$`);
}

/**
 * @param {string} file
 * @param {string[]} patterns
 * @returns {boolean}
 */
function matchesAny(file, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(file));
}

/** @typedef {{name: string, include: string[], exclude: string[]}} ProjectPatterns */

/** @returns {ProjectPatterns[]} */
function projectPatterns() {
  const projects = vitestConfig.test?.projects || [];
  return projects.map((project) => {
    const config = project.test;
    return { name: config.name, include: config.include || [], exclude: config.exclude || [] };
  });
}

/**
 * @param {string} file
 * @returns {string[]}
 */
function owningProjects(file) {
  return projectPatterns()
    .filter((project) => matchesAny(file, project.include) && !matchesAny(file, project.exclude))
    .map((project) => project.name);
}

/** @returns {string[]} */
function trackedTestFiles() {
  /** @type {string[]} */
  const files = [];

  /** @param {string} directory */
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile() && /\.test\.(js|mjs)$/.test(entry.name)) {
        files.push(path.relative(ROOT, absolutePath).replaceAll(path.sep, "/"));
      }
    }
  }

  visit(path.join(ROOT, "tests"));
  return files.filter((file) => !file.startsWith(FIXTURE_ROOT)).sort();
}

test("at least one project is configured", () => {
  const projects = projectPatterns();
  assert.ok(projects.length > 0, "vitest.config.js must configure projects");
  for (const project of projects) {
    assert.ok(project.name, "every project needs a name");
    assert.ok(project.include.length > 0, `project ${project.name} needs include patterns`);
  }
});

test("every tracked test file is claimed by exactly one project", () => {
  const files = trackedTestFiles();
  assert.ok(files.length > 0, "expected to discover test files");
  for (const file of files) {
    const owners = owningProjects(file);
    assert.equal(owners.length, 1, `${file} is claimed by ${owners.length} projects (${owners.join(", ") || "none"})`);
  }
});

test("representative files land in their expected project", () => {
  assert.deepEqual(owningProjects("tests/tools/check-file-size.test.js"), ["unit-node"]);
  assert.deepEqual(owningProjects("tests/contract/documentation-format-contract.test.js"), ["contract"]);
  assert.deepEqual(owningProjects("tests/widgets/radial/SpeedRadialWidget.test.js"), ["unit-dom"]);
});

test("a test file outside tests/ would be detected as unclaimed", () => {
  assert.deepEqual(owningProjects("other/stray.test.js"), [], "a file outside tests/ matches no project");
});
