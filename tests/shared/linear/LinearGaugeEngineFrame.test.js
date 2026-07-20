const { loadFresh } = require("../../helpers/load-umd");

describe("LinearGaugeEngineFrame", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/linear/LinearGaugeEngineFrame.js");
    return mod.create();
  }

  /** @returns {any} */
  function createDrawingSpy() {
    return {
      calls: { pointer: /** @type {any[]} */ ([]), marker: /** @type {any[]} */ ([]) },
      /** @param {any} ctx @param {any} state @param {any} layout @param {any} theme @param {any} primitives @param {any} mapValueToX @param {any} valueNum @param {any} depthBase @param {any} sizeBase @param {any} opts */
      drawPointerAtValue(ctx, state, layout, theme, primitives, mapValueToX, valueNum, depthBase, sizeBase, opts) {
        this.calls.pointer.push({ valueNum, depthBase, sizeBase, opts });
      },
      /** @param {any} ctx @param {any} state @param {any} layout @param {any} theme @param {any} primitives @param {any} mapValueToX @param {any} valueNum @param {any} sizeBase @param {any} opts */
      drawMarkerAtValue(ctx, state, layout, theme, primitives, mapValueToX, valueNum, sizeBase, opts) {
        this.calls.marker.push({ valueNum, sizeBase, opts });
      }
    };
  }

  /** @param {string} mode @returns {any} */
  function createState(mode) {
    return {
      mode: mode,
      /** @param {any} v */
      mapValueToX: function (v) {
        return v;
      },
      layout: { inlineBox: { x: 0, y: 0, w: 10, h: 10 } }
    };
  }

  /** @returns {any} */
  function createTextLayoutSpy() {
    return {
      calls: {
        caption: /** @type {any[]} */ ([]),
        valueUnit: /** @type {any[]} */ ([]),
        inline: /** @type {any[]} */ ([])
      },
      /** @param {any} state @param {any} text @param {any} caption @param {any} box @param {any} secScale @param {any} align */
      drawCaptionRow(state, text, caption, box, secScale, align) {
        this.calls.caption.push({ caption, box, secScale, align });
      },
      /** @param {any} state @param {any} text @param {any} valueText @param {any} unit @param {any} box @param {any} secScale @param {any} align */
      drawValueUnitRow(state, text, valueText, unit, box, secScale, align) {
        this.calls.valueUnit.push({ valueText, unit, box, secScale, align });
      },
      /** @param {any} state @param {any} text @param {any} caption @param {any} valueText @param {any} unit @param {any} box @param {any} secScale */
      drawInlineRow(state, text, caption, valueText, unit, box, secScale) {
        this.calls.inline.push({ caption, valueText, unit, box, secScale });
      }
    };
  }

  /** @param {any} [overrides] @returns {any} */
  function createLayerCacheSpy(overrides) {
    return Object.assign(
      {
        calls: /** @type {any[]} */ ([]),
        /** @param {any} ctx @param {any} layerName */
        blitLayer(ctx, layerName) {
          this.calls.push(layerName);
        }
      },
      overrides
    );
  }

  /** @param {any} [overrides] @returns {any} */
  function baseDeps(overrides) {
    const drawing = createDrawingSpy();
    const textLayout = createTextLayoutSpy();
    const layerCache = createLayerCacheSpy();
    return Object.assign(
      {
        layout: { pointerSide: 8 },
        theme: { colors: { pointer: "#f00" } },
        primitives: {},
        drawing: drawing,
        easedDisplayNum: 5,
        pointerDepthBase: 4,
        markerSizeBase: 6,
        cfg: {},
        p: {},
        displayState: { caption: "CAP" },
        hookApi: { hook: true },
        text: {},
        textLayout: textLayout,
        valueText: "5.0",
        unit: "kn",
        rowBoxes: { captionBox: { x: 0, y: 0, w: 1, h: 1 }, valueBox: { x: 0, y: 1, w: 1, h: 1 } },
        secScale: 1,
        layerCache: layerCache,
        springMotion: { isActive: () => false }
      },
      overrides
    );
  }

  it("draws the default pointer at the eased display value when cfg.drawFrame is absent", function () {
    const frame = create();
    const deps = baseDeps();
    const state = createState("high");

    frame.renderFrame({}, state, {}, deps);

    expect(deps.drawing.calls.pointer).toHaveLength(1);
    expect(deps.drawing.calls.pointer[0].valueNum).toBe(5);
    expect(deps.drawing.calls.pointer[0].depthBase).toBe(4);
    expect(deps.drawing.calls.pointer[0].sizeBase).toBe(6);
  });

  it("invokes cfg.drawFrame with state, props, display and a merged hook+draw api instead of the default pointer", function () {
    const frame = create();
    let received = /** @type {any} */ (null);
    const deps = baseDeps({
      p: { foo: "bar" },
      cfg: {
        /** @param {any} state @param {any} p @param {any} display @param {any} api */
        drawFrame(state, p, display, api) {
          received = { state, p, display, api };
          api.drawPointerAtValue(9);
          api.drawMarkerAtValue(3, { len: 2 });
          return { wantsFollowUpFrame: true };
        }
      }
    });
    const state = createState("high");

    const result = frame.renderFrame({}, state, {}, deps);

    expect(received.p).toEqual({ foo: "bar" });
    expect(received.display).toBe(deps.displayState);
    expect(received.api.hook).toBe(true);
    expect(typeof received.api.drawDefaultPointer).toBe("function");
    expect(deps.drawing.calls.pointer).toHaveLength(1);
    expect(deps.drawing.calls.pointer[0].valueNum).toBe(9);
    expect(deps.drawing.calls.marker).toHaveLength(1);
    expect(deps.drawing.calls.marker[0].valueNum).toBe(3);
    expect(result).toEqual({ wantsFollowUpFrame: true });
  });

  it("blits the front layer after the frame draw step", function () {
    const frame = create();
    const deps = baseDeps();
    const state = createState("high");

    frame.renderFrame({}, state, {}, deps);

    expect(deps.layerCache.calls).toEqual(["front"]);
  });

  it("dispatches to cfg.drawMode for the current mode when provided", function () {
    const frame = create();
    let calledWithMode = null;
    const deps = baseDeps({
      cfg: {
        drawMode: {
          /** @param {any} state @param {any} p @param {any} display @param {any} api */
          normal(state, p, display, api) {
            calledWithMode = state.mode;
            return { wantsFollowUpFrame: false };
          }
        }
      }
    });
    const state = createState("normal");

    frame.renderFrame({}, state, {}, deps);

    expect(calledWithMode).toBe("normal");
    expect(deps.textLayout.calls.inline).toHaveLength(0);
  });

  it("falls back to the default high-mode text rows (centered) when no drawMode renderer is set", function () {
    const frame = create();
    const deps = baseDeps();
    const state = createState("high");

    frame.renderFrame({}, state, {}, deps);

    expect(deps.textLayout.calls.caption).toEqual([
      { caption: "CAP", box: deps.rowBoxes.captionBox, secScale: 1, align: "center" }
    ]);
    expect(deps.textLayout.calls.valueUnit).toEqual([
      { valueText: "5.0", unit: "kn", box: deps.rowBoxes.valueBox, secScale: 1, align: "center" }
    ]);
  });

  it("falls back to the inline row for normal mode when no drawMode renderer is set", function () {
    const frame = create();
    const deps = baseDeps();
    const state = createState("normal");

    frame.renderFrame({}, state, {}, deps);

    expect(deps.textLayout.calls.inline).toEqual([
      { caption: "CAP", valueText: "5.0", unit: "kn", box: state.layout.inlineBox, secScale: 1 }
    ]);
  });

  it("falls back to right-aligned text rows for flat mode when no drawMode renderer is set", function () {
    const frame = create();
    const deps = baseDeps();
    const state = createState("flat");

    frame.renderFrame({}, state, {}, deps);

    expect(deps.textLayout.calls.caption[0].align).toBe("right");
    expect(deps.textLayout.calls.valueUnit[0].align).toBe("right");
  });

  it("returns undefined when nothing requests a follow-up frame", function () {
    const frame = create();
    const deps = baseDeps();
    const state = createState("high");

    const result = frame.renderFrame({}, state, {}, deps);

    expect(result).toBeUndefined();
  });

  it("signals a follow-up frame when the spring motion is still active", function () {
    const frame = create();
    const deps = baseDeps({ springMotion: { isActive: () => true } });
    const state = createState("high");

    const result = frame.renderFrame({}, state, {}, deps);

    expect(result).toEqual({ wantsFollowUpFrame: true });
  });

  it("signals a follow-up frame when the mode renderer requests one", function () {
    const frame = create();
    const deps = baseDeps({
      cfg: {
        drawMode: {
          high() {
            return { wantsFollowUpFrame: true };
          }
        }
      }
    });
    const state = createState("high");

    const result = frame.renderFrame({}, state, {}, deps);

    expect(result).toEqual({ wantsFollowUpFrame: true });
  });
});
