/**
 * Module: DyniPlugin PerfSpanHelper - Shared runtime perf-span helper for IIFE modules
 * Documentation: documentation/architecture/component-system.md
 * Depends: runtime/namespace.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const PERF_HOOK_KEY = "__DYNI_PERF_HOOKS__";

  function resolveHooks() {
    const hooks = root[PERF_HOOK_KEY];
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

  const api = {
    startSpan: startSpan,
    endSpan: endSpan
  };

  runtime.getPerfSpanApi = function getPerfSpanApi() {
    return api;
  };
}(this));
