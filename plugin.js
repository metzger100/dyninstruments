/* dyninstruments — clustered UMD bootstrap for AvNav (renderCanvas/Html)
 * Clusters & formatters:
 *  - All wind instruments unified into a single "wind" cluster handled by ClusterHost.
 *  - PositionCluster renamed to Position.
 *  - ClusterHost assigns formatters based on selected kind.
 *  - ThreeElements renders the canvas (no wind logic inside anymore).
 *  - LargeTime uses formatTime (HH:MM:SS) like ETA.
 *
 * Notes (cleaned):
 *  - No "auto" kinds. Each widget has a concrete default kind.
 *  - Caption/unit defaults are defined only in per-kind editables.
 *    -> We avoid hardcoded caption/unit defaults inside translate functions.
 *  - Formatters are set at *translate time* (not at registration).
 *    -> We must always pass formatter *and* its parameters explicitly from ClusterHost.
 */

/* global avnav */
(function () {
  if (!window.avnav || !avnav.api) {
    console && console.error && console.error("dyninstruments: avnav.api missing");
    return;
  }

  // ---------- Paths & asset loaders ----------------------------------------
  function getBaseUrl() {
    // AvNav provides AVNAV_BASE_URL — we build plugin-relative URLs from it.
    if (typeof AVNAV_BASE_URL !== 'string' || !AVNAV_BASE_URL) {
      throw new Error('AVNAV_BASE_URL is missing – AvNav must provide this global for plugins.');
    }
    return AVNAV_BASE_URL.replace(/\/+$/, '') + '/';
  }
  const BASE = getBaseUrl();

  function loadCssOnce(id, href) {
    if (!href) return Promise.resolve();
    if (document.getElementById(id)) return Promise.resolve();
    return new Promise((res, rej) => {
      const l = document.createElement("link");
      l.id = id; l.rel = "stylesheet"; l.href = href;
      l.onload = () => res(); l.onerror = rej;
      document.head.appendChild(l);
    });
  }

  function loadScriptOnce(id, src) {
    if (document.getElementById(id)) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.id = id; s.async = true; s.src = src;
      s.onload = () => res(); s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // ---------- Helpers exposed to modules -----------------------------------
  function applyFormatter(raw, props) {
    // Apply a formatter (fn or avnav.api.formatter[name]) to a raw value.
    const fpRaw = props && props.formatterParameters;
    const fp = Array.isArray(fpRaw) ? fpRaw
            : (typeof fpRaw === 'string' ? fpRaw.split(',') : []);
    try {
      if (props && typeof props.formatter === "function") {
        return props.formatter.apply(null, [raw, ...fp]);
      }
      if (
        props &&
        typeof props.formatter === "string" &&
        avnav.api.formatter &&
        typeof avnav.api.formatter[props.formatter] === "function"
      ) {
        return avnav.api.formatter[props.formatter].apply(avnav.api.formatter, [raw, ...fp]);
      }
    } catch (e) {}
    if (raw == null || Number.isNaN(raw)) return (props && props.default) || "---";
    return String(raw);
  }

  function setupCanvas(canvas) {
    // Prepare a HiDPI-safe canvas; map drawing coords to CSS pixels.
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width  * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: Math.max(1, Math.round(rect.width)), H: Math.max(1, Math.round(rect.height)) };
  }

  function resolveTextColor(canvas) {
    // Resolve a text color for drawing; prefer local CSS vars.
    const st = getComputedStyle(canvas);
    const vars = ["--dyni-fg", "--instrument-fg", "--mainfg"];
    for (const v of vars) {
      const val = st.getPropertyValue(v).trim();
      if (val) return val;
    }
    return st.color || "#000";
  }

  function resolveFontFamily(el) {
    // Shared font stack (scoped by --dyni-font).
    const st = getComputedStyle(el);
    const varVal = st.getPropertyValue("--dyni-font");
    if (varVal && varVal.trim()) return varVal.trim();
    return `"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"`;
  }

  function defaultsFromEditableParams(editableParams){
    // Build default values from typed editableParameters.
    const out = {};
    if (!editableParams) return out;
    Object.keys(editableParams).forEach(k => {
      const spec = editableParams[k];
      if (spec && typeof spec === "object" && Object.prototype.hasOwnProperty.call(spec, "default")) {
        out[k] = spec.default;
      }
    });
    return out;
  }

  function getModule(id){
    // Make other modules accessible to modules (used by ClusterHost & feature modules).
    const m = MODULES[id];
    if (!m) return undefined;
    const ns = (window.DyniModules || {});
    return ns[m.globalKey];
  }

  const Helpers = { applyFormatter, setupCanvas, resolveTextColor, resolveFontFamily, getModule };

  // ---------- Module registry (UMD namespaces + deps) -----------------------
  const MODULES = {
    InstrumentComponents: {
      js:  BASE + "modules/Cores/InstrumentComponents.js",
      css: undefined,
      globalKey: "DyniInstrumentComponents"
    },

    ThreeElements: { 
      js:  BASE + "modules/ThreeElements/ThreeElements.js",
      css: BASE + "modules/ThreeElements/ThreeElements.css",
      globalKey: "DyniThreeElements"
    },

    WindDial: {
      js:  BASE + "modules/WindDial/WindDial.js",
      css: BASE + "modules/WindDial/WindDial.css",
      globalKey: "DyniWindDial",
      deps: ["InstrumentComponents"]
    },
    CompassGauge: {
      js:  BASE + "modules/CompassGauge/CompassGauge.js",
      css: BASE + "modules/CompassGauge/CompassGauge.css",
      globalKey: "DyniCompassGauge",
      deps: ["InstrumentComponents"]
    },

    SpeedGauge: {
      js:  BASE + "modules/SpeedGauge/SpeedGauge.js",
      globalKey: "DyniSpeedGauge",
      deps: ["InstrumentComponents"]
    },

    DepthGauge: {
      js:  BASE + "modules/DepthGauge/DepthGauge.js",
      css: undefined,
      globalKey: "DyniDepthGauge",
      deps: ["InstrumentComponents"]
    },

    ClusterHost: {
      js:  BASE + "modules/ClusterHost/ClusterHost.js",
      css: BASE + "modules/ClusterHost/ClusterHost.css",
      globalKey: "DyniClusterHost",
      deps: ["ThreeElements","WindDial","CompassGauge","SpeedGauge","DepthGauge"]
    }
  };

  // ---------- Per-kind editable helpers ------------------------------------
  function makePerKindTextParams(map){
    const out = {};
    Object.keys(map).forEach(k => {
      const d = map[k] || {};
      out['caption_' + k] = {
        type: 'STRING',
        displayName: 'Caption',
        default: (typeof d.cap === 'string') ? d.cap : '',
        condition: { kind: k }
      };
      out['unit_' + k] = {
        type: 'STRING',
        displayName: 'Unit',
        default: (typeof d.unit === 'string') ? d.unit : '',
        condition: { kind: k }
      };
    });
    return out;
  }

  const COURSE_KIND = {
    cog:        { cap: 'COG', unit: '°' },
    hdt:        { cap: 'HDT', unit: '°' },
    hdm:        { cap: 'HDM', unit: '°' },
    brg:        { cap: 'BRG', unit: '°' },
    // graphic sub-kinds for CompassGauge
    hdtGraphic: { cap: 'HDT', unit: '°' },
    hdmGraphic: { cap: 'HDM', unit: '°' }
  };
  const SPEED_KIND = {
    sog:       { cap: 'SOG', unit: 'kn' },
    stw:       { cap: 'STW', unit: 'kn' },

    sogGraphic:{ cap: 'SOG', unit: 'kn' },
    stwGraphic:{ cap: 'STW', unit: 'kn' }
  };
  const POSITION_KIND = {
    boat: { cap: 'POS', unit: '' },
    wp:   { cap: 'WP',  unit: '' }
  };
  const DISTANCE_KIND = {
    dst:   { cap: 'DST',    unit: ''  },
    route: { cap: 'RTE',    unit: ''  },
    anchor:{ cap: 'ANCHOR', unit: 'm' },
    watch: { cap: 'AWATCH', unit: 'm' }
  };
  const ENV_KIND = {
    depth:    { cap: 'DPT',  unit: 'm'   },
    depthGraphic:{ cap: 'DPT', unit: 'm' },
    wtemp:    { cap: 'TEMP', unit: '°C'  },
    pressure: { cap: 'PRES', unit: 'hPa' }
  };
  const WIND_KIND = {
    angleTrue:          { cap: 'TWA', unit: '°'  },
    angleApparent:      { cap: 'AWA', unit: '°'  },
    angleTrueDirection: { cap: 'TWD', unit: '°'  },
    speedTrue:          { cap: 'TWS', unit: 'kn' },
    speedApparent:      { cap: 'AWS', unit: 'kn' }
  };

  const NAV_KIND = {
    eta:           { cap: 'ETA',       unit: ''   },
    rteEta:        { cap: 'RTE ETA',   unit: ''   },
    dst:           { cap: 'DST',       unit: ''   },
    rteDistance:   { cap: 'RTE',       unit: ''   },
    vmg:           { cap: 'VMG',       unit: 'kn' },
    clock:         { cap: 'TIME',      unit: ''   },
    positionBoat:  { cap: 'POS',       unit: ''   },
    positionWp:    { cap: 'WP',        unit: ''   }
  };
  const ANCHOR_KIND = {
    distance: { cap: 'ANCHOR', unit: 'm' },
    watch:    { cap: 'AWATCH', unit: 'm' },
    bearing:  { cap: 'ABRG',   unit: '°' }
  };
  const VESSEL_KIND = {
    voltage: { cap: 'VOLT', unit: 'V' }
  };

  const EXPOSE_LEGACY = false;

  // ---------- Shared layout editables (global defaults) ---------------------
  const commonThreeElementsEditables = {
    ratioThresholdNormal: {
      type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
      name: "3-Rows Threshold (higher = flatter)"
    },
    ratioThresholdFlat: {
      type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
      name: "1-Row Threshold (higher = flatter)"
    },
    captionUnitScale: {
      type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
      name: "Caption/Unit to Value scale"
    }
  };

  const opt = (name, value) => ({ name, value });

  // ---------- Instruments (clusters) ----------------------------------------
  const CLUSTERS = [
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_CourseHeading",
        description: "Course & headings (COG/HDT/HDM/BRG) incl. Compass gauge",
        caption: "", unit: "", default: "---",
        cluster: "courseHeading",
        storeKeys: {
          cog: "nav.gps.course",
          hdt: "nav.gps.headingTrue",
          hdm: "nav.gps.headingMag",
          brg: "nav.wp.course"
        },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("Course over ground (COG)", "cog"),
              opt("Heading — True (HDT)", "hdt"),
              opt("Heading — Magnetic (HDM)", "hdm"),
              opt("Bearing to waypoint (BRG)", "brg"),
              opt("Compass — True (HDT) [Graphic]", "hdtGraphic"),
              opt("Compass — Magnetic (HDM) [Graphic]", "hdmGraphic")
            ],
            default: "cog",
            name: "Kind"
          },

          leadingZero: {
            type: "BOOLEAN",
            default: true,
            name: "Leading zero (e.g., 005°)"
          },

          // ThreeElements thresholds — only for numeric kinds
          ratioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
            name: "3-Rows Threshold (numeric)",
            condition: [{ kind: "cog" }, { kind: "hdt" }, { kind: "hdm" }, { kind: "brg" }]
          },
          ratioThresholdFlat: {
            type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
            name: "1-Row Threshold (numeric)",
            condition: [{ kind: "cog" }, { kind: "hdt" }, { kind: "hdm" }, { kind: "brg" }]
          },

          // CompassGauge thresholds — only for graphic kinds
          compRatioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.8,
            name: "Compass 2-Rows Threshold",
            condition: [{ kind: "hdtGraphic" }, { kind: "hdmGraphic" }]
          },
          compRatioThresholdFlat: {
            type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.2,
            name: "Compass 1-Row Threshold",
            condition: [{ kind: "hdtGraphic" }, { kind: "hdmGraphic" }]
          },

          // Shared caption/unit-to-value scale applies to both numeric & graphic
          captionUnitScale: {
            type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
            name: "Caption/Unit to Value scale"
          },

          // hide low-levels
          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,

          ...makePerKindTextParams(COURSE_KIND)
        }
      }
    },
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Speed",
        description: "SOG/STW selection (numeric or SpeedGauge graphic)",
        caption: "", unit: "", default: "---",
        cluster: "speed",
        storeKeys: { sog: "nav.gps.speed", stw: "nav.gps.waterSpeed" },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("Speed over ground (SOG)", "sog"),
              opt("Speed through water (STW)", "stw"),
              opt("SpeedGauge — SOG [Graphic]", "sogGraphic"),
              opt("SpeedGauge — STW [Graphic]", "stwGraphic")
            ],
            default: "sog",
            name: "Kind"
          },

          // ThreeElements thresholds — only numeric kinds
          ratioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
            name: "3-Rows Threshold (numeric)",
            condition: [{ kind: "sog" }, { kind: "stw" }]
          },
          ratioThresholdFlat: {
            type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
            name: "1-Row Threshold (numeric)",
            condition: [{ kind: "sog" }, { kind: "stw" }]
          },

          // SpeedGauge thresholds — only graphic kinds
          speedRatioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
            name: "SpeedGauge: Normal Threshold",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },
          speedRatioThresholdFlat: {
            type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
            name: "SpeedGauge: Flat Threshold",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },

          // SpeedGauge range (arc is fixed in SpeedGauge.js: 270..450)
          minValue: {
            type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
            name: "Min speed",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },
          maxValue: {
            type: "FLOAT", min: 1, max: 200, step: 0.5, default: 30,
            name: "Max speed",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },

          // SpeedGauge ticks (value-units)
          tickMajor: {
            type: "FLOAT", min: 0.5, max: 100, step: 0.5, default: 5,
            name: "Major tick step",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },
          tickMinor: {
            type: "FLOAT", min: 0.1, max: 50, step: 0.1, default: 1,
            name: "Minor tick step",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },
          showEndLabels: {
            type: "BOOLEAN", default: false,
            name: "Show min/max labels",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },

          // SpeedGauge sectors:
          warningFrom: {
            type: "FLOAT", min: 0, max: 200, step: 0.5, default: 20,
            name: "Warning from",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },
          alarmFrom: {
            type: "FLOAT", min: 0, max: 200, step: 0.5, default: 25,
            name: "Alarm from",
            condition: [{ kind: "sogGraphic" }, { kind: "stwGraphic" }]
          },

          // Shared caption/unit-to-value scale (used by SpeedGauge + also fine for numeric)
          captionUnitScale: {
            type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
            name: "Caption/Unit to Value scale"
          },

          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,

          ...makePerKindTextParams(SPEED_KIND)
        }
      }
    },
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Position",
        description: "Boat GPS position or active waypoint position (lat/lon)",
        caption: "", unit: "", default: "---",
        cluster: "position",
        storeKeys: {
          boat: "nav.gps.position",
          wp: "nav.wp.position",
          wpServer: "nav.wp.server"
        },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("Boat position (GPS)", "boat"),
              opt("Active waypoint position", "wp")
            ],
            default: "boat",
            name: "Kind"
          },
          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,
          ...makePerKindTextParams(POSITION_KIND),
          ...commonThreeElementsEditables
        },
        updateFunction: function(values){
          const out = values ? { ...values } : {};
          const kind = (values && values.kind) || "boat";
          if (kind === "wp" && values && values.wpServer === false) out.disconnect = true;
          return out;
        }
      }
    },
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Distance",
        description: "Waypoint distance, route remaining, anchor distances",
        caption: "", unit: "", default: "---",
        cluster: "distance",
        storeKeys: {
          dst: "nav.wp.distance",
          dstServer: "nav.wp.server",
          route: "nav.route.remain",
          anchor: "nav.anchor.distance",
          watch: "nav.anchor.watchDistance"
        },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("To waypoint (DST)", "dst"),
              opt("Route remaining", "route"),
              opt("From anchor", "anchor"),
              opt("Anchor watch radius", "watch")
            ],
            default: "dst",
            name: "Kind"
          },
          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,
          ...makePerKindTextParams(DISTANCE_KIND),
          ...commonThreeElementsEditables
        },
        updateFunction: function(values){
          const out = values ? { ...values } : {};
          const kind = (values && values.kind) || "dst";
          if (kind === "dst" && values && values.dstServer === false) out.disconnect = true;
          return out;
        }
      }
    },
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Environment",
        description: "Depth below transducer, water temperature, or SignalK pressure",
        caption: "", unit: "", default: "---",
        cluster: "environment",
        storeKeys: {
          depth: "nav.gps.depthBelowTransducer",
          wtemp: "nav.gps.waterTemp"
        },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("Depth below transducer", "depth"),
              opt("Depth gauge (graphic)", "depthGraphic"),
              opt("Water temperature", "wtemp"),
              opt("Pressure (SignalK)", "pressure")
            ],
            default: "depth",
            name: "Kind"
          },

          // SignalK only
          value: {
            type: "KEY",
            default: "",
            name: "SignalK path",
            condition: { kind: "pressure" }
          },

          // -------- DepthGauge (graphic) settings --------------------------------
          minValue: {
            type: "FLOAT", min: 0, max: 200, step: 0.5, default: 0,
            name: "Min depth",
            condition: { kind: "depthGraphic" }
          },
          maxValue: {
            type: "FLOAT", min: 1, max: 500, step: 0.5, default: 30,
            name: "Max depth",
            condition: { kind: "depthGraphic" }
          },

          tickMajor: {
            type: "FLOAT", min: 0.5, max: 200, step: 0.5, default: 5,
            name: "Major tick step",
            condition: { kind: "depthGraphic" }
          },
          tickMinor: {
            type: "FLOAT", min: 0.1, max: 100, step: 0.1, default: 1,
            name: "Minor tick step",
            condition: { kind: "depthGraphic" }
          },

          showEndLabels: {
            type: "BOOLEAN",
            default: false,
            name: "Show min/max labels",
            condition: { kind: "depthGraphic" }
          },

          // shallow-side zones:
          // Alarm (red):   min..alarmFrom
          // Warning (yellow): alarmFrom..warningFrom
          alarmFrom: {
            type: "FLOAT", min: 0, max: 500, step: 0.5, default: 2.0,
            name: "Alarm to (shallow)",
            condition: { kind: "depthGraphic" }
          },
          warningFrom: {
            type: "FLOAT", min: 0, max: 500, step: 0.5, default: 5.0,
            name: "Warning to (shallow)",
            condition: { kind: "depthGraphic" }
          },

          decimals: {
            type: "FLOAT", min: 0, max: 3, step: 1, default: 1,
            name: "Decimals",
            condition: { kind: "depthGraphic" }
          },

          depthRatioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.1,
            name: "DepthGauge: Normal Threshold",
            condition: { kind: "depthGraphic" }
          },
          depthRatioThresholdFlat: {
            type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 3.5,
            name: "DepthGauge: Flat Threshold",
            condition: { kind: "depthGraphic" }
          },

          // Shared caption/unit-to-value scale (numeric + graphic)
          captionUnitScale: {
            type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
            name: "Caption/Unit to Value scale"
          },

          // hide low-levels
          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,

          // per-kind caption/unit
          ...makePerKindTextParams(ENV_KIND),

          // ThreeElements thresholds — only numeric kinds (optional but clean)
          ratioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
            name: "3-Rows Threshold (numeric)",
            condition: [{ kind: "depth" }, { kind: "wtemp" }, { kind: "pressure" }]
          },
          ratioThresholdFlat: {
            type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
            name: "1-Row Threshold (numeric)",
            condition: [{ kind: "depth" }, { kind: "wtemp" }, { kind: "pressure" }]
          }
        },

        updateFunction: function(values){
          const out = values ? { ...values } : {};
          const kind = (values && values.kind) || "depth";

          if (!out.storeKeys) out.storeKeys = {};

          if (kind === "pressure") {
            // ensure storeKeys.value follows the selected SignalK KEY
            if (typeof out.value === "string" && out.value.trim()) {
              out.storeKeys = { ...out.storeKeys, value: out.value.trim() };
            }
          } else {
            // remove leftover pressure subscription when switching away
            if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
              const sk = { ...out.storeKeys };
              delete sk.value;
              out.storeKeys = sk;
            }
          }
          return out;
        }
      }
    },

    // --- WIND (numeric + graphic kinds; WindDial has its own row defaults) ---
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Wind",
        description: "Wind (angle/speed numbers or dial graphics)",
        caption: "", unit: "", default: "---",
        cluster: "wind",
        storeKeys: {
          awa: "nav.gps.windAngle",
          twa: "nav.gps.trueWindAngle",
          twd: "nav.gps.trueWindDirection",
          aws: "nav.gps.windSpeed",
          tws: "nav.gps.trueWindSpeed"
        },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("Angle — True (TWA)", "angleTrue"),
              opt("Angle — Apparent (AWA)", "angleApparent"),
              opt("Angle — True direction (TWD)", "angleTrueDirection"),
              opt("Speed — True (TWS)", "speedTrue"),
              opt("Speed — Apparent (AWS)", "speedApparent"),
              opt("Dial — True wind (TWA/TWS)", "angleTrueGraphic"),
              opt("Dial — Apparent wind (AWA/AWS)", "angleApparentGraphic")
            ],
            default: "angleTrue",
            name: "Kind"
          },

          leadingZero: {
            type: "BOOLEAN",
            default: true,
            name: "Leading zero for angles (e.g., 005)",
            condition: [
              { kind: "angleTrue" },
              { kind: "angleApparent" },
              { kind: "angleTrueDirection" },
              { kind: "angleTrueGraphic" },
              { kind: "angleApparentGraphic" }
            ]
          },

          // Graphic kind labels/units
          angleCaption_TWA: { type: "STRING", default: "TWA", name: "Angle caption", condition: { kind: "angleTrueGraphic" } },
          speedCaption_TWS: { type: "STRING", default: "TWS", name: "Speed caption", condition: { kind: "angleTrueGraphic" } },
          angleCaption_AWA: { type: "STRING", default: "AWA", name: "Angle caption", condition: { kind: "angleApparentGraphic" } },
          speedCaption_AWS: { type: "STRING", default: "AWS", name: "Speed caption", condition: { kind: "angleApparentGraphic" } },
          angleUnitGraphic: {
            type: "STRING",
            default: "°",
            name: "Angle unit",
            condition: [{ kind: "angleTrueGraphic" }, { kind: "angleApparentGraphic" }]
          },
          speedUnitGraphic: {
            type: "STRING",
            default: "kn",
            name: "Speed unit",
            condition: [{ kind: "angleTrueGraphic" }, { kind: "angleApparentGraphic" }]
          },

          // WindDial-only row thresholds
          dialRatioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 0.7,
            name: "Dial 3-Rows Threshold",
            condition: [{ kind: "angleTrueGraphic" }, { kind: "angleApparentGraphic" }]
          },
          dialRatioThresholdFlat: {
            type: "FLOAT", min: 1.0, max: 6.0, step: 0.05, default: 2.0,
            name: "Dial 1-Row Threshold",
            condition: [{ kind: "angleTrueGraphic" }, { kind: "angleApparentGraphic" }]
          },

          // ThreeElements thresholds — only for numeric kinds
          ratioThresholdNormal: {
            type: "FLOAT", min: 0.5, max: 2.0, step: 0.05, default: 1.0,
            name: "3-Rows Threshold (numeric)",
            condition: [{ kind: "angleTrue" }, { kind: "angleApparent" }, { kind: "angleTrueDirection" }]
          },
          ratioThresholdFlat: {
            type: "FLOAT", min: 1.5, max: 6.0, step: 0.05, default: 3.0,
            name: "1-Row Threshold (numeric)",
            condition: [{ kind: "angleTrue" }, { kind: "angleApparent" }, { kind: "angleTrueDirection" }]
          },

          // Symmetric layline range
          layMin: {
            type: "FLOAT", min: 0, max: 180, step: 1, default: 25,
            name: "Layline min °",
            condition: [{ kind: "angleTrueGraphic" }, { kind: "angleApparentGraphic" }]
          },
          layMax: {
            type: "FLOAT", min: 0, max: 180, step: 1, default: 45,
            name: "Layline max °",
            condition: [{ kind: "angleTrueGraphic" }, { kind: "angleApparentGraphic" }]
          },

          // Shared caption/unit-to-value scale applies to both numeric & graphic
          captionUnitScale: {
            type: "FLOAT", min: 0.5, max: 1.5, step: 0.05, default: 0.8,
            name: "Caption/Unit to Value scale"
          },

          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,

          ...makePerKindTextParams(WIND_KIND),
        }
      }
    },

    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_LargeTime",
        description: "Local time (large clock, HH:MM:SS)",
        caption: "TIME", unit: "", default: "---",
        cluster: "time",
        storeKeys: { value: "nav.gps.rtime" },
        editableParameters: {
          caption: true,
          unit: true,
          formatter: false,
          formatterParameters: false,
          value: true,
          className: true,
          ...commonThreeElementsEditables
        }
      }
    },
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Nav",
        description: "Navigation values (ETA / Route ETA / DST / Route distance / VMG / Clock / Positions)",
        caption: "", unit: "", default: "---",
        cluster: "nav",
        storeKeys: {
          eta:         "nav.wp.eta",
          rteEta:      "nav.route.eta",
          dst:         "nav.wp.distance",
          rteDistance: "nav.route.remain",
          vmg:         "nav.wp.vmg",
          clock:       "nav.gps.rtime",
          positionBoat:"nav.gps.position",
          positionWp:  "nav.wp.position"
        },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("ETA to waypoint", "eta"),
              opt("ETA for route", "rteEta"),
              opt("Distance to waypoint (DST)", "dst"),
              opt("Remaining route distance", "rteDistance"),
              opt("VMG to waypoint", "vmg"),
              opt("Clock (local time)", "clock"),
              opt("Boat position (GPS)", "positionBoat"),
              opt("Active waypoint position", "positionWp")
            ],
            default: "eta",
            name: "Kind"
          },
          leadingZero: {
            type: "BOOLEAN",
            default: true,
            name: "Leading zero for bearings (ignored unless bearing-like)",
            condition: []
          },
          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,
          ...makePerKindTextParams(NAV_KIND),
          ...commonThreeElementsEditables
        }
      }
    },
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Anchor",
        description: "Anchor metrics (distance, watch radius, bearing)",
        caption: "", unit: "", default: "---",
        cluster: "anchor",
        storeKeys: {
          distance: "nav.anchor.distance",
          watch:    "nav.anchor.watchDistance",
          bearing:  "nav.anchor.direction"
        },
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [
              opt("Distance from anchor", "distance"),
              opt("Anchor watch radius", "watch"),
              opt("Bearing from anchor", "bearing")
            ],
            default: "distance",
            name: "Kind"
          },
          leadingZero: {
            type: "BOOLEAN",
            default: true,
            name: "Leading zero for bearing (e.g., 005°)",
            condition: { kind: "bearing" }
          },
          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,
          ...makePerKindTextParams(ANCHOR_KIND),
          ...commonThreeElementsEditables
        }
      }
    },
    {
      module: "ClusterHost",
      def: {
        name: "dyninstruments_Vessel",
        description: "Vessel system metrics (voltage via SignalK KEY)",
        caption: "", unit: "", default: "---",
        cluster: "vessel",
        storeKeys: {},
        editableParameters: {
          kind: {
            type: "SELECT",
            list: [ opt("Voltage (SignalK)", "voltage") ],
            default: "voltage",
            name: "Kind"
          },
          value: {
            type: "KEY",
            default: "",
            name: "SignalK path (voltage)",
            condition: { kind: "voltage" }
          },
          caption: false,
          unit: false,
          formatter: false,
          formatterParameters: false,
          className: true,
          ...makePerKindTextParams(VESSEL_KIND),
          ...commonThreeElementsEditables
        },
        updateFunction: function(values){
          const out = values ? { ...values } : {};
          const kind = (values && values.kind) || "voltage";
          if (out && out.storeKeys && kind !== "voltage") {
            if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
              const sk = { ...out.storeKeys };
              delete sk.value;
              out.storeKeys = sk;
            }
          }
          return out;
        }
      }
    }
  ];

  const LEGACY = [];
  const INSTRUMENTS = EXPOSE_LEGACY ? CLUSTERS.concat(LEGACY) : CLUSTERS;

  // ---------- Module loading with dependencies ------------------------------
  const loadCache = new Map();

  function loadModule(id) {
    if (loadCache.has(id)) return loadCache.get(id);
    const m = MODULES[id];
    if (!m) {
      const p = Promise.reject(new Error("Unknown module: " + id));
      loadCache.set(id, p);
      return p;
    }
    const deps = Array.isArray(m.deps) ? m.deps : [];
    const depLoads = Promise.all(deps.map(loadModule));

    const p = depLoads.then(() =>
      Promise.all([
        loadCssOnce("dyni-css-" + id, m.css),
        loadScriptOnce("dyni-js-" + id, m.js)
      ])
    ).then(() => {
      const ns = (window.DyniModules || {});
      const mod = ns[m.globalKey];
      if (!mod || typeof mod.create !== "function") {
        throw new Error("Module not found or invalid: " + m.globalKey);
      }
      return mod;
    });

    loadCache.set(id, p);
    return p;
  }

  function uniqueModules(list) {
    const result = new Set();
    function addWithDeps(id){
      if (!MODULES[id] || result.has(id)) return;
      result.add(id);
      const deps = MODULES[id].deps || [];
      deps.forEach(addWithDeps);
    }
    list.forEach(i => addWithDeps(i.module));
    return Array.from(result);
  }

  // ---------- Widget registration -------------------------------------------
  function registerInstrument(mod, inst) {
    const spec = mod.create(inst.def, Helpers) || {};

    const defaultClass = "dyniplugin";
    const mergedClassName = [defaultClass, inst.def.className, spec.className]
      .filter(Boolean).join(" ");

    const storeKeys = spec.storeKeys || inst.def.storeKeys ||
                      (inst.def.storeKey ? { value: inst.def.storeKey } : undefined);

    const renderCanvas      = typeof spec.renderCanvas      === "function" ? spec.renderCanvas      : undefined;
    const renderHtml        = typeof spec.renderHtml        === "function" ? spec.renderHtml        : undefined;
    const initFunction      = typeof spec.initFunction      === "function" ? spec.initFunction      : undefined;
    const finalizeFunction  = typeof spec.finalizeFunction  === "function" ? spec.finalizeFunction  : undefined;
    const translateFunction = typeof spec.translateFunction === "function" ? spec.translateFunction : undefined;

    function composeUpdates(){
      const fns = Array.prototype.slice.call(arguments).filter(fn => typeof fn === 'function');
      if (!fns.length) return undefined;
      return function(values){
        return fns.reduce((acc, fn) => {
          const r = fn.call(this, acc);
          return (r && typeof r === 'object') ? r : acc;
        }, values);
      };
    }

    const updateFunction = composeUpdates(spec.updateFunction, inst.def.updateFunction);

    const wantsHide = !!spec.wantsHideNativeHead;
    function wrapRenderCanvas(fn) {
      if (!fn) return undefined;
      return function (canvas, props) {
        if (wantsHide && !canvas.__dyniMarked) {
          const root = canvas.closest(".widget, .DirectWidget") || canvas.parentElement;
          if (root && !root.hasAttribute("data-dyni")) root.setAttribute("data-dyni", "");
          canvas.__dyniMarked = true;
        }
        return fn.apply(this, [canvas, props]);
      };
    }

    const perInstrumentDefaults = defaultsFromEditableParams(inst.def.editableParameters);

    const baseDef = {
      name:        inst.def.name,
      description: inst.def.description || inst.def.name,
      caption:     inst.def.caption || "",
      unit:        inst.def.unit || "",
      default:     inst.def.default || "---",
      storeKeys,
      className: mergedClassName,

      cluster: inst.def.cluster,
      ...perInstrumentDefaults,

      renderCanvas: wrapRenderCanvas(renderCanvas),
      renderHtml,
      initFunction,
      finalizeFunction,
      translateFunction,
      updateFunction
    };

    const editable = inst.def.editableParameters || {};
    avnav.api.registerWidget(baseDef, editable);
  }

  const needed = uniqueModules(INSTRUMENTS);
  Promise.all(needed.map(loadModule))
    .then((mods) => {
      const byId = {};
      mods.forEach(m => byId[m.id] = m);
      INSTRUMENTS.forEach(inst => {
        const mod = byId[inst.module];
        if (!mod) { console.warn("dyninstruments: module not loaded", inst.module, inst.def?.name); return; }
        registerInstrument(mod, inst);
      });
      avnav.api.log("dyninstruments modular init ok (wind/compass clustered): " + INSTRUMENTS.length + " widgets");
    })
    .catch(e => console.error("dyninstruments init failed:", e));
})();
