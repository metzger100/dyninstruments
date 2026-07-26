// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("escapes content and fails closed without default", function () {
    const renderer = createRenderer({
      applyFormatter: function () {
        return '<span class="unsafe">x</span>';
      }
    });
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(
        makeProps({
          caption: "<ZOOM>",
          unit: '"deg"',
          zoom: 12.1,
          requiredZoom: 11.7
        }),
        { mode: "dispatch" }
      )
    );

    const html = mounted.html();
    expect(html).toContain("&lt;ZOOM&gt;");
    expect(html).toContain('"deg"');
    expect(html).toContain('&lt;span class="unsafe"&gt;x&lt;/span&gt;');

    const committed = renderer.createCommittedRenderer({
      hostContext: {},
      mountEl: null,
      shadowRoot: null
    });
    const mountEl = document.createElement("div");
    expect(function () {
      committed.mount(mountEl, {
        props: { caption: "ZOOM" },
        revision: 1,
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        mountEl,
        shadowRoot: null,
        shellRect: { width: 320, height: 180 },
        hostContext: {},
        layoutChanged: true,
        relayoutPass: 0
      });
    }).toThrow("props.default is required");
  });

  it("updates layout signature when layout-relevant data changes", function () {
    const renderer = createRenderer();
    const committed = renderer.createCommittedRenderer({
      hostContext: {},
      mountEl: null,
      shadowRoot: null
    });

    const base = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 300, height: 100 }
    });
    const captionChanged = committed.layoutSignature({
      props: withSurfacePolicy(makeProps({ caption: "ZOOM EXT" }), {
        mode: "dispatch"
      }),
      shellRect: { width: 300, height: 100 }
    });
    const stableDigitsChanged = committed.layoutSignature({
      props: withSurfacePolicy(makeProps({ stableDigits: true, zoom: 12.2, requiredZoom: 11.9 }), { mode: "dispatch" }),
      shellRect: { width: 300, height: 100 }
    });
    const shapeChanged = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 90, height: 200 }
    });

    expect(captionChanged).not.toBe(base);
    expect(stableDigitsChanged).not.toBe(base);
    expect(shapeChanged).not.toBe(base);
  });
});
