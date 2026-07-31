// @ts-check
const { createRenderer, makeProps, withSurfacePolicy } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("clears prepared semantic model state on detach and destroy", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      return value === null || value === undefined ? cfg.default : String(value);
    });
    const renderer = createRenderer({ applyFormatter });
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

    const payload = {
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      revision: 5,
      rootEl,
      shellEl,
      mountEl,
      shadowRoot: null,
      shellRect: { width: 320, height: 180 },
      hostContext,
      layoutChanged: true,
      relayoutPass: 0
    };

    committed.layoutSignature(payload);
    committed.mount(mountEl, payload);
    expect(applyFormatter).toHaveBeenCalledTimes(2);

    committed.detach("test");
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(4);

    committed.mount(mountEl, payload);
    committed.destroy();
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(6);
  });
});
