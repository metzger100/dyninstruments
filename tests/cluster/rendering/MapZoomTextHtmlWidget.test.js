const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("MapZoomTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const Helpers = {
      applyFormatter: opts.applyFormatter || function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) {
          return cfg.default;
        }
        if (cfg.formatter === "formatDecimalOpt") {
          return "Z:" + String(value);
        }
        return String(value);
      },
      resolveFontFamily: opts.resolveFontFamily || function () {
        return "sans-serif";
      },
      getModule: opts.getModule || function (id) {
        if (id === "MapZoomHtmlFit") {
          return loadFresh("shared/widget-kits/nav/MapZoomHtmlFit.js");
        }
        throw new Error("unexpected module lookup: " + id);
      }
    };
    return loadFresh("widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js").create({}, Helpers);
  }

  function createHostContext(options) {
    const opts = options || {};
    const capability = opts.capability || "dispatch";
    const checkAutoZoom = opts.checkAutoZoom || vi.fn(() => true);
    const shellSize = opts.shellSize;
    const hostContext = {
      hostActions: {
        getCapabilities: vi.fn(() => ({ map: { checkAutoZoom: capability } })),
        map: {
          checkAutoZoom: checkAutoZoom
        }
      }
    };
    if (shellSize && Number.isFinite(shellSize.width) && Number.isFinite(shellSize.height)) {
      hostContext.__dyniHostCommitState = {
        shellEl: {
          getBoundingClientRect: vi.fn(() => ({
            width: shellSize.width,
            height: shellSize.height
          }))
        },
        rootEl: null
      };
    }
    return hostContext;
  }

  function makeProps(overrides) {
    return Object.assign({
      caption: "ZOOM",
      unit: "",
      zoom: 12.2,
      requiredZoom: 11.9,
      default: "---"
    }, overrides || {});
  }

  function pickPx(html, className) {
    const marker = 'class="' + className + '"';
    const index = html.indexOf(marker);
    if (index < 0) {
      return 0;
    }
    const snippet = html.slice(index, index + 220);
    const match = snippet.match(/font-size:(\d+)px;/);
    return match ? Number(match[1]) : 0;
  }

  it("renders dispatch mode with catchAll and full-surface map zoom hotspot", function () {
    const renderer = createRenderer();
    const html = renderer.renderHtml.call(createHostContext({ capability: "dispatch" }), makeProps());

    expect(renderer.id).toBe("MapZoomTextHtmlWidget");
    expect(html).toContain("dyni-map-zoom-html");
    expect(html).toContain("dyni-map-zoom-open-dispatch");
    expect(html).toContain('onclick="catchAll"');
    expect(html).toContain('class="dyni-map-zoom-open-hotspot"');
    expect(html).toContain('onclick="mapZoomCheckAutoZoom"');
  });

  it("stays passive when map zoom dispatch capability is not available", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const hostContext = createHostContext({
      capability: "unsupported",
      checkAutoZoom: checkAutoZoom
    });
    const html = renderer.renderHtml.call(hostContext, makeProps());
    const handlers = renderer.namedHandlers({}, hostContext);

    expect(html).toContain("dyni-map-zoom-open-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain("dyni-map-zoom-open-hotspot");
    expect(handlers.mapZoomCheckAutoZoom()).toBe(false);
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });

  it("allows host click ownership in edit mode even when dispatch capability exists", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const hostContext = createHostContext({
      capability: "dispatch",
      checkAutoZoom: checkAutoZoom
    });
    const html = renderer.renderHtml.call(hostContext, makeProps({ editing: true }));
    const handlers = renderer.namedHandlers({ editing: true }, hostContext);

    expect(html).toContain("dyni-map-zoom-open-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain("dyni-map-zoom-open-hotspot");
    expect(handlers.mapZoomCheckAutoZoom()).toBe(false);
    expect(checkAutoZoom).not.toHaveBeenCalled();
  });

  it("dispatches host map.checkAutoZoom when capability is dispatch", function () {
    const renderer = createRenderer();
    const checkAutoZoom = vi.fn(() => true);
    const hostContext = createHostContext({
      capability: "dispatch",
      checkAutoZoom: checkAutoZoom
    });
    const handlers = renderer.namedHandlers({}, hostContext);

    expect(typeof handlers.mapZoomCheckAutoZoom).toBe("function");
    expect(handlers.mapZoomCheckAutoZoom()).toBe(true);
    expect(checkAutoZoom).toHaveBeenCalledTimes(1);
  });

  it("formats zoom text and renders required zoom in parentheses only when different", function () {
    const renderer = createRenderer();
    const hostContext = createHostContext({ capability: "dispatch" });
    const htmlWithRequired = renderer.renderHtml.call(hostContext, makeProps({
      zoom: 12.2,
      requiredZoom: 10.8
    }));
    const htmlWithoutRequired = renderer.renderHtml.call(hostContext, makeProps({
      zoom: 12.2,
      requiredZoom: 12.2
    }));

    expect(htmlWithRequired).toContain('class="dyni-map-zoom-value">Z:12.2</span>');
    expect(htmlWithRequired).toContain('class="dyni-map-zoom-required">(Z:10.8)</div>');
    expect(htmlWithoutRequired).not.toContain("dyni-map-zoom-required");
  });

  it("applies high and flat mode classes from shell ratio thresholds", function () {
    const renderer = createRenderer();
    const highHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 90, height: 200 } }),
      makeProps({ unit: "x" })
    );
    const flatHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 460, height: 100 } }),
      makeProps()
    );

    expect(highHtml).toContain("dyni-map-zoom-mode-high");
    expect(flatHtml).toContain("dyni-map-zoom-mode-flat");
  });

  it("renders mode-specific rows for flat and normal layouts", function () {
    const renderer = createRenderer();
    const flatHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 460, height: 100 } }),
      makeProps({ unit: "x" })
    );
    const normalHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 220, height: 100 } }),
      makeProps({ unit: "x" })
    );

    expect(flatHtml).toContain("dyni-map-zoom-main-flat");
    expect(flatHtml).toContain("dyni-map-zoom-inline-row");
    expect(flatHtml).not.toContain("dyni-map-zoom-caption-row");
    expect(flatHtml).not.toContain("dyni-map-zoom-value-row");

    expect(normalHtml).toContain("dyni-map-zoom-main-normal");
    expect(normalHtml).toContain("dyni-map-zoom-value-row");
    expect(normalHtml).toContain("dyni-map-zoom-caption-row");
    expect(normalHtml.indexOf("dyni-map-zoom-value-row")).toBeLessThan(normalHtml.indexOf("dyni-map-zoom-caption-row"));
  });

  it("keeps high mode with a non-empty unit and collapses high mode to normal when unit is empty", function () {
    const renderer = createRenderer();
    const highHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 90, height: 200 } }),
      makeProps({ unit: "x" })
    );
    const collapsedHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 90, height: 200 } }),
      makeProps({ unit: "" })
    );

    expect(highHtml).toContain("dyni-map-zoom-mode-high");
    expect(highHtml).toContain("dyni-map-zoom-main-high");
    expect(highHtml).toContain("dyni-map-zoom-caption-row");
    expect(highHtml).toContain("dyni-map-zoom-value-row");
    expect(highHtml).toContain("dyni-map-zoom-unit-row");

    expect(collapsedHtml).toContain("dyni-map-zoom-mode-normal");
    expect(collapsedHtml).toContain("dyni-map-zoom-main-normal");
    expect(collapsedHtml).not.toContain("dyni-map-zoom-mode-high");
    expect(collapsedHtml).not.toContain("dyni-map-zoom-unit-row");
  });

  it("renders required zoom row for finite different values including zero", function () {
    const renderer = createRenderer();
    const hostContext = createHostContext();
    const withZeroRequired = renderer.renderHtml.call(hostContext, makeProps({
      zoom: 12.2,
      requiredZoom: 0
    }));
    const withoutRequired = renderer.renderHtml.call(hostContext, makeProps({
      zoom: 12.2,
      requiredZoom: 12.2
    }));

    expect(withZeroRequired).toContain('class="dyni-map-zoom-required">(Z:0)</div>');
    expect(withoutRequired).not.toContain("dyni-map-zoom-required");
  });

  it("escapes caption/unit/value text and fails closed without default", function () {
    const renderer = createRenderer({
      applyFormatter: function () {
        return '<span class="unsafe">x</span>';
      }
    });
    const html = renderer.renderHtml.call(createHostContext(), makeProps({
      caption: "<ZOOM>",
      unit: '"deg"',
      zoom: 12.1,
      requiredZoom: 11.7
    }));

    expect(html).toContain("&lt;ZOOM&gt;");
    expect(html).toContain("&quot;deg&quot;");
    expect(html).toContain("&lt;span class=&quot;unsafe&quot;&gt;x&lt;/span&gt;");
    expect(html).not.toContain('<span class="unsafe">x</span>');

    expect(function () {
      renderer.renderHtml.call(createHostContext(), { caption: "ZOOM" });
    }).toThrow("props.default is required");
  });

  it("updates resize signature for layout-relevant changes and triggers resize during init", function () {
    const renderer = createRenderer();
    const hostContext = createHostContext({ shellSize: { width: 300, height: 100 } });
    const baseProps = makeProps();

    const sigBase = renderer.resizeSignature.call(hostContext, baseProps);
    const sigSame = renderer.resizeSignature.call(hostContext, makeProps());
    const sigCaption = renderer.resizeSignature.call(hostContext, makeProps({ caption: "ZOOM EXT" }));
    const sigRequired = renderer.resizeSignature.call(hostContext, makeProps({ requiredZoom: 8.1 }));
    const sigScale = renderer.resizeSignature.call(hostContext, makeProps({ captionUnitScale: 1.1 }));

    expect(sigSame).toBe(sigBase);
    expect(sigCaption).not.toBe(sigBase);
    expect(sigRequired).not.toBe(sigBase);
    expect(sigScale).not.toBe(sigBase);

    const triggerResize = vi.fn();
    renderer.initFunction.call({ triggerResize: triggerResize });
    expect(triggerResize).toHaveBeenCalledTimes(1);
  });

  it("emits captionUnitScale as inline CSS custom property with default fallback", function () {
    const renderer = createRenderer();
    const defaultHtml = renderer.renderHtml.call(createHostContext(), makeProps());
    const customHtml = renderer.renderHtml.call(createHostContext(), makeProps({ captionUnitScale: 1.1 }));

    expect(defaultHtml).toContain('--dyni-map-zoom-sec-scale:0.8;');
    expect(customHtml).toContain('--dyni-map-zoom-sec-scale:1.1;');
  });

  it("scales caption and value independently when space is tight", function () {
    const renderer = createRenderer();
    const largeHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 320, height: 120 } }),
      makeProps({
        unit: "x",
        caption: "ZOOM CAPTION VERY LONG",
        zoom: 123456.789
      })
    );
    const smallHtml = renderer.renderHtml.call(
      createHostContext({ shellSize: { width: 120, height: 80 } }),
      makeProps({
        unit: "x",
        caption: "ZOOM CAPTION VERY LONG",
        zoom: 123456.789
      })
    );

    const largeCaptionPx = pickPx(largeHtml, "dyni-map-zoom-caption");
    const largeValuePx = pickPx(largeHtml, "dyni-map-zoom-value");
    const smallCaptionPx = pickPx(smallHtml, "dyni-map-zoom-caption");
    const smallValuePx = pickPx(smallHtml, "dyni-map-zoom-value");

    expect(largeCaptionPx).toBeGreaterThan(0);
    expect(largeValuePx).toBeGreaterThan(0);
    expect(smallCaptionPx).toBeGreaterThan(0);
    expect(smallValuePx).toBeGreaterThan(0);
    expect(smallCaptionPx).toBeLessThan(largeCaptionPx);
    expect(smallValuePx).toBeLessThan(largeValuePx);
    expect(smallCaptionPx).not.toBe(smallValuePx);
  });

  it("caps caption and unit fit against captionUnitScale while keeping adaptive downscaling", function () {
    const renderer = createRenderer();
    const shell = createHostContext({ shellSize: { width: 320, height: 120 } });

    const defaultScaleHtml = renderer.renderHtml.call(shell, makeProps({
      unit: "units",
      caption: "ZOOM CAPTION VERY LONG",
      zoom: 123456.789
    }));
    const customScaleHtml = renderer.renderHtml.call(shell, makeProps({
      unit: "units",
      caption: "ZOOM CAPTION VERY LONG",
      zoom: 123456.789,
      captionUnitScale: 1.1
    }));

    const valuePxDefault = pickPx(defaultScaleHtml, "dyni-map-zoom-value");
    const captionPxDefault = pickPx(defaultScaleHtml, "dyni-map-zoom-caption");
    const unitPxDefault = pickPx(defaultScaleHtml, "dyni-map-zoom-unit");
    const valuePxCustom = pickPx(customScaleHtml, "dyni-map-zoom-value");
    const captionPxCustom = pickPx(customScaleHtml, "dyni-map-zoom-caption");
    const unitPxCustom = pickPx(customScaleHtml, "dyni-map-zoom-unit");

    expect(valuePxDefault).toBeGreaterThan(0);
    expect(captionPxDefault).toBeGreaterThan(0);
    expect(unitPxDefault).toBeGreaterThan(0);
    expect(valuePxCustom).toBeGreaterThan(0);
    expect(captionPxCustom).toBeGreaterThan(0);
    expect(unitPxCustom).toBeGreaterThan(0);

    expect(captionPxDefault).toBeLessThanOrEqual(Math.floor(valuePxDefault * 0.8));
    expect(unitPxDefault).toBeLessThanOrEqual(Math.floor(valuePxDefault * 0.8));
    expect(captionPxCustom).toBeLessThanOrEqual(Math.floor(valuePxCustom * 1.1));
    expect(unitPxCustom).toBeLessThanOrEqual(Math.floor(valuePxCustom * 1.1));
  });

  it("keeps navpage sizing guard and caption full-foreground css contract", function () {
    const cssPath = path.join(
      process.cwd(),
      "widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.css"
    );
    const css = fs.readFileSync(cssPath, "utf8");
    const captionBlockMatch = css.match(/\.dyni-map-zoom-caption\s*\{([\s\S]*?)\}/);

    expect(css).toContain("#navpage .widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell .dyni-map-zoom-html");
    expect(css).toContain("aspect-ratio: 2 / 1;");
    expect(css).toContain("min-height: 4.8em;");
    expect(captionBlockMatch).toBeTruthy();
    expect(captionBlockMatch[1]).toContain("color: inherit;");
    expect(captionBlockMatch[1]).not.toContain("opacity:");
  });
});
