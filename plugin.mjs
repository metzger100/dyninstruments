/**
 * Module: plugin.mjs - Modern AvNav module bootstrap adapter
 * Documentation: documentation/architecture/runtime-lifecycle.md
 * Depends: runtime/plugin-bootstrap-core.js
 */

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new Error("dyninstruments: api.getBaseUrl() returned an invalid plugin base URL");
  }
  return baseUrl.replace(/\/+$/, "") + "/";
}

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

function loadScriptOnce(scriptId, src) {
  if (document.getElementById(scriptId)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const scriptEl = document.createElement("script");
    scriptEl.id = scriptId;
    scriptEl.async = true;
    scriptEl.src = src;
    scriptEl.onload = () => resolve();
    scriptEl.onerror = reject;
    document.head.appendChild(scriptEl);
  });
}

async function ensureBootstrapCore(baseUrl) {
  const ns = window.DyniPlugin = window.DyniPlugin || {};
  const state = ns.moduleBootstrapCoreState = ns.moduleBootstrapCoreState || {
    lastBaseUrl: "",
    loadedCoreIds: {}
  };
  if (window.DyniPluginBootstrapCore) {
    if (state.lastBaseUrl === baseUrl) {
      return window.DyniPluginBootstrapCore;
    }
  }

  const corePath = "runtime/plugin-bootstrap-core.js";
  const coreId = `dyni-bootstrap-core-module-${hashText(baseUrl)}`;
  if (window.DyniPluginBootstrapCore && !state.lastBaseUrl) {
    state.loadedCoreIds[coreId] = true;
    state.lastBaseUrl = baseUrl;
    return window.DyniPluginBootstrapCore;
  }
  await loadScriptOnce(coreId, baseUrl + corePath);

  if (!window.DyniPluginBootstrapCore) {
    throw new Error("dyninstruments: bootstrap core did not register");
  }

  state.loadedCoreIds[coreId] = true;
  state.lastBaseUrl = baseUrl;
  return window.DyniPluginBootstrapCore;
}

export default async function initDyniPlugin(api) {
  if (!api || typeof api.getBaseUrl !== "function") {
    throw new Error("dyninstruments: plugin.mjs requires an AvNav API object with getBaseUrl()");
  }

  const baseUrl = normalizeBaseUrl(api.getBaseUrl());
  const core = await ensureBootstrapCore(baseUrl);

  return core.start({
    root: window,
    document,
    logger: console,
    baseUrl,
    hostApi: api,
    entrypoint: "module"
  });
}
