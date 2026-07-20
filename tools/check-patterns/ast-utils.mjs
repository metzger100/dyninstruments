import { Linter } from "eslint";

export function parseAst(file, source) {
  const linter = new Linter();
  const sourceType = file.endsWith(".mjs") ? "module" : "script";
  linter.verify(source, {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType
    }
  });
  const sourceCode = linter.getSourceCode();
  if (!sourceCode) {
    throw new Error(`Unable to parse '${file}' for pattern checks.`);
  }
  return sourceCode.ast;
}

export function walkAst(node, visitor, parent = null, parentKey = null, ancestors = []) {
  if (!node || typeof node !== "object" || typeof node.type !== "string") return;
  visitor(node, parent, parentKey, ancestors);
  const childAncestors = ancestors.concat(node);
  for (const key of Object.keys(node)) {
    if (key === "parent" || key === "loc" || key === "range") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach(function (child) {
        walkAst(child, visitor, node, key, childAncestors);
      });
    } else {
      walkAst(value, visitor, node, key, childAncestors);
    }
  }
}

export function collectStaticStringConstants(ast) {
  const declarations = new Map();
  const duplicateNames = new Set();
  walkAst(ast, function (node) {
    if (node.type !== "VariableDeclaration" || node.kind !== "const") return;
    for (const declaration of node.declarations) {
      if (declaration.id.type !== "Identifier" || !declaration.init) continue;
      if (declarations.has(declaration.id.name)) duplicateNames.add(declaration.id.name);
      else declarations.set(declaration.id.name, declaration.init);
    }
  });
  for (const name of duplicateNames) declarations.delete(name);

  const constants = new Map();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, init] of declarations) {
      if (constants.has(name)) continue;
      const value = staticStringValue(init, constants);
      if (value === undefined) continue;
      constants.set(name, value);
      changed = true;
    }
  }
  return constants;
}

export function staticMemberName(member, constants) {
  if (!member || member.type !== "MemberExpression") return undefined;
  if (!member.computed && member.property.type === "Identifier") return member.property.name;
  return staticStringValue(member.property, constants);
}

export function staticStringValue(node, constants) {
  if (!node) return undefined;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "Identifier") return constants?.get(node.name);
  if (node.type === "BinaryExpression" && node.operator === "+") return staticStringConcat(node, constants);
  if (node.type === "TemplateLiteral") return staticTemplateValue(node, constants);
  return undefined;
}

function staticStringConcat(node, constants) {
  const left = staticStringValue(node.left, constants);
  const right = staticStringValue(node.right, constants);
  if (left === undefined || right === undefined) return undefined;
  return left + right;
}

function staticTemplateValue(node, constants) {
  let value = node.quasis[0].value.cooked;
  for (let index = 0; index < node.expressions.length; index += 1) {
    const expression = staticStringValue(node.expressions[index], constants);
    if (expression === undefined) return undefined;
    value += expression + node.quasis[index + 1].value.cooked;
  }
  return value;
}
