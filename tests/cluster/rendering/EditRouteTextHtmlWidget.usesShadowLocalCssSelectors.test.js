// @ts-check
const { fs, path } = require("./EditRouteTextHtmlWidget-setup");

describe("EditRouteTextHtmlWidget", function () {
  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-edit-route-html");
    expect(css).not.toContain(".widgetContainer.vertical .widget.dyniplugin");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*7\s*\/\s*8/);
    expect(css).not.toMatch(/min-height.*8em/);
    expect(css).toContain("padding: 0.08em 0.12em;");
    expect(css).toContain("gap: 0.08em;");
    expect(css).toContain("row-gap: 0.04em;");
    expect(css).not.toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(css).toContain("grid-template-rows: minmax(0, 0.34fr) minmax(0, 0.66fr);");
    expect(css).toContain("align-content: stretch;");
    expect(css).toContain("flex: 0 1 auto;");
    expect(css).toContain("flex: 0 0 auto;");
    expect(css).not.toContain("overflow: hidden;");
  });

  it("keeps metric row fractions and shrink guards in css", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    const labelBlockPattern = /\.dyni-html-root \.dyni-edit-route-metric-label \{[\s\S]*?min-height: 0\x3b/;
    const valueBlockPattern = /\.dyni-html-root \.dyni-edit-route-metric-value \{[\s\S]*?min-height: 0\x3b/;
    expect(css).toMatch(labelBlockPattern);
    expect(css).toMatch(valueBlockPattern);
    expect(css).not.toContain("overflow: hidden;");
  });
});
