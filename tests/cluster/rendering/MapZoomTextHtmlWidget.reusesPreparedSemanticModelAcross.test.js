// @ts-check
const { createRenderer, makeProps, withSurfacePolicy } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("reuses prepared semantic model across layoutSignature and patchDom and invalidates on structural boundaries", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (value === null || value === undefined) {
        return cfg.default;
      }
      if (cfg.formatter === "formatDecimalOpt") {
        return "Z:" + String(value);
      }
      return String(value);
    });
    const renderer = createRenderer({ applyFormatter });
    /** @type {{ __dyniHostCommitState?: { rootEl: HTMLElement, shellEl: HTMLElement } }} */
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

    /** @param {ReturnType<typeof withSurfacePolicy>} props @param {number} revision @param {{ width: number, height: number }} shellRect @param {boolean} layoutChanged */
    function buildPayload(props, revision, shellRect, layoutChanged) {
      return {
        props,
        revision,
        rootEl,
        shellEl,
        mountEl,
        shadowRoot: null,
        shellRect,
        hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const propsA = withSurfacePolicy(makeProps(), { mode: "dispatch" });
    const initial = buildPayload(propsA, 1, { width: 320, height: 180 }, true);
    committed.layoutSignature(initial);
    committed.mount(mountEl, initial);
    expect(applyFormatter).toHaveBeenCalledTimes(2);

    const revisionChanged = buildPayload(propsA, 2, { width: 320, height: 180 }, false);
    committed.layoutSignature(revisionChanged);
    committed.update(revisionChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(4);

    const propsIdentityChanged = buildPayload(
      withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      2,
      { width: 320, height: 180 },
      false
    );
    committed.layoutSignature(propsIdentityChanged);
    committed.update(propsIdentityChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    const shellSizeChanged = buildPayload(propsIdentityChanged.props, 2, { width: 321, height: 180 }, true);
    committed.layoutSignature(shellSizeChanged);
    committed.update(shellSizeChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(8);
  });
});
