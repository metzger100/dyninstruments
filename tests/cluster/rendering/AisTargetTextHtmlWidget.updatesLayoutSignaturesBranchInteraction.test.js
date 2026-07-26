// @ts-check
const { createRenderer, fs, makeProps, path, withSurfacePolicy } = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("updates layout signatures for branch and interaction changes", function () {
    const renderer = createRenderer().renderer;
    const committed = renderer.createCommittedRenderer({
      hostContext: {},
      mountEl: null,
      shadowRoot: null
    });

    const dispatchTcpa = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { interactionMode: "dispatch" }),
      shellRect: { width: 320, height: 180 }
    });
    const dispatchBrg = committed.layoutSignature({
      props: withSurfacePolicy(makeProps({ domain: { showTcpaBranch: false } }), { interactionMode: "dispatch" }),
      shellRect: { width: 320, height: 180 }
    });
    const passiveTcpa = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { interactionMode: "passive" }),
      shellRect: { width: 320, height: 180 }
    });
    const verticalA = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), {
        containerOrientation: "vertical",
        interactionMode: "dispatch"
      }),
      shellRect: { width: 220, height: 120 }
    });
    const verticalB = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), {
        containerOrientation: "vertical",
        interactionMode: "dispatch"
      }),
      shellRect: { width: 220, height: 340 }
    });

    expect(dispatchBrg).not.toBe(dispatchTcpa);
    expect(passiveTcpa).not.toBe(dispatchTcpa);
    expect(verticalB).toBe(verticalA);
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/AisTargetTextHtmlWidget/AisTargetTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-ais-target-html");
    expect(css).not.toContain(".widgetContainer.vertical .widget.dyniplugin");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*7\s*\/\s*8/);
    expect(css).not.toMatch(/min-height.*8em/);
  });
});
