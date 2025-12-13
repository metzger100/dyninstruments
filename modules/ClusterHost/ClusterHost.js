/*!
 * ClusterHost (UMD) — delegating cluster module with per-kind labels
 *
 * Wind cluster supports both numeric kinds (ThreeElements) and graphic kinds
 * (WindDial). CourseHeading supports numeric kinds (ThreeElements) and
 * graphic kinds (CompassGauge).
 *
 * Head-hiding policy:
 * - wantsHideNativeHead is true if any sub renderer requests it.
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHost = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    function norm360(deg){ if (!isFinite(deg)) return deg; let r = deg % 360; if (r < 0) r += 360; return r; }
    function norm180(deg){ if (!isFinite(deg)) return deg; let r = ((deg + 180) % 360 + 360) % 360 - 180; if (r === 180) r = -180; return r; }

    function makeAngleFormatter(isDirection, leadingZero, fallback){
      return function(raw){
        const n = Number(raw);
        if (!isFinite(n)) return fallback || '---';
        let a = isDirection ? norm360(n) : norm180(n);
        let out;
        if (isDirection){
          out = ((Math.round(a) % 360) + 360) % 360;
        }
        else{
          const r = Math.round(Math.abs(a));
          out = a < 0 ? -r : r;
          if (out === 180) out = -180;
        }
        let s = String(Math.abs(out));
        if (leadingZero) s = s.padStart(3, '0');
        if (!isDirection && out < 0) s = '-' + s;
        return s;
      };
    }

    const three = Helpers.getModule('ThreeElements');
    if (!three || typeof three.create !== 'function') {
      throw new Error('ClusterHost: ThreeElements module not available');
    }
    const windDialMod = Helpers.getModule('WindDial');
    if (!windDialMod || typeof windDialMod.create !== 'function') {
      throw new Error('ClusterHost: WindDial module not available');
    }
    const compassMod = Helpers.getModule('CompassGauge');
    if (!compassMod || typeof compassMod.create !== 'function') {
      throw new Error('ClusterHost: CompassGauge module not available');
    }

    const speedGaugeMod = Helpers.getModule('SpeedGauge');
    if (!speedGaugeMod || typeof speedGaugeMod.create !== 'function') {
      throw new Error('ClusterHost: SpeedGauge module not available');
    }

    const depthMod = Helpers.getModule('DepthGauge');
    if (!depthMod || typeof depthMod.create !== 'function') {
      throw new Error('ClusterHost: DepthGauge module not available');
    }

    const tempMod = Helpers.getModule('TemperatureGauge');
    if (!tempMod || typeof tempMod.create !== 'function') {
      throw new Error('ClusterHost: TemperatureGauge module not available');
    }

    const threeSpec   = three.create(def, Helpers);
    const dialSpec    = windDialMod.create(def, Helpers);
    const compassSpec = compassMod.create(def, Helpers);
    const speedGaugeSpec = speedGaugeMod.create(def, Helpers);
    const depthSpec   = depthMod.create(def, Helpers);
    const tempSpec    = tempMod.create(def, Helpers);

    const wantsHide = !!(threeSpec && threeSpec.wantsHideNativeHead) ||
                      !!(dialSpec && dialSpec.wantsHideNativeHead) ||
                      !!(compassSpec && compassSpec.wantsHideNativeHead) ||
                      !!(speedGaugeSpec && speedGaugeSpec.wantsHideNativeHead) ||
                      !!(depthSpec && depthSpec.wantsHideNativeHead) ||
                      !!(tempSpec && tempSpec.wantsHideNativeHead);

    function out(v, cap, unit, formatter, formatterParameters){
      const o = {};
      if (typeof v !== 'undefined') o.value = v;
      if (typeof cap !== 'undefined') o.caption = cap;
      if (typeof unit !== 'undefined') o.unit = unit;
      if (typeof formatter !== 'undefined') o.formatter = formatter;
      if (Array.isArray(formatterParameters)) o.formatterParameters = formatterParameters;
      return o;
    }

    function translateFunction(props){
      const p = props || {};
      const cluster = p.cluster || def.cluster || '';

      const cap  = (k) => p['caption_' + k];
      const unit = (k) => p['unit_' + k];

      if (cluster === 'courseHeading'){
        const effKind = p.kind;

        // Graphic compass kinds → delegate to CompassGauge
        if (effKind === 'hdtGraphic' || effKind === 'hdmGraphic'){
          const heading = (effKind === 'hdtGraphic') ? p.hdt : p.hdm;
          return {
            renderer: 'CompassGauge',
            heading: heading,
            markerCourse: p.brg, // optional target marker
            caption: cap(effKind),
            unit: unit(effKind),
            leadingZero: !!p.leadingZero,
            captionUnitScale: Number(p.captionUnitScale),
            compRatioThresholdNormal: Number(p.compRatioThresholdNormal),
            compRatioThresholdFlat:   Number(p.compRatioThresholdFlat)
          };
        }

        // Numeric → ThreeElements
        const val = p[effKind];
        const leadingZero = !!p.leadingZero;
        return out(val, cap(effKind), unit(effKind), 'formatDirection360', [leadingZero]);
      }

      if (cluster === 'speed'){
        const effKind = p.kind;

        if (effKind === 'sogGraphic' || effKind === 'stwGraphic'){
          const baseKind = (effKind === 'sogGraphic') ? 'sog' : 'stw';
          const val = p[baseKind];

          const warnOn  = (p.speedWarningEnabled !== false);
          const alarmOn = (p.speedAlarmEnabled  !== false);

          return {
            renderer: 'SpeedGauge',
            value: val,
            caption: cap(effKind),
            unit: unit(effKind),

            // layout thresholds
            speedRatioThresholdNormal: Number(p.speedRatioThresholdNormal),
            speedRatioThresholdFlat:   Number(p.speedRatioThresholdFlat),
            captionUnitScale:          Number(p.captionUnitScale),

            // range/arc
            minValue: Number(p.minValue),
            maxValue: Number(p.maxValue),
            startAngleDeg: Number(p.startAngleDeg),
            endAngleDeg:   Number(p.endAngleDeg),

            // ticks
            tickMajor: Number(p.tickMajor),
            tickMinor: Number(p.tickMinor),
            showEndLabels: !!p.showEndLabels,

            // sectors
            warningFrom: warnOn  ? Number(p.warningFrom) : undefined,
            alarmFrom:   alarmOn ? Number(p.alarmFrom)   : undefined
          };
        }

        // numeric -> ThreeElements
        const val = p[effKind];
        const uni = unit(effKind);
        return out(val, cap(effKind), uni, 'formatSpeed', [uni]);
      }

      if (cluster === 'position'){
        const effKind = p.kind;               // 'boat' or 'wp'
        const val = (effKind === 'wp') ? p.wp : p.boat;
        return out(val, cap(effKind), unit(effKind), 'formatLonLats', []);
      }

      if (cluster === 'distance'){
        const effKind = p.kind;
        const val = p[effKind];
        const uni = unit(effKind);
        const fmtParams = (effKind === 'anchor' || effKind === 'watch')
          ? [uni]
          : [];
        return out(val, cap(effKind), uni, 'formatDistance', fmtParams);
      }

      if (cluster === 'environment'){
        const req = p.kind;

        if (req === 'depthGraphic'){
          const depthWarnOn  = (p.depthWarningEnabled !== false);
          const depthAlarmOn = (p.depthAlarmEnabled  !== false);

          return {
            renderer: 'DepthGauge',
            value: p.depth,
            caption: cap('depthGraphic'),
            unit: unit('depthGraphic'),

            minValue: Number(p.depthMinValue),
            maxValue: Number(p.depthMaxValue),
            tickMajor: Number(p.depthTickMajor),
            tickMinor: Number(p.depthTickMinor),
            showEndLabels: !!p.depthShowEndLabels,

            // shallow-side sectors
            alarmFrom:   depthAlarmOn ? Number(p.depthAlarmFrom)   : undefined,
            warningFrom: depthWarnOn  ? Number(p.depthWarningFrom) : undefined,

            depthRatioThresholdNormal: Number(p.depthRatioThresholdNormal),
            depthRatioThresholdFlat:   Number(p.depthRatioThresholdFlat),
            captionUnitScale:          Number(p.captionUnitScale)
          };
        }

        if (req === 'tempGraphic'){
          const tempWarnOn  = (p.tempWarningEnabled === true);
          const tempAlarmOn = (p.tempAlarmEnabled  === true);
          return {
            renderer: 'TemperatureGauge',
            value: p.temp,

            caption: cap('tempGraphic'),
            unit: unit('tempGraphic'),

            minValue: Number(p.tempMinValue),
            maxValue: Number(p.tempMaxValue),
            tickMajor: Number(p.tempTickMajor),
            tickMinor: Number(p.tempTickMinor),
            showEndLabels: !!p.tempShowEndLabels,

            warningFrom: tempWarnOn  ? Number(p.tempWarningFrom) : undefined,
            alarmFrom:   tempAlarmOn ? Number(p.tempAlarmFrom)   : undefined,

            tempRatioThresholdNormal: Number(p.tempRatioThresholdNormal),
            tempRatioThresholdFlat:   Number(p.tempRatioThresholdFlat),

            captionUnitScale: Number(p.captionUnitScale)
          };
        }

        // Numeric (ThreeElements)
        if (req === 'temp') {
          return out(p.wtemp, cap('temp'), unit('temp'), 'formatTemperature', ['celsius']);
        }
        if (req === 'pressure') {
          return out(p.value, cap('pressure'), unit('pressure'), 'skPressure', ['hPa']);
        }
        return out(p.depth, cap('depth'), unit('depth'), 'formatDecimal', [3,1,true]);
      }

      // ----------------- WIND -------------------------------------------------
      if (cluster === 'wind'){
        const req = p.kind;

        const layEnabled = (p.windLayEnabled !== false);

        // Graphic kinds → delegate to WindDial
        if (req === 'angleTrueGraphic' || req === 'angleApparentGraphic'){
          const isTrue = (req === 'angleTrueGraphic');
          return {
            renderer: 'WindDial',
            angle: isTrue ? p.twa : p.awa,
            speed: isTrue ? p.tws : p.aws,
            angleCaption: isTrue ? p.angleCaption_TWA : p.angleCaption_AWA,
            speedCaption: isTrue ? p.speedCaption_TWS : p.speedCaption_AWS,
            angleUnit: p.angleUnitGraphic,
            speedUnit: p.speedUnitGraphic,
            layEnabled: layEnabled,
            layMin: layEnabled ? Number(p.layMin) : undefined,
            layMax: layEnabled ? Number(p.layMax) : undefined,
            dialRatioThresholdNormal: Number(p.dialRatioThresholdNormal),
            dialRatioThresholdFlat:   Number(p.dialRatioThresholdFlat),
            captionUnitScale:         Number(p.captionUnitScale),
            leadingZero: !!p.leadingZero
          };
        }

        // Numeric kinds → ThreeElements
        const leadingZero = !!p.leadingZero;

        if (req === 'angleTrue') {
          return out(p.twa, cap('angleTrue'), unit('angleTrue'),
            makeAngleFormatter(false, leadingZero, p.default), []);
        }
        if (req === 'angleApparent') {
          return out(p.awa, cap('angleApparent'), unit('angleApparent'),
            makeAngleFormatter(false, leadingZero, p.default), []);
        }
        if (req === 'angleTrueDirection') {
          return out(p.twd, cap('angleTrueDirection'), unit('angleTrueDirection'),
            makeAngleFormatter(true, leadingZero, p.default), []);
        }
        if (req === 'speedTrue') {
          const u = unit('speedTrue');
          return out(p.tws, cap('speedTrue'), u, 'formatSpeed', [u]);
        }
        if (req === 'speedApparent') {
          const u = unit('speedApparent');
          return out(p.aws, cap('speedApparent'), u, 'formatSpeed', [u]);
        }
        return {};
      }

      if (cluster === 'time'){
        return out(p.value, undefined, p.unit, 'formatTime', []);
      }

      if (cluster === 'nav'){
        const req = p.kind;
        if (req === 'eta')          return out(p.eta, cap('eta'), unit('eta'), 'formatTime', []);
        if (req === 'rteEta')       return out(p.rteEta, cap('rteEta'), unit('rteEta'), 'formatTime', []);
        if (req === 'dst')          return out(p.dst, cap('dst'), unit('dst'), 'formatDistance', []);
        if (req === 'rteDistance')  return out(p.rteDistance, cap('rteDistance'), unit('rteDistance'), 'formatDistance', []);
        if (req === 'vmg')          { const u = unit('vmg'); return out(p.vmg, cap('vmg'), u, 'formatSpeed', [u]); }
        if (req === 'clock')        return out(p.clock, cap('clock'), unit('clock'), 'formatTime', []);
        if (req === 'positionBoat') return out(p.positionBoat, cap('positionBoat'), unit('positionBoat'), 'formatLonLats', []);
        if (req === 'positionWp')   return out(p.positionWp,   cap('positionWp'),   unit('positionWp'),   'formatLonLats', []);
        return {};
      }

      if (cluster === 'anchor'){
        const req = p.kind;
        if (req === 'distance') { const u = unit('distance'); return out(p.distance, cap('distance'), u, 'formatDistance', [u]); }
        if (req === 'watch')    { const u = unit('watch');    return out(p.watch,    cap('watch'),    u, 'formatDistance', [u]); }
        if (req === 'bearing')  { const leadingZero = !!p.leadingZero; return out(p.bearing, cap('bearing'), unit('bearing'), 'formatDirection360', [leadingZero]); }
        return {};
      }

      if (cluster === 'vessel'){
        const req = p.kind;
        if (req === 'voltage') { const u = unit('voltage'); return out(p.value, cap('voltage'), u, 'formatDecimal', [3,1,true]); }
        return {};
      }

      return {};
    }

    function pickRenderer(props){
      if (props && props.renderer === 'WindDial')    return dialSpec;
      if (props && props.renderer === 'CompassGauge')return compassSpec;
      if (props && props.renderer === 'SpeedGauge')   return speedGaugeSpec;
      if (props && props.renderer === 'DepthGauge')   return depthSpec;
      if (props && props.renderer === 'TemperatureGauge') return tempSpec;
      return threeSpec;
    }

    function renderCanvas(canvas, props){
      const sub = pickRenderer(props);
      if (sub && typeof sub.renderCanvas === 'function') {
        return sub.renderCanvas.apply(this, [canvas, props]);
      }
    }

    function finalizeFunction(){
      [threeSpec, dialSpec, compassSpec, speedGaugeSpec, depthSpec, tempSpec].forEach(sub => {
        if (sub && typeof sub.finalizeFunction === 'function') {
          try { sub.finalizeFunction.apply(this, arguments); } catch(e){}
        }
      });
    }

    return {
      id: "ClusterHost",
      version: "1.14.0",
      wantsHideNativeHead: wantsHide,
      translateFunction,
      renderCanvas,
      finalizeFunction
    };
  }

  return { id: "ClusterHost", create };
}));
