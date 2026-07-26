// @ts-check
const { fs, path } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-map-zoom-html");
    expect(css).not.toContain("#navpage .widgetContainer.vertical");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*2\s*\/\s*1/);
    expect(css).not.toMatch(/min-height.*4\.8em/);
  });
});
