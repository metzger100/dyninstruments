import fs from "node:fs";
import { parseTree, printParseErrorCode } from "jsonc-parser";

export function readJsonPolicy(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const parseErrors = [];
  const tree = parseTree(source, parseErrors, { allowTrailingComma: false, disallowComments: true });
  if (!tree || parseErrors.length > 0) {
    const details = parseErrors
      .map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(", ");
    throw new Error(`Invalid JSON policy '${filePath}': ${details || "empty document"}.`);
  }

  const duplicateKeys = [];
  collectDuplicateKeys(tree, [], duplicateKeys);
  if (duplicateKeys.length > 0) {
    throw new Error(`Duplicate JSON object key(s) in '${filePath}': ${duplicateKeys.join(", ")}.`);
  }

  return JSON.parse(source);
}

function collectDuplicateKeys(node, parentPath, out) {
  if (node.type === "object") {
    const seen = new Set();
    for (const property of node.children || []) {
      const keyNode = property.children?.[0];
      const valueNode = property.children?.[1];
      const key = keyNode?.value;
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
