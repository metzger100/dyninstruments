/**
 * Module: TextLayoutComposite - Composite row layouts built on TextLayoutPrimitives
 * Documentation: documentation/shared/text-layout-engine.md
 * Depends: TextLayoutPrimitives
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTextLayoutComposite = factory(); }
}(this, function () {
  "use strict";
  const ROW_SAFE_RATIO = 0.92;
  function clampTextFillScale(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  function scaleTextCeiling(basePx, maxPx, textFillScale) {
    const safeMax = Math.max(1, Math.floor(Number(maxPx) || 0));
    const safeBase = Math.max(1, Math.floor(Number(basePx) || 0));
    const compactBoost = Math.max(0, clampTextFillScale(textFillScale) - 1);
    return Math.min(
      safeMax,
      Math.max(1, Math.floor(safeBase + ((safeMax - safeBase) * compactBoost)))
    );
  }
  function resolveTextFillScale(source) {
    const raw = source && source.textFillScale;
    if (raw == null) {
      return 1;
    }
    if (typeof raw === "string" && raw.trim() === "") {
      return 1;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return 1;
    }
    return Math.max(0.1, Math.min(10, n));
  }
  function resolveCompactGeometryScale(textFillScale) {
    return Math.max(0.5, 1 - Math.max(0, resolveTextFillScale({ textFillScale: textFillScale }) - 1));
  }
  function scaleValueUnitFit(state, valueText, unitText, fit, boxHeight) {
    if (!fit)
      return fit;
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    return {
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      gap: unitText ? scaleTextCeiling(fit.gap, Math.max(1, Math.floor(maxPx * 0.5)), state.textFillScale) : 0
    };
  }
  function scaleInlineFit(state, captionText, valueText, unitText, fit, boxHeight) {
    if (!fit)
      return fit;
    const maxPx = Math.max(1, Math.floor(Number(boxHeight) || 0));
    const gapMaxPx = Math.max(1, Math.floor(maxPx * 0.5));
    return {
      cPx: captionText ? scaleTextCeiling(fit.cPx, maxPx, state.textFillScale) : 0,
      vPx: scaleTextCeiling(fit.vPx, maxPx, state.textFillScale),
      uPx: unitText ? scaleTextCeiling(fit.uPx, maxPx, state.textFillScale) : 0,
      g1: captionText ? scaleTextCeiling(fit.g1, gapMaxPx, state.textFillScale) : 0,
      g2: unitText ? scaleTextCeiling(fit.g2, gapMaxPx, state.textFillScale) : 0
    };
  }
  function resolveOpacity(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  }
  function create(def, componentContext) {
    const primitive = componentContext.components.require("TextLayoutPrimitives");
    function fitThreeRowBlock(args) {
      const cfg = args || {};
      const secScale = Number(cfg.secScale);
      const scale = Number.isFinite(secScale) ? secScale : 0.8;
      const textFillScale = clampTextFillScale(cfg.textFillScale);
      const W = Math.max(1, Number(cfg.W) || 0);
      const H = Math.max(1, Number(cfg.H) || 0);
      const padX = Math.max(0, Number(cfg.padX) || 0);
      const innerY = Math.max(0, Number(cfg.innerY) || 0);
      const hTop = Math.round(H * (scale / (1 + scale + scale)));
      const hMid = Math.round(H * (1 / (1 + scale + scale)));
      const hBot = H - hTop - hMid;
      const maxW = Math.max(1, W - padX * 2);
      const maxHTop = Math.max(1, Math.floor((hTop - innerY) * ROW_SAFE_RATIO));
      const maxHMid = Math.max(1, Math.floor((hMid - innerY) * ROW_SAFE_RATIO));
      const maxHBot = Math.max(1, Math.floor((hBot - innerY) * ROW_SAFE_RATIO));
      const capMaxPx = scaleTextCeiling(Math.min(Math.floor(maxHMid * scale), maxHTop), maxHTop, textFillScale);
      const unitMaxPx = scaleTextCeiling(Math.min(Math.floor(maxHMid * scale), maxHBot), maxHBot, textFillScale);
      const vFit = primitive.fitSingleLineBinary({
        ctx: cfg.ctx,
        text: cfg.valueText,
        minPx: 1,
        maxPx: maxHMid,
        maxW: maxW,
        maxH: maxHMid,
        family: cfg.family,
        weight: cfg.valueWeight,
        useMono: cfg.useMono === true,
        monoFamily: cfg.monoFamily
      });
      const cFit = cfg.captionText
        ? primitive.fitSingleLineBinary({
          ctx: cfg.ctx,
          text: cfg.captionText,
          minPx: 1,
          maxPx: capMaxPx,
          maxW: maxW,
          maxH: maxHTop,
          family: cfg.family,
          weight: cfg.labelWeight
        })
        : { px: 0 };
      const uFit = cfg.unitText
        ? primitive.fitSingleLineBinary({
          ctx: cfg.ctx,
          text: cfg.unitText,
          minPx: 1,
          maxPx: unitMaxPx,
          maxW: maxW,
          maxH: maxHBot,
          family: cfg.family,
          weight: cfg.labelWeight
        })
        : { px: 0 };
      return { hTop: hTop, hMid: hMid, hBot: hBot, cPx: cFit.px, vPx: vFit.px, uPx: uFit.px };
    }
    function drawThreeRowBlock(args) {
      const cfg = args || {};
      const fit = cfg.fit;
      const hTop = Math.max(1, Math.floor(Number(fit.hTop) || 1));
      const hMid = Math.max(1, Math.floor(Number(fit.hMid) || 1));
      const hBot = Math.max(1, Math.floor(Number(fit.hBot) || 1));
      const W = Math.max(1, Number(cfg.W) || 0);
      const padX = Math.max(0, Number(cfg.padX) || 0);
      const ctx = cfg.ctx;
      const captionOpacity = resolveOpacity(cfg.captionOpacity);
      const unitOpacity = resolveOpacity(cfg.unitOpacity);
      if (cfg.captionText) {
        if (captionOpacity < 1) {
          ctx.save();
          ctx.globalAlpha = captionOpacity;
        }
        primitive.setFont(ctx, fit.cPx, cfg.labelWeight, cfg.family);
        ctx.textAlign = "left";
        ctx.fillText(cfg.captionText, padX, Math.floor(hTop / 2));
        if (captionOpacity < 1) {
          ctx.restore();
        }
      }
      primitive.setFont(ctx, fit.vPx, cfg.valueWeight, cfg.family);
      ctx.textAlign = "center";
      ctx.fillText(cfg.valueText, Math.floor(W / 2), Math.floor(hTop + hMid / 2));
      if (cfg.unitText) {
        if (unitOpacity < 1) {
          ctx.save();
          ctx.globalAlpha = unitOpacity;
        }
        primitive.setFont(ctx, fit.uPx, cfg.labelWeight, cfg.family);
        ctx.textAlign = "right";
        ctx.fillText(cfg.unitText, W - padX, Math.floor(hTop + hMid + hBot / 2));
        if (unitOpacity < 1) {
          ctx.restore();
        }
      }
    }
    function fitValueUnitCaptionRows(args) {
      const cfg = args || {};
      const secScale = Number(cfg.secScale);
      const scale = Number.isFinite(secScale) ? secScale : 0.8;
      const textFillScale = clampTextFillScale(cfg.textFillScale);
      const W = Math.max(1, Number(cfg.W) || 0);
      const H = Math.max(1, Number(cfg.H) || 0);
      const padX = Math.max(0, Number(cfg.padX) || 0);
      const innerY = Math.max(0, Number(cfg.innerY) || 0);
      const hTop = Math.round(H * (1 / (1 + scale)));
      const hBot = H - hTop;
      const maxW = Math.max(1, W - padX * 2);
      const maxHTop = Math.max(1, Math.floor((hTop - innerY) * ROW_SAFE_RATIO));
      const maxHBot = Math.max(1, Math.floor((hBot - innerY) * ROW_SAFE_RATIO));
      const capMaxPx = scaleTextCeiling(Math.min(Math.floor(maxHTop * scale), maxHBot), maxHBot, textFillScale);
      const pair = primitive.fitValueUnitRow({
        ctx: cfg.ctx,
        valueText: cfg.valueText,
        unitText: cfg.unitText,
        baseValuePx: maxHTop,
        secScale: scale,
        gap: cfg.gapBase,
        maxW: maxW,
        maxH: maxHTop,
        family: cfg.family,
        valueWeight: cfg.valueWeight,
        labelWeight: cfg.labelWeight,
        useMono: cfg.useMono === true,
        monoFamily: cfg.monoFamily
      });
      const capFit = cfg.captionText
        ? primitive.fitSingleLineBinary({
          ctx: cfg.ctx,
          text: cfg.captionText,
          minPx: 1,
          maxPx: capMaxPx,
          maxW: maxW,
          maxH: maxHBot,
          family: cfg.family,
          weight: cfg.labelWeight
        })
        : { px: 0 };
      return {
        hTop: hTop,
        hBot: hBot,
        vPx: pair.vPx,
        uPx: pair.uPx,
        cPx: capFit.px,
        vW: pair.vW,
        uW: pair.uW,
        total: pair.total,
        gap: pair.gap
      };
    }
    function drawValueUnitCaptionRows(args) {
      const cfg = args || {};
      const fit = cfg.fit;
      primitive.drawInlineTriplet({
        ctx: cfg.ctx,
        fit: {
          vPx: fit.vPx,
          sPx: fit.uPx,
          cW: 0,
          vW: fit.vW,
          uW: fit.uW,
          total: fit.total,
          gap: fit.gap
        },
        captionText: "",
        valueText: cfg.valueText,
        unitText: cfg.unitText,
        x: 0,
        y: 0,
        W: cfg.W,
        H: fit.hTop,
        family: cfg.family,
        valueWeight: cfg.valueWeight,
        labelWeight: cfg.labelWeight,
        captionOpacity: cfg.captionOpacity,
        unitOpacity: cfg.unitOpacity
      });
      if (cfg.captionText) {
        const captionOpacity = resolveOpacity(cfg.captionOpacity);
        if (captionOpacity < 1) {
          cfg.ctx.save();
          cfg.ctx.globalAlpha = captionOpacity;
        }
        primitive.setFont(cfg.ctx, fit.cPx, cfg.labelWeight, cfg.family);
        cfg.ctx.textAlign = "left";
        cfg.ctx.textBaseline = "middle";
        cfg.ctx.fillText(cfg.captionText, cfg.padX, fit.hTop + Math.floor(fit.hBot / 2));
        if (captionOpacity < 1) {
          cfg.ctx.restore();
        }
      }
    }
    function fitTwoRowsWithHeader(args) {
      const cfg = args || {};
      const hasHeader = !!cfg.captionText || !!cfg.unitText;
      const align = cfg.align === "right" ? "right" : "center";
      const W = Math.max(1, Number(cfg.W) || 0);
      const H = Math.max(1, Number(cfg.H) || 0);
      const padX = Math.max(0, Number(cfg.padX) || 0);
      const innerY = Math.max(0, Number(cfg.innerY) || 0);
      const secScale = Number(cfg.secScale);
      const scale = Number.isFinite(secScale) ? secScale : 0.8;
      const textFillScale = clampTextFillScale(cfg.textFillScale);
      const topRowExtraCheck = typeof cfg.topRowExtraCheck === "function"
        ? cfg.topRowExtraCheck
        : null;
      let headerH = 0;
      if (hasHeader) {
        const headerWeight = cfg.mode === "high" ? 0.24 : 0.30;
        headerH = Math.max(1, Math.floor(H * headerWeight));
        headerH = Math.min(headerH, Math.floor(H * 0.45));
      }
      const bodyH = Math.max(1, H - headerH);
      const row1H = Math.max(1, Math.floor(bodyH / 2));
      const row2H = Math.max(1, bodyH - row1H);
      const maxRowH = Math.max(1, Math.min(row1H, row2H) - innerY);
      const maxRowW = Math.max(1, W - padX * 2);
      const rowFit = primitive.fitMultiRowBinary({
        ctx: cfg.ctx,
        rows: [cfg.topText, cfg.bottomText],
        maxW: maxRowW,
        maxH: maxRowH,
        family: cfg.family,
        weight: cfg.valueWeight,
        minPx: 1,
        maxPx: maxRowH,
        extraCheck: function (meta) {
          return meta.rowIndex !== 0 || !topRowExtraCheck || topRowExtraCheck(meta);
        }
      });
      let capPx = 0;
      let unitPx = 0;
      if (hasHeader) {
        const maxHeaderH = Math.max(1, headerH - innerY);
        const headerBase = scaleTextCeiling(
          Math.min(maxHeaderH, Math.floor(rowFit.px * scale)),
          maxHeaderH,
          textFillScale
        );
        const capMaxW = cfg.captionText && cfg.unitText
          ? Math.max(1, Math.floor((W - padX * 2) * 0.62))
          : Math.max(1, W - padX * 2);
        const unitMaxW = cfg.captionText && cfg.unitText
          ? Math.max(1, Math.floor((W - padX * 2) * 0.32))
          : Math.max(1, W - padX * 2);
        capPx = cfg.captionText
          ? primitive.fitSingleLineBinary({
            ctx: cfg.ctx,
            text: cfg.captionText,
            minPx: 1,
            maxPx: headerBase,
            maxW: capMaxW,
            maxH: maxHeaderH,
            family: cfg.family,
            weight: cfg.labelWeight
          }).px
          : 0;
        unitPx = cfg.unitText
          ? primitive.fitSingleLineBinary({
            ctx: cfg.ctx,
            text: cfg.unitText,
            minPx: 1,
            maxPx: Math.floor(headerBase * scale),
            maxW: unitMaxW,
            maxH: maxHeaderH,
            family: cfg.family,
            weight: cfg.labelWeight
          }).px
          : 0;
      }
      return {
        hasHeader: hasHeader,
        headerH: headerH,
        row1H: row1H,
        row2H: row2H,
        linePx: rowFit.px,
        align: align,
        capPx: capPx,
        unitPx: unitPx
      };
    }
    function drawTwoRowsWithHeader(args) {
      const cfg = args || {};
      const fit = cfg.fit;
      const W = Math.max(1, Number(cfg.W) || 0);
      const ctx = cfg.ctx;
      const captionOpacity = resolveOpacity(cfg.captionOpacity);
      const unitOpacity = resolveOpacity(cfg.unitOpacity);
      if (fit.hasHeader) {
        const yHeader = Math.floor(fit.headerH / 2);
        if (cfg.captionText) {
          if (captionOpacity < 1) {
            ctx.save();
            ctx.globalAlpha = captionOpacity;
          }
          primitive.setFont(ctx, fit.capPx, cfg.labelWeight, cfg.family);
          ctx.textAlign = "left";
          ctx.fillText(cfg.captionText, cfg.padX, yHeader);
          if (captionOpacity < 1) {
            ctx.restore();
          }
        }
        if (cfg.unitText) {
          if (unitOpacity < 1) {
            ctx.save();
            ctx.globalAlpha = unitOpacity;
          }
          primitive.setFont(ctx, fit.unitPx, cfg.labelWeight, cfg.family);
          ctx.textAlign = "right";
          ctx.fillText(cfg.unitText, W - cfg.padX, yHeader);
          if (unitOpacity < 1) {
            ctx.restore();
          }
        }
      }
      const yTop = fit.headerH + Math.floor(fit.row1H / 2);
      const yBottom = fit.headerH + fit.row1H + Math.floor(fit.row2H / 2);
      primitive.setFont(ctx, fit.linePx, cfg.valueWeight, cfg.family);
      const align = fit.align === "right" ? "right" : "center";
      const x = align === "right" ? W - cfg.padX : Math.floor(W / 2);
      ctx.textAlign = align;
      ctx.fillText(cfg.topText, x, yTop);
      ctx.fillText(cfg.bottomText, x, yBottom);
    }
    return {
      id: "TextLayoutComposite",
      fitThreeRowBlock: fitThreeRowBlock,
      drawThreeRowBlock: drawThreeRowBlock,
      fitValueUnitCaptionRows: fitValueUnitCaptionRows,
      drawValueUnitCaptionRows: drawValueUnitCaptionRows,
      fitTwoRowsWithHeader: fitTwoRowsWithHeader,
      drawTwoRowsWithHeader: drawTwoRowsWithHeader,
      clampTextFillScale: clampTextFillScale,
      scaleTextCeiling: scaleTextCeiling,
      resolveTextFillScale: resolveTextFillScale,
      resolveCompactGeometryScale: resolveCompactGeometryScale,
      scaleValueUnitFit: scaleValueUnitFit,
      scaleInlineFit: scaleInlineFit
    };
  }
  return { id: "TextLayoutComposite", create: create };
}));
