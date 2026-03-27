/**
 * Module: PerfSpanHelper - Shared perf-span start/end helper for UMD consumers
 * Documentation: documentation/architecture/component-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniPerfSpanHelper = factory(); }
}(this, function () {
  "use strict";

  const GLOBAL_ROOT = (typeof globalThis !== "undefined")
    ? globalThis
    : (typeof self !== "undefined" ? self : {});
  const PERF_HOOK_KEY = "__DYNI_PERF_HOOKS__";

  function resolveHooks() {
    const hooks = GLOBAL_ROOT[PERF_HOOK_KEY];
    if (!hooks || typeof hooks.startSpan !== "function") {
      return null;
    }
    return hooks;
  }

  function startSpan(name, tags) {
    const hooks = resolveHooks();
    if (!hooks) {
      return null;
    }
    return {
      hooks: hooks,
      token: hooks.startSpan(name, tags || null)
    };
  }

  function endSpan(span, tags) {
    if (!span || !span.hooks || typeof span.hooks.endSpan !== "function") {
      return;
    }
    span.hooks.endSpan(span.token, tags || null);
  }

  function create() {
    return {
      id: "PerfSpanHelper",
      startSpan: startSpan,
      endSpan: endSpan
    };
  }

  return { id: "PerfSpanHelper", create: create };
}));
