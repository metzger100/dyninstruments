#!/usr/bin/env node

/**
 * @file check-doc-links - Linkinator scan over every Prettier-owned Markdown file
 * Documentation: documentation/conventions/quality-gates.md
 */

import fs from "node:fs";
import path from "node:path";
import { check } from "linkinator";
import { runDocumentationLinkPolicy } from "./portable-core/doc-link-engine.mjs";

/**
 * @param {string} root
 * @returns {string[]}
 */
export function discoverSeedMarkdownFiles(root) {
  const scopePath = path.join(root, "tools", "quality-policy", "format-scope.json");
  const scope = JSON.parse(fs.readFileSync(scopePath, "utf8"));
  return scope.rows
    .filter((/** @type {{owner: string, path: string}} */ row) => row.owner === "prettier" && row.path.endsWith(".md"))
    .map((/** @type {{path: string}} */ row) => row.path)
    .sort();
}

/**
 * @param {{root?: string, print?: boolean}} [options]
 * @returns {Promise<{ok: boolean, seeds: string[], links: number, broken: {url: string, parent?: string}[]}>}
 */
export async function runDocLinksCheck(options = {}) {
  const root = options.root || process.cwd();
  const print = options.print !== false;
  const seeds = discoverSeedMarkdownFiles(root);
  // linkinator.config.json is a fixed project config, not part of the (possibly fake) scan
  // root under test, so it is always read from the real repository root.
  const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "linkinator.config.json"), "utf8"));

  const result = await check({
    ...config,
    path: seeds,
    serverRoot: root
  });

  const broken = result.links
    .filter((link) => link.state === "BROKEN")
    .map((link) => ({ url: link.url, parent: link.parent }));
  const policy = runDocumentationLinkPolicy({ broken: broken.map((link) => `${link.parent || "seed"}: ${link.url}`) });
  const ok = policy.ok;

  if (print) {
    if (ok) {
      console.log(
        `Documentation links passed: ${seeds.length} seeded file(s), ${result.links.length} link(s) checked.`
      );
    } else {
      console.error("Documentation link check failed:\n");
      for (const link of broken) {
        console.error(`- ${link.url} (linked from ${link.parent || "a seed file"})`);
      }
    }
  }

  return { ok, seeds, links: result.links.length, broken };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDocLinksCheck().then((result) => {
    process.exitCode = result.ok ? 0 : 1;
  });
}
