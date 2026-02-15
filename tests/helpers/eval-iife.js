const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createScriptContext(overrides) {
  const base = {
    console,
    Promise,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Date,
    RegExp,
    JSON,
    Map,
    Set,
    parseInt,
    parseFloat,
    isFinite,
    isNaN,
    setTimeout,
    clearTimeout
  };

  const ctx = Object.assign({}, base, overrides || {});

  if (!ctx.window) ctx.window = {};
  if (!ctx.document) ctx.document = ctx.window.document;
  if (!ctx.window.document && ctx.document) ctx.window.document = ctx.document;

  ctx.window.window = ctx.window;
  ctx.window.self = ctx.window;

  if (ctx.window.avnav && !ctx.avnav) ctx.avnav = ctx.window.avnav;
  if (ctx.avnav && !ctx.window.avnav) ctx.window.avnav = ctx.avnav;

  ctx.globalThis = ctx;
  ctx.self = ctx;

  return vm.createContext(ctx);
}

function runIifeScript(relPath, context) {
  const abs = path.resolve(process.cwd(), relPath);
  const src = fs.readFileSync(abs, "utf8");
  vm.runInContext(src, context, { filename: abs });
  return context;
}

module.exports = {
  createScriptContext,
  runIifeScript
};
