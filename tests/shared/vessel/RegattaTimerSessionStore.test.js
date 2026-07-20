const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("RegattaTimerSessionStore", function () {
  function createApi() {
    const module = loadFresh("shared/widget-kits/vessel/RegattaTimerSessionStore.js");
    return module.create({}, createComponentContextMock());
  }

  /** @param {Record<string, any>} [overrides] */
  function activeSnapshot(overrides) {
    return Object.assign({ phase: "countdown", remainingMs: 1000 }, overrides || {});
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();
    context.DyniComponents.DyniValueMath = loadFresh("shared/widget-kits/value/ValueMath.js");

    runIifeScript("shared/widget-kits/vessel/RegattaTimerSessionStore.js", context);

    expect(context.DyniComponents.DyniRegattaTimerSessionStore).toBeTruthy();
    expect(context.DyniComponents.DyniRegattaTimerSessionStore.id).toBe("RegattaTimerSessionStore");
  });

  it("returns no stored snapshot before identity has ever been synced", function () {
    const api = createApi();
    const store = api.createSessionStore();

    expect(store.readStoredSnapshot()).toBeNull();
  });

  it("persists an active-phase snapshot in the registry and shares it across a remount with the same explicit session key", function () {
    const api = createApi();
    const storeA = api.createSessionStore();
    storeA.syncIdentity({ regattaTimerSessionKey: "fixed-key" }, {});
    storeA.persistSnapshot(activeSnapshot());

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ regattaTimerSessionKey: "fixed-key" }, {});

    expect(storeB.readStoredSnapshot()).toEqual(activeSnapshot());
  });

  it("does not share snapshots across different explicit session keys", function () {
    const api = createApi();
    const storeA = api.createSessionStore();
    storeA.syncIdentity({ regattaTimerSessionKey: "key-one" }, {});
    storeA.persistSnapshot(activeSnapshot());

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ regattaTimerSessionKey: "key-two" }, {});

    expect(storeB.readStoredSnapshot()).toBeNull();
  });

  it("resolves routeId from payload.routeId directly and keeps it across a remount without an explicit session key", function () {
    const api = createApi();
    const storeA = api.createSessionStore();
    storeA.syncIdentity({ pageId: "gps", cluster: "vessel", kind: "regattaTimer" }, { routeId: "vessel/regattaTimer" });
    storeA.persistSnapshot(activeSnapshot());

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ pageId: "gps", cluster: "vessel", kind: "regattaTimer" }, { routeId: "vessel/regattaTimer" });

    expect(storeB.readStoredSnapshot()).toEqual(activeSnapshot());
  });

  it("resolves routeId from a shellEl DOM attribute when payload.routeId is absent", function () {
    const api = createApi();
    const shellEl = { getAttribute: vi.fn(() => "vessel/regattaTimer") };
    const storeA = api.createSessionStore();
    storeA.syncIdentity({ pageId: "gps" }, { shellEl: shellEl });
    storeA.persistSnapshot(activeSnapshot());

    expect(shellEl.getAttribute).toHaveBeenCalledWith("data-dyni-route");

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ pageId: "gps" }, { shellEl: shellEl });

    expect(storeB.readStoredSnapshot()).toEqual(activeSnapshot());
  });

  it("keeps the last known routeId when a later payload provides neither routeId nor a usable shellEl", function () {
    const api = createApi();
    const store = api.createSessionStore();
    store.syncIdentity({ pageId: "gps" }, { routeId: "vessel/regattaTimer" });
    store.persistSnapshot(activeSnapshot());

    store.syncIdentity({ pageId: "gps" }, {});

    expect(store.readStoredSnapshot()).toEqual(activeSnapshot());
  });

  it("treats a shellEl without a getAttribute function or a non-object payload as no routeId", function () {
    const api = createApi();
    const storeA = api.createSessionStore();
    storeA.syncIdentity({ pageId: "gps" }, { shellEl: {} });
    storeA.persistSnapshot(activeSnapshot());

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ pageId: "gps" }, "not-an-object");

    expect(storeB.readStoredSnapshot()).toEqual(activeSnapshot());
  });

  it("falls back to surfacePolicy pageId/routeId and derives cluster/kind by splitting the slash-delimited routeId", function () {
    const api = createApi();
    const storeA = api.createSessionStore();
    storeA.syncIdentity({ surfacePolicy: { pageId: "gps", routeId: "vessel/regattaTimer" } }, {});
    storeA.persistSnapshot(activeSnapshot());

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ surfacePolicy: { pageId: "gps", routeId: "vessel/regattaTimer" } }, {});

    expect(storeB.readStoredSnapshot()).toEqual(activeSnapshot());
  });

  it("does not persist idle-phase snapshots in the registry and clears any prior active registry entry", function () {
    const api = createApi();
    const store = api.createSessionStore();
    store.syncIdentity({ regattaTimerSessionKey: "idle-key" }, {});
    store.persistSnapshot(activeSnapshot());
    store.persistSnapshot({ phase: "idle" });

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ regattaTimerSessionKey: "idle-key" }, {});

    expect(storeB.readStoredSnapshot()).toBeNull();
  });

  it("ignores null/undefined/non-object snapshots passed to persistSnapshot", function () {
    const api = createApi();
    const store = api.createSessionStore();
    store.syncIdentity({ regattaTimerSessionKey: "invalid-key" }, {});

    expect(function () {
      store.persistSnapshot(null);
      store.persistSnapshot(undefined);
      store.persistSnapshot("nope");
    }).not.toThrow();
    expect(store.readStoredSnapshot()).toBeNull();
  });

  it("re-checks registry entry activity on read and evicts an entry that has gone stale since it was stored", function () {
    const api = createApi();
    const store = api.createSessionStore();
    store.syncIdentity({ regattaTimerSessionKey: "stale-key" }, {});
    const snapshot = activeSnapshot();
    store.persistSnapshot(snapshot);

    snapshot.phase = "idle";

    const storeB = api.createSessionStore();
    storeB.syncIdentity({ regattaTimerSessionKey: "stale-key" }, {});
    expect(storeB.readStoredSnapshot()).toBeNull();
  });

  it("writes every persisted snapshot (active or not) to the host context and falls back to it when the registry has none", function () {
    const api = createApi();
    const hostContext = /** @type {Record<string, any>} */ ({});
    const store = api.createSessionStore({ hostContext: hostContext });
    store.syncIdentity({}, {});

    store.persistSnapshot({ phase: "idle", remainingMs: 0 });

    expect(hostContext.__dyniRegattaTimerSession).toEqual({ phase: "idle", remainingMs: 0 });
    expect(store.readStoredSnapshot()).toEqual({ phase: "idle", remainingMs: 0 });
  });

  it("treats a non-object host snapshot value as absent", function () {
    const api = createApi();
    const hostContext = { __dyniRegattaTimerSession: "garbage" };
    const store = api.createSessionStore({ hostContext: hostContext });
    store.syncIdentity({}, {});

    expect(store.readStoredSnapshot()).toBeNull();
  });

  it("clearStoredSnapshot removes both the host snapshot and any registry entry, and is a no-op when nothing was stored", function () {
    const api = createApi();
    const hostContext = {};
    const store = api.createSessionStore({ hostContext: hostContext });
    store.syncIdentity({ regattaTimerSessionKey: "clear-key" }, {});
    store.persistSnapshot(activeSnapshot());

    store.clearStoredSnapshot();

    expect(store.readStoredSnapshot()).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(hostContext, "__dyniRegattaTimerSession")).toBe(false);

    expect(function () {
      store.clearStoredSnapshot();
    }).not.toThrow();

    const bareStore = api.createSessionStore();
    expect(function () {
      bareStore.clearStoredSnapshot();
    }).not.toThrow();
  });
});
