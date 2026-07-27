// Unsafe HTML DOM sink rule family: innerHTML/outerHTML/insertAdjacentHTML/
// document.write/inline event-handler assignment detection with a reviewed allowlist.

import { getFileData } from "./shared.mjs";
import { collectStaticStringConstants, parseAst, staticMemberName, staticStringValue, walkAst } from "./ast-utils.mjs";

/** @typedef {import("./shared.mjs").Finding} Finding */
/** @typedef {import("./shared.mjs").Rule} Rule */
/** @typedef {{owner: string, target: string, rhs: string, count: number}} SinkAllowlistEntry */

/** @type {Record<string, SinkAllowlistEntry[]>} */
const UNSAFE_SINK_ASSIGNMENT_ALLOWLIST = {
  "shared/widget-kits/html/HtmlDomPatchUtils.js": [
    htmlAssignment("patchInnerHtml", "rootEl.innerHTML"),
    htmlAssignment("patchInnerHtml", "template.innerHTML")
  ],
  "plugin.js": resourceAssignments("loadScriptOnce", "scriptEl"),
  "plugin.mjs": resourceAssignments("loadScriptOnce", "scriptEl"),
  "runtime/plugin-bootstrap-core.js": [
    ...resourceAssignments("loadScriptOnceById", "scriptEl"),
    ...resourceAssignments("loadCssOnceById", "linkEl")
  ],
  "runtime/asset-preloader.js": resourceAssignments("loadImage", "img")
};

const HTML_ASSIGNMENT_SINKS = new Set(["innerHTML", "outerHTML"]);
const INLINE_HANDLER_NAME = /^on[a-z][a-z0-9_-]*$/i;

/** @param {Rule} rule @param {string[]} files @returns {Finding[]} */
export function runUnsafeHtmlDomSinkRule(rule, files) {
  /** @type {Finding[]} */
  const out = [];

  for (const file of files) {
    const data = getFileData(file);
    /** @type {Set<string>} */
    const seen = new Set();
    const ast = parseAst(file, data.text);
    const constants = collectStaticStringConstants(ast);
    /** @type {Map<string, number>} */
    const allowCounts = new Map();

    walkAst(ast, function (node, _parent, _parentKey, ancestors) {
      const sinkName = unsafeSinkName(node, constants);
      if (!sinkName) return;
      if (isAllowedSinkAssignment(file, node, ancestors, constants, allowCounts)) return;
      const line = node.loc.start.line;
      const key = `${file}:${line}:${sinkName}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        file,
        line,
        message: rule.message({ file, line, sinkName })
      });
    });
  }

  return out;
}

/** @param {string} owner @param {string} target @returns {SinkAllowlistEntry} */
function htmlAssignment(owner, target) {
  return { owner, target, rhs: "markup", count: 1 };
}

/** @param {string} owner @param {string} target @returns {SinkAllowlistEntry[]} */
function resourceAssignments(owner, target) {
  return [
    { owner, target: `${target}.onload`, rhs: "function", count: 1 },
    { owner, target: `${target}.onerror`, rhs: "function", count: 1 }
  ];
}

/**
 * @param {string} file
 * @param {any} node
 * @param {any[]} ancestors
 * @param {Map<string, string>} constants
 * @param {Map<string, number>} counts
 * @returns {boolean}
 */
function isAllowedSinkAssignment(file, node, ancestors, constants, counts) {
  if (node.type !== "AssignmentExpression" || node.operator !== "=" || node.left.type !== "MemberExpression") {
    return false;
  }
  if (node.left.object.type !== "Identifier") return false;
  const target = `${node.left.object.name}.${staticMemberName(node.left, constants)}`;
  const spec = UNSAFE_SINK_ASSIGNMENT_ALLOWLIST[file]?.find(function (candidate) {
    return (
      candidate.target === target && ownsAssignment(ancestors, candidate.owner) && matchesAllowedRhs(node, candidate)
    );
  });
  if (!spec) return false;
  const key = `${spec.owner}:${spec.target}`;
  const count = (counts.get(key) || 0) + 1;
  counts.set(key, count);
  return count <= spec.count;
}

/** @param {any[]} ancestors @param {string} owner @returns {boolean} */
function ownsAssignment(ancestors, owner) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type === "FunctionDeclaration") return ancestor.id?.name === owner;
  }
  return false;
}

/** @param {any} node @param {SinkAllowlistEntry} spec @returns {boolean} */
function matchesAllowedRhs(node, spec) {
  if (spec.rhs === "markup") return node.right.type === "Identifier" && node.right.name === "markup";
  return node.right.type === "FunctionExpression" || node.right.type === "ArrowFunctionExpression";
}

/** @param {any} node @param {Map<string, string>} constants @returns {string|undefined} */
function unsafeSinkName(node, constants) {
  if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression") {
    const memberName = staticMemberName(node.left, constants);
    if (HTML_ASSIGNMENT_SINKS.has(memberName || "")) return memberName;
    if (INLINE_HANDLER_NAME.test(memberName || "")) return "inline event-handler assignment";
    return undefined;
  }

  if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression") return undefined;
  const memberName = staticMemberName(node.callee, constants);
  if (memberName === "insertAdjacentHTML") return memberName;
  if ((memberName === "write" || memberName === "writeln") && isDocumentReference(node.callee.object)) {
    return "document.write";
  }
  if (
    memberName === "setAttribute" &&
    INLINE_HANDLER_NAME.test(staticStringValue(node.arguments[0], constants) || "")
  ) {
    return "inline event-handler assignment";
  }
  return undefined;
}

/** @param {any} node @returns {boolean} */
function isDocumentReference(node) {
  if (node.type === "Identifier") return node.name === "document";
  return node.type === "MemberExpression" && staticMemberName(node) === "document";
}
