// @ts-check
const { fs, path } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-route-points-html");
    expect(css).toContain('.dyni-html-root[data-dyni-orientation="vertical"] .dyni-route-points-html');
    expect(css).toMatch(
      /\.dyni-html-root\[data-dyni-orientation="vertical"\] \.dyni-route-points-html \{[\s\S]*max-height:\s*calc\(60vh\);/
    );
    const hostBlockMatch = css.match(/:host \{([^}]*)\}/);
    expect(hostBlockMatch).not.toBeNull();
    const hostBlock = hostBlockMatch ? hostBlockMatch[1] : "";
    expect(hostBlock).toContain("height: auto;");
    expect(hostBlock).toContain("display: flex;");
    expect(hostBlock).toContain("flex-direction: column;");
    expect(hostBlock).toContain("min-height: 0;");
    expect(hostBlock).not.toContain("max-height:");
    expect(css).not.toContain(".widgetContainer.vertical .widget.dyniplugin");
  });
});
