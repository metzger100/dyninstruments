// Unsafe HTML DOM sink rule family: innerHTML/outerHTML/insertAdjacentHTML/
// document.write/inline event-handler assignment detection with a reviewed allowlist.

import { getFileData } from "./shared.mjs";
import { collectStaticStringConstants, parseAst, staticMemberName, staticStringValue, walkAst } from "./ast-utils.mjs";

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

export function runUnsafeHtmlDomSinkRule(rule, files) {
  const out = [];

  for (const file of files) {
    const data = getFileData(file);
    const seen = new Set();
    const ast = parseAst(file, data.text);
    const constants = collectStaticStringConstants(ast);
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

function htmlAssignment(owner, target) {
  return { owner, target, rhs: "markup", count: 1 };
}

function resourceAssignments(owner, target) {
  return [
    { owner, target: `${target}.onload`, rhs: "function", count: 1 },
    { owner, target: `${target}.onerror`, rhs: "function", count: 1 }
  ];
}

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

function ownsAssignment(ancestors, owner) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type === "FunctionDeclaration") return ancestor.id?.name === owner;
  }
  return false;
}

function matchesAllowedRhs(node, spec) {
  if (spec.rhs === "markup") return node.right.type === "Identifier" && node.right.name === "markup";
  return node.right.type === "FunctionExpression" || node.right.type === "ArrowFunctionExpression";
}

function unsafeSinkName(node, constants) {
  if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression") {
    const memberName = staticMemberName(node.left, constants);
    if (HTML_ASSIGNMENT_SINKS.has(memberName)) return memberName;
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

function isDocumentReference(node) {
  if (node.type === "Identifier") return node.name === "document";
  return node.type === "MemberExpression" && staticMemberName(node) === "document";
}
