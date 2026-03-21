const { loadFresh } = require("../../helpers/load-umd");

describe("ActiveRouteTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const fitCompute = opts.fitCompute || vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: { valueStyle: "font-size:18px;", unitStyle: "font-size:11px;" },
          eta: { valueStyle: "font-size:17px;", unitStyle: "font-size:10px;" },
          next: { valueStyle: "font-size:16px;", unitStyle: "font-size:9px;" }
        }
      };
    });
    const fitService = {
      compute: fitCompute
    };
    const Helpers = {
      applyFormatter: opts.applyFormatter || function (value, options) {
        const cfg = options || {};
        const formatter = cfg.formatter;
        const params = Array.isArray(cfg.formatterParameters) ? cfg.formatterParameters : [];
        if (value == null) {
          return cfg.default;
        }
        if (formatter === "formatDistance") {
          return "DIST:" + String(value) + ":" + String(params[0] || "");
        }
        if (formatter === "formatTime") {
          return "TIME:" + String(value);
        }
        if (formatter === "formatDirection") {
          return "DIR:" + String(value);
        }
        return String(value);
      },
      getModule: function (id) {
        if (id === "ActiveRouteHtmlFit") {
          return {
            create: function () {
              return fitService;
            }
          };
        }
        throw new Error("Unknown module requested: " + id);
      }
    };

    return {
      renderer: loadFresh("widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js").create({}, Helpers),
      fitCompute: fitCompute
    };
  }

  function createHostContext(options) {
    const opts = options || {};
    const openActiveRoute = opts.openActiveRoute || vi.fn(() => true);
    const capability = opts.capability || "dispatch";
    const shellSize = opts.shellSize;
    const hostContext = {
      hostActions: {
        getCapabilities: vi.fn(() => ({ routeEditor: { openActiveRoute: capability } })),
        routeEditor: {
          openActiveRoute: openActiveRoute
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

  function escapeForRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function expectMetricValueRow(html, metricId, valueText, unitText) {
    expect(html).toContain('class="dyni-active-route-metric dyni-active-route-metric-' + metricId + '"');
    expect(html).toMatch(new RegExp('class="dyni-active-route-metric-value"[^>]*>' + escapeForRegExp(valueText) + "</span>"));
    expect(html).toMatch(new RegExp('class="dyni-active-route-metric-unit"[^>]*>' + escapeForRegExp(unitText) + "</span>"));
  }

  function makeProps(overrides) {
    return Object.assign({
      routeName: "Harbor Run",
      disconnect: false,
      display: {
        remain: 12.4,
        eta: "2026-03-06T11:45:00Z",
        nextCourse: 93,
        isApproaching: true
      },
      captions: {
        remain: "RTE",
        eta: "ETA",
        nextCourse: "NEXT"
      },
      units: {
        remain: "nm",
        eta: "",
        nextCourse: "deg"
      },
      default: "---"
    }, overrides || {});
  }

  it("renders interactive html with catchAll wrapper and full-surface activeRouteOpen hotspot", function () {
    const setup = createRenderer();
    const renderer = setup.renderer;
    const hostContext = createHostContext({ capability: "dispatch" });
    const html = renderer.renderHtml.call(hostContext, makeProps());

    expect(renderer.id).toBe("ActiveRouteTextHtmlWidget");
    expect(html).toContain("dyni-active-route-html");
    expect(html).toContain("dyni-active-route-approaching");
    expect(html).toContain("dyni-active-route-open-dispatch");
    expect(html).toContain("dyni-active-route-mode-normal");
    expect(html).toContain('onclick="catchAll"');
    expect(html).toContain('class="dyni-active-route-open-hotspot"');
    expect(html).toContain('onclick="activeRouteOpen"');
    expect(html).not.toContain("dyni-active-route-open-action");
    expect(html).not.toContain("data-dyni-active-route");
    expect(html).not.toContain("data-dyni-disconnect");
    expect(html).not.toContain("data-dyni-open-state");
    expect(html).not.toContain("data-dyni-action");
    expect(html).toMatch(/class="dyni-active-route-route-name"[^>]*>Harbor Run<\/div>/);
    expectMetricValueRow(html, "remain", "DIST:12.4:nm", "nm");
    expectMetricValueRow(html, "eta", "TIME:2026-03-06T11:45:00Z", "");
    expectMetricValueRow(html, "next", "DIR:93", "deg");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
  });

  it("marks open action as passive when host capability is not dispatch", function () {
    const renderer = createRenderer().renderer;
    const openActiveRoute = vi.fn(() => true);
    const hostContext = createHostContext({
      capability: "passive",
      openActiveRoute: openActiveRoute
    });
    const html = renderer.renderHtml.call(hostContext, makeProps({
      display: {
        remain: 12.4,
        eta: "2026-03-06T11:45:00Z",
        nextCourse: 93,
        isApproaching: false
      }
    }));

    expect(html).toContain("dyni-active-route-open-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain("dyni-active-route-open-hotspot");
    expect(html).not.toContain('onclick="activeRouteOpen"');
    expect(html).not.toContain("dyni-active-route-metric-next");
    expect(html).not.toContain("DIR:93");

    const handlers = renderer.namedHandlers({}, hostContext);
    expect(handlers.activeRouteOpen()).toBe(false);
    expect(openActiveRoute).not.toHaveBeenCalled();
  });

  it("dispatches openActiveRoute only when capability is dispatch", function () {
    const renderer = createRenderer().renderer;
    const openActiveRoute = vi.fn(() => true);
    const hostContext = createHostContext({
      capability: "dispatch",
      openActiveRoute: openActiveRoute
    });
    const handlers = renderer.namedHandlers({}, hostContext);

    expect(typeof handlers.activeRouteOpen).toBe("function");
    expect(handlers.activeRouteOpen()).toBe(true);
    expect(openActiveRoute).toHaveBeenCalledTimes(1);
  });

  it("allows host click handling in edit mode even when route-open capability is dispatch", function () {
    const renderer = createRenderer().renderer;
    const openActiveRoute = vi.fn(() => true);
    const hostContext = createHostContext({
      capability: "dispatch",
      openActiveRoute: openActiveRoute
    });
    const html = renderer.renderHtml.call(hostContext, makeProps({ editing: true }));

    expect(html).toContain("dyni-active-route-open-passive");
    expect(html).not.toContain('onclick="catchAll"');
    expect(html).not.toContain("dyni-active-route-open-hotspot");
    expect(html).not.toContain('onclick="activeRouteOpen"');

    const handlers = renderer.namedHandlers({ editing: true }, hostContext);
    expect(handlers.activeRouteOpen()).toBe(false);
    expect(openActiveRoute).not.toHaveBeenCalled();
  });

  it("marks disconnect state and uses default placeholders through formatter contract", function () {
    const applyFormatter = vi.fn(function (value, options) {
      return value == null ? options.default : String(value);
    });
    const renderer = createRenderer({ applyFormatter: applyFormatter }).renderer;
    const html = renderer.renderHtml.call(createHostContext(), makeProps({ disconnect: true }));

    expect(html).toContain("dyni-active-route-disconnect");
    expect(html).toContain(">---</span>");
    expect(applyFormatter).toHaveBeenCalledWith(undefined, expect.objectContaining({ formatter: "formatDistance", default: "---" }));
    expect(applyFormatter).toHaveBeenCalledWith(undefined, expect.objectContaining({ formatter: "formatTime", default: "---" }));
    expect(applyFormatter).toHaveBeenCalledWith(undefined, expect.objectContaining({ formatter: "formatDirection", default: "---" }));
  });

  it("updates resize signature only when layout-relevant text/state changes", function () {
    const renderer = createRenderer().renderer;
    const hostContext = createHostContext();
    const base = makeProps();

    const sigBase = renderer.resizeSignature.call(hostContext, base);
    const sigSame = renderer.resizeSignature.call(hostContext, Object.assign({}, base));
    const sigName = renderer.resizeSignature.call(hostContext, makeProps({ routeName: "Harbor Run Extended" }));
    const sigDisconnect = renderer.resizeSignature.call(hostContext, makeProps({ disconnect: true }));
    const sigApproach = renderer.resizeSignature.call(hostContext, makeProps({
      display: {
        remain: 12.4,
        eta: "2026-03-06T11:45:00Z",
        nextCourse: 93,
        isApproaching: false
      }
    }));

    expect(sigSame).toBe(sigBase);
    expect(sigName).not.toBe(sigBase);
    expect(sigDisconnect).not.toBe(sigBase);
    expect(sigApproach).not.toBe(sigBase);
  });

  it("assigns high mode class when shell ratio is below the high threshold", function () {
    const renderer = createRenderer().renderer;
    const hostContext = createHostContext({ shellSize: { width: 100, height: 220 } });
    const html = renderer.renderHtml.call(hostContext, makeProps());
    expect(html).toContain("dyni-active-route-mode-high");
  });

  it("assigns flat mode class when shell ratio is above the flat threshold", function () {
    const renderer = createRenderer().renderer;
    const hostContext = createHostContext({ shellSize: { width: 500, height: 100 } });
    const html = renderer.renderHtml.call(hostContext, makeProps());
    expect(html).toContain("dyni-active-route-mode-flat");
  });

  it("keeps normal mode in vertical panel even when shell ratio is above the flat threshold", function () {
    const renderer = createRenderer().renderer;
    const hostContext = createHostContext({ shellSize: { width: 500, height: 100 } });
    const html = renderer.renderHtml.call(hostContext, makeProps({ mode: "vertical" }));
    expect(html).toContain("dyni-active-route-mode-normal");
    expect(html).not.toContain("dyni-active-route-mode-flat");
  });

  it("applies computed fit styles for route and metric values without ellipsis content", function () {
    const fitCompute = vi.fn(function () {
      return {
        routeNameStyle: "font-size:8px;",
        metrics: {
          remain: { valueStyle: "font-size:7px;", unitStyle: "font-size:6px;" },
          eta: { valueStyle: "font-size:6px;", unitStyle: "" },
          next: { valueStyle: "font-size:5px;", unitStyle: "font-size:4px;" }
        }
      };
    });
    const renderer = createRenderer({ fitCompute: fitCompute }).renderer;
    const html = renderer.renderHtml.call(createHostContext(), makeProps({
      routeName: "Very Long Route Name Alpha Bravo Charlie Delta Echo Foxtrot"
    }));

    expect(html).toMatch(/class="dyni-active-route-route-name" style="font-size:8px;">Very Long Route Name/);
    expect(html).toContain('class="dyni-active-route-metric-value" style="font-size:7px;"');
    expect(html).toContain('class="dyni-active-route-metric-unit" style="font-size:6px;"');
    expect(html).not.toContain("...");
    expect(fitCompute).toHaveBeenCalledTimes(1);
  });

  it("escapes route and metric text content", function () {
    const renderer = createRenderer({
      applyFormatter: function () {
        return '<span class="unsafe">x</span>';
      }
    }).renderer;
    const html = renderer.renderHtml.call(createHostContext(), {
      routeName: '<img src=x onerror=alert(1)>',
      display: {
        remain: 12,
        eta: 34,
        nextCourse: 56,
        isApproaching: true
      },
      captions: {
        remain: "<RTE>",
        eta: '"ETA"',
        nextCourse: "'NEXT'"
      },
      units: {
        remain: "<nm>",
        eta: '"h"',
        nextCourse: "'deg'"
      },
      default: "---"
    });

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&lt;RTE&gt;");
    expect(html).toContain("&quot;ETA&quot;");
    expect(html).toContain("&#39;NEXT&#39;");
    expect(html).toContain("&lt;span class=&quot;unsafe&quot;&gt;x&lt;/span&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).not.toContain('<span class="unsafe">x</span>');
  });

  it("fails closed when required active-route props are missing", function () {
    const renderer = createRenderer().renderer;
    expect(function () {
      renderer.renderHtml.call(createHostContext(), { default: "---" });
    }).toThrow("props.display is required");
  });
});
