/**
 * Module: CompassRadialWidget - Full-circle rotating compass with upright labels
 * Documentation: documentation/widgets/compass-gauge.md
 * Depends: FullCircleRadialEngine, FullCircleRadialTextLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCompassRadialWidget = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;
  const COMPASS_LABELS = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW" };
  const COMPASS_LABEL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

  function create(def, Helpers) {
    const engine = Helpers.getModule("FullCircleRadialEngine").create(def, Helpers);
    const textLayout = Helpers.getModule("FullCircleRadialTextLayout").create(def, Helpers);

    function buildCompassLabelSprites(canvas, state) {
      const sprites = [];
      const labelRadius = state.geom.rOuter - Math.max(16, Math.floor(state.geom.ringW * 1.6));
      const font = state.labelWeight + " " + state.geom.labelPx + "px " + state.family;

      for (let i = 0; i < COMPASS_LABEL_ANGLES.length; i++) {
        const angleDeg = COMPASS_LABEL_ANGLES[i];
        const text = COMPASS_LABELS[angleDeg];
        const sprite = canvas.ownerDocument.createElement("canvas");
        const spriteCtx = sprite.getContext("2d");
        if (!spriteCtx) {
          continue;
        }

        spriteCtx.font = font;
        const width = Math.max(1, Math.ceil(spriteCtx.measureText(text).width + 6));
        const height = Math.max(1, Math.ceil(state.geom.labelPx * 1.6));
        sprite.width = width;
        sprite.height = height;

        const drawCtx = sprite.getContext("2d");
        if (!drawCtx) {
          continue;
        }
        drawCtx.setTransform(1, 0, 0, 1, 0, 0);
        drawCtx.clearRect(0, 0, width, height);
        drawCtx.fillStyle = state.color;
        drawCtx.strokeStyle = state.color;
        drawCtx.font = font;
        drawCtx.textAlign = "center";
        drawCtx.textBaseline = "middle";
        drawCtx.fillText(text, width / 2, height / 2);
        sprites.push({ angleDeg: angleDeg, canvas: sprite, width: width, height: height });
      }

      return { sprites: sprites, labelRadius: labelRadius };
    }

    function drawCompassCachedLabels(state, rotationDeg, api) {
      const entry = api.getCacheMeta("labels:" + state.staticKey);
      if (!entry || !entry.sprites || !entry.sprites.length) {
        return;
      }
      for (let i = 0; i < entry.sprites.length; i++) {
        const sprite = entry.sprites[i];
        const t = state.angle.degToCanvasRad(sprite.angleDeg, null, rotationDeg);
        const x = state.geom.cx + Math.cos(t) * entry.labelRadius;
        const y = state.geom.cy + Math.sin(t) * entry.labelRadius;
        state.ctx.drawImage(sprite.canvas, x - (sprite.width / 2), y - (sprite.height / 2));
      }
    }

    function compassDisplay(state, props) {
      const p = props || {};
      const heading = p.heading;
      return {
        heading: heading,
        marker: p.markerCourse,
        caption: String(p.caption).trim(),
        unit: String(p.unit).trim(),
        value: state.value.isFiniteNumber(heading)
          ? state.value.formatDirection360(heading, !!p.leadingZero)
          : (hasOwn.call(p, "default") ? p.default : "---"),
        secScale: state.value.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0)
      };
    }

    const renderCanvas = engine.createRenderer({
      ratioProps: {
        normal: "compassRadialRatioThresholdNormal",
        flat: "compassRadialRatioThresholdFlat"
      },
      ratioDefaults: { normal: 0.8, flat: 2.2 },
      cacheLayers: ["face"],
      layout: { highTopFactor: 0.9, highBottomFactor: 0.9 },
      buildStaticKey: function (state) {
        return {
          labelPx: state.geom.labelPx,
          labelRadius: state.geom.rOuter - Math.max(16, Math.floor(state.geom.ringW * 1.6)),
          labelsSig: "N|NE|E|SE|S|SW|W|NW"
        };
      },
      rebuildLayer: function (layerCtx, layerName, state, props, api) {
        if (layerName !== "face") {
          return;
        }
        api.drawFullCircleRing(layerCtx);
        api.drawFullCircleTicks(layerCtx, {
          startDeg: 0,
          endDeg: 360,
          stepMajor: 30,
          stepMinor: 10
        });
        api.setCacheMeta("labels:" + state.staticKey, buildCompassLabelSprites(state.canvas, state));
      },
      drawFrame: function (state, props, api) {
        const display = compassDisplay(state, props);
        const rotationDeg = state.value.isFiniteNumber(display.heading) ? -display.heading : 0;

        api.drawCachedLayer("face", { rotationDeg: rotationDeg });
        api.drawFixedPointer(state.ctx, 0, { depth: Math.max(10, Math.floor(state.geom.ringW * 0.9)) });

        if (state.value.isFiniteNumber(display.marker) && state.value.isFiniteNumber(display.heading)) {
          state.draw.drawRimMarker(state.ctx, state.geom.cx, state.geom.cy, state.geom.rOuter, display.marker - display.heading, {
            len: Math.max(12, Math.floor(state.geom.ringW * 0.9)),
            width: Math.max(3, Math.floor(state.geom.ringW * 0.4)),
            strokeStyle: state.theme.colors.pointer
          });
        }
        drawCompassCachedLabels(state, rotationDeg, api);
      },
      drawMode: {
        flat: function (state, props) {
          textLayout.drawSingleModeText(state, "flat", compassDisplay(state, props), { side: "left", align: "left" });
        },
        high: function (state, props) {
          textLayout.drawSingleModeText(state, "high", compassDisplay(state, props), { slot: "top" });
        },
        normal: function (state, props) {
          textLayout.drawSingleModeText(state, "normal", compassDisplay(state, props));
        }
      }
    });

    function translateFunction() {
      return {};
    }

    return {
      id: "CompassRadialWidget",
      version: "1.3.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "CompassRadialWidget", create };
}));
