/**
 * @file RegattaTimerSessionStore - Session persistence for regatta timer across renderer remounts
 * Documentation: documentation/widgets/regatta-timer.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerSessionStore = factory();
  }
}(this, function () {
  "use strict";

  const HOST_SESSION_KEY = "__dyniRegattaTimerSession";
  /** @type {Record<string, { snapshot: DyniRegattaTimerSessionSnapshot, updatedAt: number }>} */
  const SESSION_REGISTRY = Object.create(null);

  /** @param {unknown} phase @returns {boolean} */
  function isActivePhase(phase) {
    return phase === "countdown" || phase === "elapsed";
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniRegattaTimerSessionStoreApi}
   */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const toObject = valueMath.toObject;

    /** @param {unknown} rawValue @returns {string} */
    function textOrEmpty(rawValue) {
      return rawValue == null ? "" : String(rawValue);
    }

    /** @param {unknown} payload @returns {string} */
    function resolveRouteIdFromPayload(payload) {
      const source = /** @type {Record<string, unknown> | null} */ (
        payload && typeof payload === "object" ? payload : null
      );
      if (source && typeof source.routeId === "string" && source.routeId) {
        return source.routeId;
      }

      const shellEl = /** @type {{ getAttribute?: unknown } | null} */ (
        source && source.shellEl && typeof source.shellEl === "object" ? source.shellEl : null
      );
      if (!shellEl || typeof shellEl.getAttribute !== "function") {
        return "";
      }

      const routeAttr = shellEl.getAttribute("data-dyni-route");
      return typeof routeAttr === "string" ? routeAttr : "";
    }

    /** @param {unknown} props @param {unknown} lastRouteId @returns {string} */
    function resolveSessionKey(props, lastRouteId) {
      const p = toObject(props);
      if (typeof p.regattaTimerSessionKey === "string" && p.regattaTimerSessionKey) {
        return p.regattaTimerSessionKey;
      }

      const surfacePolicy = toObject(p.surfacePolicy);
      const routeId = textOrEmpty(p.routeId || p.__dyniRouteId || p.regattaRouteId || surfacePolicy.routeId || lastRouteId);
      const routeSplit = routeId.indexOf("/") > 0 ? routeId.split("/") : [];
      const pageId = textOrEmpty(surfacePolicy.pageId || p.pageId);
      const cluster = textOrEmpty(p.cluster || surfacePolicy.cluster || routeSplit[0]);
      const kind = textOrEmpty(p.kind || surfacePolicy.kind || routeSplit[1]);

      return [pageId, routeId, cluster, kind].join("|");
    }

    /** @param {unknown} options @returns {DyniRegattaTimerSessionStore} */
    function createSessionStore(options) {
      const opts = toObject(options);
      const hostContext = /** @type {DyniRegattaTimerHostContext | null} */ (
        opts.hostContext && typeof opts.hostContext === "object" ? opts.hostContext : null
      );
      let sessionKey = "";
      let lastRouteId = "";

      /** @returns {DyniRegattaTimerSessionSnapshot | null} */
      function readHostSnapshot() {
        if (!hostContext) {
          return null;
        }
        const snapshot = hostContext[HOST_SESSION_KEY];
        return /** @type {DyniRegattaTimerSessionSnapshot | null} */ (
          snapshot && typeof snapshot === "object" ? snapshot : null
        );
      }

      /** @param {unknown} snapshot @returns {void} */
      function writeHostSnapshot(snapshot) {
        if (!hostContext) {
          return;
        }
        hostContext[HOST_SESSION_KEY] = /** @type {DyniRegattaTimerSessionSnapshot | null} */ (
          snapshot && typeof snapshot === "object" ? snapshot : null
        );
      }

      /** @returns {void} */
      function clearHostSnapshot() {
        if (!hostContext || !Object.prototype.hasOwnProperty.call(hostContext, HOST_SESSION_KEY)) {
          return;
        }
        delete hostContext[HOST_SESSION_KEY];
      }

      /** @returns {DyniRegattaTimerSessionSnapshot | null} */
      function readRegistrySnapshot() {
        if (!sessionKey) {
          return null;
        }

        const entry = SESSION_REGISTRY[sessionKey];
        if (!entry || typeof entry !== "object" || !entry.snapshot || typeof entry.snapshot !== "object") {
          return null;
        }
        if (!isActivePhase(entry.snapshot.phase)) {
          delete SESSION_REGISTRY[sessionKey];
          return null;
        }

        return entry.snapshot;
      }

      /** @param {unknown} props @param {unknown} payload @returns {void} */
      function syncIdentity(props, payload) {
        const routeId = resolveRouteIdFromPayload(payload);
        if (routeId) {
          lastRouteId = routeId;
        }
        sessionKey = resolveSessionKey(props, lastRouteId);
      }

      /** @returns {DyniRegattaTimerSessionSnapshot | null} */
      function readStoredSnapshot() {
        return readRegistrySnapshot() || readHostSnapshot();
      }

      /** @param {unknown} snapshot @returns {void} */
      function persistSnapshot(snapshot) {
        const snap = /** @type {DyniRegattaTimerSessionSnapshot | null} */ (
          snapshot && typeof snapshot === "object" ? snapshot : null
        );
        if (!snap) {
          return;
        }

        writeHostSnapshot(snap);
        if (!sessionKey) {
          return;
        }

        if (isActivePhase(snap.phase)) {
          SESSION_REGISTRY[sessionKey] = {
            snapshot: snap,
            updatedAt: Date.now()
          };
          return;
        }

        delete SESSION_REGISTRY[sessionKey];
      }

      /** @returns {void} */
      function clearStoredSnapshot() {
        clearHostSnapshot();
        if (sessionKey) {
          delete SESSION_REGISTRY[sessionKey];
        }
      }

      return {
        syncIdentity: syncIdentity,
        readStoredSnapshot: readStoredSnapshot,
        persistSnapshot: persistSnapshot,
        clearStoredSnapshot: clearStoredSnapshot
      };
    }

    return {
      id: "RegattaTimerSessionStore",
      createSessionStore: createSessionStore
    };
  }

  return { id: "RegattaTimerSessionStore", create: create };
}));
