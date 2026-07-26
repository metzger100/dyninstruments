// @ts-check
const {
  MODULE_PATH_BY_ID,
  createRenderer,
  loadFresh,
  makeProps,
  withSurfacePolicy
} = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("always consults MapZoomHtmlFit when a shell rect exists", function () {
    const fitCompute = vi.fn(function () {
      return {
        captionStyle: "font-size:12px;",
        valueStyle: "font-size:20px;",
        unitStyle: "font-size:10px;",
        requiredStyle: "font-size:8px;"
      };
    });
    const moduleCache = Object.create(null);
    const renderer = createRenderer({
      // @ts-ignore -- pre-existing untyped test mock boundary
      loadDep(id) {
        if (id === "MapZoomHtmlFit") {
          return { create: () => ({ compute: fitCompute }) };
        }
        // @ts-ignore -- pre-existing untyped test mock boundary
        const relPath = MODULE_PATH_BY_ID[id];
        if (!relPath) {
          throw new Error("unexpected module lookup: " + id);
        }
        if (!moduleCache[id]) {
          moduleCache[id] = loadFresh(relPath);
        }
        return moduleCache[id];
      }
    });
    const hostContext = {};
    const committed = renderer.createCommittedRenderer({
      hostContext,
      mountEl: null,
      shadowRoot: null
    });
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };

    // @ts-ignore -- pre-existing untyped test mock boundary
    function payload(revision, layoutChanged) {
      return {
        props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
        revision: revision,
        rootEl: rootEl,
        shellEl: shellEl,
        mountEl: mountEl,
        shadowRoot: null,
        shellRect: { width: 320, height: 180 },
        hostContext: hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const initial = payload(1, true);
    committed.mount(mountEl, initial);
    expect(fitCompute).toHaveBeenCalledTimes(1);

    const stableUpdate = payload(2, false);
    committed.update(stableUpdate);
    expect(fitCompute).toHaveBeenCalledTimes(2);
  });
});
