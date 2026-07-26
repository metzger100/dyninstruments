// @ts-check
const { createRenderer } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("derives layout signature from model resizeSignatureParts", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({
      hostContext: {},
      mountEl: null,
      shadowRoot: null
    });

    const sigA = committed.layoutSignature({
      props: { __token: "A" },
      shellRect: { width: 300, height: 160 }
    });
    const sigB = committed.layoutSignature({
      props: { __token: "B" },
      shellRect: { width: 300, height: 160 }
    });

    expect(sigB).not.toBe(sigA);
  });
});
