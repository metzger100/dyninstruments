/*!
 * PolarCore (UMD) — polar math + compass helpers built atop GaugeBasicsCore
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniPolarCore = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const BasicsModule = Helpers && Helpers.getModule && Helpers.getModule("GaugeBasicsCore");
    const Basics = BasicsModule && BasicsModule.create && BasicsModule.create(def, Helpers);
    if (!Basics) throw new Error("GaugeBasicsCore is required by PolarCore");

    // ---- math utils ---------------------------------------------------------
    function deg2rad(d){ return (d * Math.PI) / 180; }
    function rad2deg(r){ return (r * 180) / Math.PI; }

    function norm360(d){
      if (!isFinite(d)) return d;
      let r = d % 360; if (r < 0) r += 360; return r;
    }
    function norm180(d){
      if (!isFinite(d)) return d;
      let r = ((d + 180) % 360 + 360) % 360 - 180; if (r === 180) r = -180; return r;
    }

    // Map angle (deg) to canvas angle (rad), with 0° at up (north) and clockwise positive.
    function toCanvasAngle(deg, rotationDeg){
      const a = norm360((deg - 90) + (rotationDeg || 0));
      return deg2rad(a);
    }

    // ---- tick generation ----------------------------------------------------
    function buildPolarTicks(stepMajor = 30, stepMinor = 10, rotationDeg = 0){
      const ticks = [];
      for (let a = 0; a < 360; a += stepMinor){
        const isMajor = (a % stepMajor === 0);
        ticks.push({ angleDeg: a, angleRad: toCanvasAngle(a, rotationDeg), isMajor });
      }
      return ticks;
    }

    function buildPolarLabels(step = 90, rotationDeg = 0, labels){
      const lbls = labels || { 0:"N",90:"E",180:"S",270:"W" };
      const out = [];
      for (let a = 0; a < 360; a += step){
        const text = (lbls && lbls[a] != null) ? lbls[a] : String(a);
        out.push({ angleRad: toCanvasAngle(a, rotationDeg), text });
      }
      return out;
    }

    // ---- drawing ------------------------------------------------------------
    function drawPolarFrame(ctx, bounds, options){
      const o = Object.assign({
        ring: { lineWidth: 1 },
        ticks: { stepMajor: 30, stepMinor: 10, major:{len:8,width:2}, minor:{len:5,width:1} },
        labels: { fontPx: 11, bold: true, step: 90, labels: {0:"N",90:"E",180:"S",270:"W"}, offset: 16 },
        rotationDeg: 0,
        marginFactor: 0.08
      }, options || {});

      const safe = Basics.computeCircularSafeArea(bounds, o.marginFactor);
      const cx = safe.cx;
      const cy = safe.cy;
      const r = safe.radius;

      Basics.drawRing(ctx, cx, cy, r, o.ring);
      const ticks = buildPolarTicks(o.ticks.stepMajor, o.ticks.stepMinor, o.rotationDeg);
      Basics.drawTicks(ctx, cx, cy, r - Math.max(o.ticks.major.len, o.ticks.minor.len), r, ticks, {
        major: { len: o.ticks.major.len, width: o.ticks.major.width },
        minor: { len: o.ticks.minor.len, width: o.ticks.minor.width }
      });
      if (o.labels){
        const labels = buildPolarLabels(o.labels.step, o.rotationDeg, o.labels.labels);
        Basics.drawLabels(ctx, cx, cy, r, labels, {
          fontPx: o.labels.fontPx,
          bold: o.labels.bold,
          offset: o.labels.offset,
          family: o.labels.family
        });
      }
      return { cx, cy, radius: r };
    }

    // ---- legacy-style wrappers built atop GaugeBasics ----------------------
    function drawRing(ctx, cx, cy, r, opts){
      Basics.drawRing(ctx, cx, cy, r, opts);
    }
    function drawTicks(ctx, cx, cy, r, rotationDeg, opts){
      const o = Object.assign({
        major: { len: 8, width: 2 },
        minor: { len: 5, width: 1 },
        stepMajor: 30,
        stepMinor: 10
      }, opts || {});
      const ticks = buildPolarTicks(o.stepMajor, o.stepMinor, rotationDeg);
      Basics.drawTicks(ctx, cx, cy, r - Math.max(o.major.len, o.minor.len), r, ticks, {
        major: { len: o.major.len, width: o.major.width },
        minor: { len: o.minor.len, width: o.minor.width }
      });
    }
    function drawLabels(ctx, cx, cy, r, rotationDeg, opts){
      const o = Object.assign({
        fontPx: 11,
        bold: true,
        step: 30,
        labels: { 0:"N",90:"E",180:"S",270:"W" },
        offset: 16
      }, opts || {});
      const labels = buildPolarLabels(o.step, rotationDeg, o.labels);
      Basics.drawLabels(ctx, cx, cy, r, labels, {
        fontPx: o.fontPx,
        bold: o.bold,
        offset: o.offset,
        family: o.family
      });
    }
    function drawArrow(ctx, cx, cy, r, angleDeg, opts){
      const o = Object.assign({ head: 8, width: 2, tail: 12, color: null, rotationDeg: 0 }, opts || {});
      const t = toCanvasAngle(angleDeg, o.rotationDeg || 0);
      Basics.drawArrow(ctx, cx, cy, o.tail, r, t, { head: o.head, width: o.width, strokeStyle: o.color });
    }
    function drawPointerAtRim(ctx, cx, cy, rOuter, angleDeg, opts){
      const o = Object.assign({ rotationDeg: 0 }, opts || {});
      const t = toCanvasAngle(angleDeg, o.rotationDeg || 0);
      Basics.drawPointerAtRim(ctx, cx, cy, rOuter, t, o);
    }
    function drawMarker(ctx, cx, cy, r, angleDeg, opts){
      const o = Object.assign({ rotationDeg: 0 }, opts || {});
      const t = toCanvasAngle(angleDeg, o.rotationDeg || 0);
      Basics.drawMarker(ctx, cx, cy, r, t, o);
    }
    function drawFrame(ctx, cx, cy, r, opts){
      const o = Object.assign({
        ring: { lineWidth: 1 },
        ticks: { stepMajor: 30, stepMinor: 10, major:{len:8,width:2}, minor:{len:5,width:1} },
        labels: { fontPx: 11, bold: true, step: 90, labels: {0:"N",90:"E",180:"S",270:"W"}, offset: 16 },
        rotationDeg: 0
      }, opts || {});
      drawRing(ctx, cx, cy, r, o.ring);
      drawTicks(ctx, cx, cy, r, o.rotationDeg, o.ticks);
      if (o.labels) drawLabels(ctx, cx, cy, r, o.rotationDeg, o.labels);
    }

      return {
      id: "PolarCore",
      version: "2.0.0",
      deg2rad, rad2deg, norm360, norm180, toCanvasAngle,
      buildPolarTicks, buildPolarLabels, drawPolarFrame,
      drawRing, drawTicks, drawLabels, drawMarker, drawArrow, drawPointerAtRim, drawFrame
    };
  }

  return { id: "PolarCore", create };
}));
