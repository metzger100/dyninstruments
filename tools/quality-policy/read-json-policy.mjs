import fs from "node:fs";
import { parseTree, printParseErrorCode } from "jsonc-parser";

/** @param {string} filePath @returns {any} */
export function readJsonPolicy(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  /** @type {import("jsonc-parser").ParseError[]} */
  const parseErrors = [];
  const tree = parseTree(source, parseErrors, { allowTrailingComma: false, disallowComments: true });
  if (!tree || parseErrors.length > 0) {
    const details = parseErrors
      .map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(", ");
    throw new Error(`Invalid JSON policy '${filePath}': ${details || "empty document"}.`);
  }

  /** @type {string[]} */
  const duplicateKeys = [];
  collectDuplicateKeys(tree, [], duplicateKeys);
  if (duplicateKeys.length > 0) {
    throw new Error(`Duplicate JSON object key(s) in '${filePath}': ${duplicateKeys.join(", ")}.`);
  }

  return JSON.parse(source);
}

/** @param {string} configPath @param {string[]} files @param {any} fallbackConfig */
export function writeFilesArray(configPath, files, fallbackConfig) {
  const source = fs.readFileSync(configPath, "utf8");
  const replacement = `  "files": [\n${files.map((file) => `    ${JSON.stringify(file)}`).join(",\n")}\n  ]`;
  const pattern = /[\u0020]{2}"files": \[[\s\S]*?\n[\u0020]{2}\]/;
  const next = source.replace(pattern, replacement);
  fs.writeFileSync(
    configPath,
    pattern.test(source) ? `${next.trimEnd()}\n` : `${JSON.stringify(fallbackConfig, null, 2)}\n`,
    "utf8"
  );
}

/** @param {import("jsonc-parser").Node} node @param {string[]} parentPath @param {string[]} out */
function collectDuplicateKeys(node, parentPath, out) {
  if (node.type === "object") {
    /** @type {Set<string>} */
    const seen = new Set();
    for (const property of node.children || []) {
      const keyNode = property.children?.[0];
      const valueNode = property.children?.[1];
      const key = /** @type {string} */ (keyNode?.value);
      if (seen.has(key)) out.push([...parentPath, key].join("."));
      seen.add(key);
      if (valueNode) collectDuplicateKeys(valueNode, [...parentPath, key], out);
    }
    return;
  }

  if (node.type === "array") {
    for (const [index, child] of (node.children || []).entries()) {
      collectDuplicateKeys(child, [...parentPath, String(index)], out);
    }
  }
}
