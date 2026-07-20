const {
  toTimerSeconds,
  buildRenderer,
  makeProps,
  withSurfacePolicy,
  createMountedRenderer,
  installFakeTimerHooks
} = require("./RegattaTimerTextHtmlWidget.harness.js");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

installFakeTimerHooks();

describe("RegattaTimerTextHtmlWidget", function () {
  it("resolves route metadata, preload assets, and inert pre-commit shell for regattaTimer", function () {
    const routeContext = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: {
          clusterRoutes: { routes: [] }
        }
      }
    });
    runIifeScript("config/cluster-routes/vessel.js", routeContext);

    const route = routeContext.DyniPlugin.config.clusterRoutes.routes.find(
      /** @param {any} entry */
      function (entry) {
        return entry.cluster === "vessel" && entry.kind === "regattaTimer";
      }
    );

    expect(route).toEqual({
      cluster: "vessel",
      kind: "regattaTimer",
      mapperId: "VesselMapper",
      rendererId: "RegattaTimerTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    });

    const registryContext = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {} }
      }
    });
    runIifeScript("config/components/registry-widgets-vessel.js", registryContext);
    const widgets = registryContext.DyniPlugin.config.shared.componentRegistryGroups.widgets;
    const component = widgets.RegattaTimerTextHtmlWidget;

    expect(component).toBeTruthy();
    expect(component.globalKey).toBe("DyniRegattaTimerTextHtmlWidget");
    expect(Array.isArray(component.shadowCss)).toBe(true);
    expect(component.shadowCss).toEqual([
      "http://host/plugins/dyninstruments/shared/html/HtmlShadowCommon.css",
      "http://host/plugins/dyninstruments/widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.css"
    ]);
    const context = createScriptContext({
      DyniPlugin: { runtime: {}, state: {}, config: {} }
    });
    runIifeScript("runtime/cluster/ClusterShellRenderer.js", context);

    const html = context.DyniPlugin.runtime.clusterShellRenderer.renderRouteShell(
      {
        cluster: "vessel",
        kind: "regattaTimer",
        __dyniRouteId: "vessel/regattaTimer",
        __dyniRawProps: {}
      },
      {
        surface: "html",
        shellSizing: { kind: "ratio", aspectRatio: 2 }
      },
      "test-instance",
      {}
    );

    expect(html).toContain(
      'class="widgetData dyni-shell dyni-surface-html dyni-kind-regattaTimer dyni-cluster-vessel"'
    );
    expect(html).toContain(
      '<div class="dyni-surface-html"><div class="dyni-surface-html-mount" data-dyni-html-mount="1"></div></div>'
    );
    expect(html).not.toContain("dyni-regatta-html");
    expect(html).not.toContain("dyni-regatta-time");
  });

  it("mounts idle markup and transitions across countdown, sync, elapsed, and reset", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    expect(mounted.html()).toContain("dyni-regatta-phase-idle");
    expect(mounted.html()).toContain("05:00");
    expect(mounted.html()).toContain("dyni-regatta-bar");

    mounted.clickAction("regatta-start");
    expect(mounted.audioEngine.ensureContext).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    mounted.update(withSurfacePolicy(makeProps({ regattaDuration: 6 }), "dispatch"));
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(mounted.html()).not.toContain("06:00");

    vi.advanceTimersByTime(35000);
    expect(mounted.html()).toContain("04:25");
    mounted.clickAction("regatta-sync");
    expect(mounted.html()).toContain("04:00");

    vi.advanceTimersByTime(240000);
    expect(mounted.html()).toContain("dyni-regatta-phase-elapsed");
    expect(mounted.html()).toContain("00:00");

    mounted.clickAction("regatta-reset");
    expect(mounted.html()).toContain("dyni-regatta-phase-idle");
    expect(mounted.html()).toContain("05:00");
  });

  it("keeps listeners in dispatch mode, suppresses wrapper blank-space clicks, and stays passive otherwise", function () {
    const dispatchMounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    const parentClick = vi.fn();
    dispatchMounted.mountEl.addEventListener("click", parentClick);
    const wrapper = /** @type {HTMLElement} */ (dispatchMounted.wrapper());
    const blankSpaceEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true
    });
    const dispatchResult = wrapper.dispatchEvent(blankSpaceEvent);

    expect(wrapper.className).toContain("dyni-regatta-open-dispatch");
    expect(dispatchResult).toBe(false);
    expect(parentClick).not.toHaveBeenCalled();
    expect(blankSpaceEvent.defaultPrevented).toBe(true);

    dispatchMounted.clickAction("regatta-start");
    expect(dispatchMounted.html()).toContain("dyni-regatta-phase-countdown");

    const passiveMounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "passive")
    });
    expect(/** @type {HTMLElement} */ (passiveMounted.wrapper()).className).toContain("dyni-regatta-open-passive");
    passiveMounted.clickAction("regatta-start");
    expect(passiveMounted.html()).toContain("dyni-regatta-phase-idle");
  });

  it("preserves active countdown across detach/remount on the same hostContext", function () {
    const sharedHostContext = {};
    const mounted = createMountedRenderer({
      hostContext: sharedHostContext,
      props: withSurfacePolicy(makeProps(), "dispatch"),
      shellSize: { width: 260, height: 130 }
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(35000);
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(mounted.timeText()).toBe("04:25");

    mounted.committed.detach();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      hostContext: sharedHostContext,
      props: withSurfacePolicy(makeProps(), "dispatch"),
      shellSize: { width: 260, height: 130 }
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(remounted.timeText()).toBe("04:20");
    expect(remounted.html()).not.toContain("05:00");
  });

  it("restores active countdown after remount with a new hostContext using stable route identity", function () {
    const props = withSurfacePolicy(makeProps(), {
      mode: "dispatch",
      pageId: "regattapage",
      routeId: "vessel/regattaTimer"
    });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props,
      shellSize: { width: 260, height: 130 }
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(35000);
    expect(mounted.timeText()).toBe("04:25");
    mounted.committed.detach();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props,
      shellSize: { width: 260, height: 130 }
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(remounted.timeText()).toBe("04:20");
    expect(remounted.html()).not.toContain("05:00");
  });

  it("restores to elapsed mode when remounted after countdown end with a new hostContext", function () {
    const props = withSurfacePolicy(makeProps(), {
      mode: "dispatch",
      pageId: "regattapage",
      routeId: "vessel/regattaTimer"
    });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(299000);
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    mounted.committed.destroy();
    vi.advanceTimersByTime(3000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-elapsed");
    expect(remounted.html()).not.toContain("dyni-regatta-phase-idle");
    expect(remounted.html()).not.toContain("05:00");
  });

  it("restores active countdown after destroy/remount with a new hostContext", function () {
    const props = withSurfacePolicy(makeProps(), {
      mode: "dispatch",
      pageId: "regattapage",
      routeId: "vessel/regattaTimer"
    });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(45000);
    expect(mounted.timeText()).toBe("04:15");
    mounted.committed.destroy();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(remounted.timeText()).toBe("04:10");
  });

  it("reset clears persisted timer session across new hostContext remount", function () {
    const props = withSurfacePolicy(makeProps(), {
      mode: "dispatch",
      pageId: "regattapage",
      routeId: "vessel/regattaTimer"
    });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(45000);
    mounted.clickAction("regatta-reset");
    expect(mounted.html()).toContain("dyni-regatta-phase-idle");
    expect(mounted.timeText()).toBe("05:00");
    mounted.committed.destroy();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-idle");
    expect(remounted.timeText()).toBe("05:00");
  });

  it("keeps active countdown running when shellRect changes during update", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch"),
      shellSize: { width: 240, height: 120 }
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(31000);
    const beforeResizeText = mounted.timeText();
    const beforeResizeSeconds = toTimerSeconds(beforeResizeText);
    expect(beforeResizeText).toBe("04:29");

    mounted.update(mounted.currentProps, { width: 320, height: 120 });
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");

    const afterResizeText = mounted.timeText();
    const afterResizeSeconds = toTimerSeconds(afterResizeText);
    expect(afterResizeSeconds).toBeLessThanOrEqual(beforeResizeSeconds);
    expect(afterResizeText).not.toBe("05:00");
  });

  it("keeps stable digits off by default and enables dyni-tabular only when configured", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({ stableDigits: false }), "dispatch")
    });
    const initialTime = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-regatta-time"));
    expect(initialTime.classList.contains("dyni-tabular")).toBe(false);

    mounted.update(withSurfacePolicy(makeProps({ stableDigits: true }), "dispatch"));
    const tabularTime = /** @type {HTMLElement} */ (mounted.mountEl.querySelector(".dyni-regatta-time"));
    expect(tabularTime.classList.contains("dyni-tabular")).toBe(true);
  });
});
