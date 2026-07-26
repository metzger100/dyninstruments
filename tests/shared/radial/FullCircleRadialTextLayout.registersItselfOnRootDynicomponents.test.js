// @ts-check
const {
  createComponentContextMock,
  createHarness,
  createScriptContext,
  loadFresh,
  makeDualDisplay,
  makeSingleDisplay,
  runIifeScript
} = require("./FullCircleRadialTextLayout-setup");

describe("FullCircleRadialTextLayout high mode and compact fallback", function () {
  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("shared/widget-kits/radial/FullCircleRadialTextLayout.js", context);

    expect(context.DyniComponents.DyniFullCircleRadialTextLayout.id).toBe("FullCircleRadialTextLayout");
  });

  it("draws single high-mode text into the top slot by default and the bottom slot when requested", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();

    layout.drawSingleModeText(harness.state, "high", makeSingleDisplay(), { slot: "top" });
    layout.drawSingleModeText(harness.state, "high", makeSingleDisplay(), { slot: "bottom" });

    expect(harness.calls.inline).toHaveLength(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.inline[0].x).toBe(harness.state.slots.top.x);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.inline[1].x).toBe(harness.state.slots.bottom.x);
  });

  it("draws dual high-mode text into the top and bottom slots for the mirrored pair", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();
    const display = makeDualDisplay();

    layout.drawDualModeText(harness.state, "high", display.left, display.right);

    expect(harness.calls.inline).toHaveLength(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.inline[0].caption).toBe(display.left.caption);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.inline[0].x).toBe(harness.state.slots.top.x);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.inline[1].caption).toBe(display.right.caption);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.inline[1].x).toBe(harness.state.slots.bottom.x);
  });

  it("falls back to the compact single center row once safeRadius shrinks to the degenerate floor", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness({ layout: { normal: { safeRadius: 1, compactCenterHeight: 14 } } });

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(harness.calls.valueUnit).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.valueUnit[0].h).toBe(14);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.valueUnit[0].align).toBe("center");
  });

  it("falls back to the compact dual rows once safeRadius shrinks to the degenerate floor", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness({
      layout: {
        normal: {
          safeRadius: 1,
          dualCompactWidth: 120,
          dualCompactInset: 5,
          dualCompactHeight: 55
        }
      }
    });
    const display = makeDualDisplay();

    layout.drawDualModeText(harness.state, "normal", display.left, display.right);

    expect(harness.calls.threeRows).toHaveLength(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.threeRows[0].align).toBe("right");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.threeRows[1].align).toBe("left");
  });

  it("reuses the cached block measurement on a repeat render with the same box and display", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();
    let fitTextPxCalls = 0;
    const originalFitTextPx = harness.state.text.fitTextPx;
    harness.state.text.fitTextPx = function () {
      fitTextPxCalls += 1;
      // @ts-ignore -- pre-existing untyped test mock boundary
      return originalFitTextPx.apply(this, arguments);
    };

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());
    const callsAfterFirstRender = fitTextPxCalls;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(fitTextPxCalls).toBe(callsAfterFirstRender);
    expect(harness.calls.threeRows).toHaveLength(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.threeRows[1].w).toBe(harness.calls.threeRows[0].w);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.threeRows[1].sizes).toEqual(harness.calls.threeRows[0].sizes);
  });
});
