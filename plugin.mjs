/**
 * @file plugin.mjs - Modern AvNav module bootstrap adapter
 * Documentation: documentation/architecture/runtime-lifecycle.md
 */

/** @typedef {DyniAvnavApi & { getBaseUrl: () => string, registerWidget: (definition: Record<string, unknown>, editable: Record<string, unknown>) => void, log: (...args: unknown[]) => void }} DyniModuleApi */
/** @typedef {{ lastBaseUrl: string, loadedCoreIds: Record<string, boolean> }} DyniModuleBootstrapCoreState */
/** @typedef {DyniPluginNamespace & { moduleBootstrapCoreState?: DyniModuleBootstrapCoreState }} DyniModulePluginNamespace */

/** @param {string} baseUrl @returns {string} */
function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new Error("dyninstruments: api.getBaseUrl() returned an invalid plugin base URL");
  }
  return baseUrl.replace(/\/+$/, "") + "/";
}

/** @param {DyniModuleApi | null | undefined} api @param {keyof DyniModuleApi} methodName */
function requireApiMethod(api, methodName) {
  if (!api || typeof api[methodName] !== "function") {
    throw new Error(`dyninstruments: plugin.mjs requires api.${methodName}()`);
  }
}

/** @param {unknown} value @returns {string} */
function hashText(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

/** @param {string} scriptId @param {string} src @returns {Promise<void>} */
function loadScriptOnce(scriptId, src) {
  if (document.getElementById(scriptId)) {
    return Promise.resolve();
  }

  return new Promise((/** @type {() => void} */ resolve, /** @type {(reason?: unknown) => void} */ reject) => {
    const scriptEl = document.createElement("script");
    scriptEl.id = scriptId;
    scriptEl.async = true;
    scriptEl.src = src;
    scriptEl.onload = () => resolve();
    scriptEl.onerror = (error) => {
      removeElement(scriptEl);
      reject(error);
    };
    document.head.appendChild(scriptEl);
  });
}

/** @param {Element | null | undefined} element */
function removeElement(element) {
  if (!element) {
    return;
  }
  if (element.parentNode && typeof element.parentNode.removeChild === "function") {
    element.parentNode.removeChild(element);
    return;
  }
  if (typeof element.remove === "function") {
    element.remove();
  }
}

/** @param {string} baseUrl @returns {Promise<DyniBootstrapCoreApi>} */
async function ensureBootstrapCore(baseUrl) {
  const ns = /** @type {DyniModulePluginNamespace} */ (window.DyniPlugin = window.DyniPlugin || {});
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

/** @param {DyniModuleApi} api @returns {Promise<(() => void) | undefined>} */
export default async function initDyniPlugin(api) {
  requireApiMethod(api, "getBaseUrl");
  requireApiMethod(api, "registerWidget");
  requireApiMethod(api, "log");

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
