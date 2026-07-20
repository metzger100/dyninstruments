module.exports = [
  {
    rule: "catch-fallback-without-suppression",
    severity: "block",
    rel: "runtime/example.js",
    positive: `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) {
      return "fallback";
    }
  }
  runTask();
}());
`,
    clean: `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) {
      throw e;
    }
  }
  runTask();
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- external formatter boundary still degrades to fallback text
    catch (e) {
      return "fallback";
    }
  }
  runTask();
}());
`,
    disableLine: `
(function () {
  "use strict";
  function runTask() {
    try {
      work();
    } catch (e) { return "fallback"; } /* dyni-lint-disable-line catch-fallback-without-suppression -- external formatter boundary still degrades to fallback text */
  }
  runTask();
}());
`
  },
  {
    rule: "internal-hook-fallback",
    severity: "block",
    rel: "shared/example.js",
    positive: `
(function () {
  "use strict";
  function normalizeAxis(candidate, fallbackAxis) {
    return candidate;
  }
  normalizeAxis({}, {});
}());
`,
    clean: `
(function () {
  "use strict";
  function resolveAxis(axis) {
    return axis;
  }
  resolveAxis({});
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  // dyni-lint-disable-next-line internal-hook-fallback -- temporary bridge until hook contract is tightened
  function normalizeAxis(candidate, fallbackAxis) {
    return candidate;
  }
  normalizeAxis({}, {});
}());
`,
    disableLine: `
(function () {
  "use strict";
  function normalizeAxis(candidate, fallbackAxis) { return candidate; } /* dyni-lint-disable-line internal-hook-fallback -- temporary bridge until hook contract is tightened */
  normalizeAxis({}, {});
}());
`
  },
  {
    rule: "redundant-null-type-guard",
    severity: "block",
    rel: "widgets/example.js",
    positive: `
(function () {
  "use strict";
  function renderCanvas() {
    const label = String(labelRaw == null ? "" : labelRaw);
    return label;
  }
  renderCanvas();
}());
`,
    clean: `
(function () {
  "use strict";
  function renderCanvas() {
    const label = String(labelRaw);
    return label;
  }
  renderCanvas();
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function renderCanvas() {
    // dyni-lint-disable-next-line redundant-null-type-guard -- caller contract is still being migrated
    const label = String(labelRaw == null ? "" : labelRaw);
    return label;
  }
  renderCanvas();
}());
`,
    disableLine: `
(function () {
  "use strict";
  function renderCanvas() {
    const label = String(labelRaw == null ? "" : labelRaw); /* dyni-lint-disable-line redundant-null-type-guard -- caller contract is still being migrated */
    return label;
  }
  renderCanvas();
}());
`
  },
  {
    rule: "hardcoded-runtime-default",
    severity: "block",
    rel: "widgets/example.js",
    positive: `
(function () {
  "use strict";
  function renderCanvas() {
    const row = parsed.left || { caption: "", value: "---", unit: "" };
    return row;
  }
  renderCanvas();
}());
`,
    clean: `
(function () {
  "use strict";
  function renderCanvas() {
    return parsed.left;
  }
  renderCanvas();
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function renderCanvas() {
    // dyni-lint-disable-next-line hardcoded-runtime-default -- placeholder survives only until mapper owns this row state
    const row = parsed.left || { caption: "", value: "---", unit: "" };
    return row;
  }
  renderCanvas();
}());
`,
    disableLine: `
(function () {
  "use strict";
  function renderCanvas() {
    const row = parsed.left || { caption: "", value: "---", unit: "" }; /* dyni-lint-disable-line hardcoded-runtime-default -- placeholder survives only until mapper owns this row state */
    return row;
  }
  renderCanvas();
}());
`
  },
  {
    rule: "css-js-default-duplication",
    severity: "block",
    rel: "runtime/example.js",
    positive: `
(function () {
  "use strict";
  function renderCanvas() {
    const fontFamily = fontVar && fontVar.trim() ? fontVar.trim() : DEFAULT_FONT_STACK;
    return fontFamily;
  }
  renderCanvas();
}());
`,
    clean: `
(function () {
  "use strict";
  function renderCanvas() {
    return fontVar.trim();
  }
  renderCanvas();
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function renderCanvas() {
    // dyni-lint-disable-next-line css-js-default-duplication -- typography defaults still live in JS until theme boundary is flattened
    const fontFamily = fontVar && fontVar.trim() ? fontVar.trim() : DEFAULT_FONT_STACK;
    return fontFamily;
  }
  renderCanvas();
}());
`,
    disableLine: `
(function () {
  "use strict";
  function renderCanvas() {
    const fontFamily = fontVar && fontVar.trim() ? fontVar.trim() : DEFAULT_FONT_STACK; /* dyni-lint-disable-line css-js-default-duplication -- typography defaults still live in JS until theme boundary is flattened */
    return fontFamily;
  }
  renderCanvas();
}());
`
  },
  {
    rule: "premature-legacy-support",
    severity: "block",
    rel: "shared/example.js",
    positive: `
(function () {
  "use strict";
  function copy(axis) {
    const fallbackAxis = axis;
    return fallbackAxis;
  }
  copy({});
}());
`,
    clean: `
(function () {
  "use strict";
  function copy(axis) {
    const axisCopy = axis;
    return axisCopy;
  }
  copy({});
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function copy(axis) {
    // dyni-lint-disable-next-line premature-legacy-support -- active migration still references legacy naming in one bridge point
    const fallbackAxis = axis;
    return fallbackAxis;
  }
  copy({});
}());
`,
    disableLine: `
(function () {
  "use strict";
  function copy(axis) {
    const fallbackAxis = axis; /* dyni-lint-disable-line premature-legacy-support -- active migration still references legacy naming in one bridge point */
    return fallbackAxis;
  }
  copy({});
}());
`
  },
  {
    rule: "editable-threshold-missing-internal",
    severity: "block",
    rel: "config/clusters/example.js",
    positive: `
(function (root) {
  "use strict";
  root.DyniPlugin.config.clusters.push({
    def: {
      editableParameters: {
        speedLinearRatioThresholdNormal: { type: "FLOAT", default: 1.1 },
        captionUnitScale: { type: "FLOAT", default: 0.8 }
      }
    }
  });
}(this));
`,
    clean: `
(function (root) {
  "use strict";
  root.DyniPlugin.config.clusters.push({
    def: {
      editableParameters: {
        speedLinearRatioThresholdNormal: { type: "FLOAT", default: 1.1, internal: true },
        captionUnitScale: { type: "FLOAT", default: 0.8 }
      }
    }
  });
}(this));
`,
    disableNextLine: `
(function (root) {
  "use strict";
  root.DyniPlugin.config.clusters.push({
    def: {
      editableParameters: {
        // dyni-lint-disable-next-line editable-threshold-missing-internal -- migration keeps this threshold temporarily user-visible
        speedLinearRatioThresholdNormal: { type: "FLOAT", default: 1.1 },
        captionUnitScale: { type: "FLOAT", default: 0.8 }
      }
    }
  });
}(this));
`,
    disableLine: `
(function (root) {
  "use strict";
  root.DyniPlugin.config.clusters.push({
    def: {
      editableParameters: {
        speedLinearRatioThresholdNormal: { type: "FLOAT", default: 1.1 }, /* dyni-lint-disable-line editable-threshold-missing-internal -- migration keeps this threshold temporarily user-visible */
        captionUnitScale: { type: "FLOAT", default: 0.8 }
      }
    }
  });
}(this));
`
  },
  {
    rule: "absolute-user-home-path",
    severity: "block",
    rel: "runtime/example.js",
    positive: `
(function () {
  "use strict";
  function readPath() {
    const absolute = "/home/alice/Documents/avnav/viewer/util/api.js";
    return absolute;
  }
  readPath();
}());
`,
    clean: `
(function () {
  "use strict";
  function readPath() {
    const absolute = "/home/<user>/project/file.js";
    return absolute;
  }
  readPath();
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function readPath() {
    // dyni-lint-disable-next-line absolute-user-home-path -- test fixture intentionally keeps one real-looking home path sample
    const absolute = "/Users/alice/Documents/avnav/viewer/util/api.js";
    return absolute;
  }
  readPath();
}());
`,
    disableLine: `
(function () {
  "use strict";
  function readPath() {
    const absolute = "/home/alice/Documents/avnav/viewer/util/api.js"; /* dyni-lint-disable-line absolute-user-home-path -- test fixture intentionally keeps one real-looking home path sample */
    return absolute;
  }
  readPath();
}());
`
  },
  {
    rule: "removed-theme-surface-architecture",
    severity: "block",
    rel: "runtime/example.js",
    positive: `
(function () {
  "use strict";
  function wireLegacy(widget) {
    const handlers = namedHandlers(widget);
    widget.eventHandler.catchAll = function () {};
    return handlers;
  }
  wireLegacy({});
}());
`,
    clean: `
(function () {
  "use strict";
  function wireCommitted(widget) {
    return widget;
  }
  wireCommitted({});
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function wireLegacy(widget) {
    // dyni-lint-disable-next-line removed-theme-surface-architecture -- negative fixture for legacy-path rule coverage
    const handlers = namedHandlers(widget);
    return handlers;
  }
  wireLegacy({});
}());
`,
    disableLine: `
(function () {
  "use strict";
  function wireLegacy(widget) {
    const handlers = namedHandlers(widget); /* dyni-lint-disable-line removed-theme-surface-architecture -- negative fixture for legacy-path rule coverage */
    return handlers;
  }
  wireLegacy({});
}());
`
  },
  {
    rule: "legacy-theme-css-input-consumer",
    severity: "block",
    rel: "widgets/text/SampleWidget.css",
    positive: `
.dyni-html-root .sample-value {
  font-weight: var(--dyni-font-weight, 700);
}
`,
    clean: `
.dyni-html-root .sample-value {
  font-weight: var(--dyni-theme-font-weight, 700);
}
`,
    disableNextLine: `
.dyni-html-root .sample-value {
  /* dyni-lint-disable-next-line legacy-theme-css-input-consumer -- negative fixture for css token migration rule coverage */
  font-weight: var(--dyni-font-weight, 700);
}
`,
    disableLine: `
.dyni-html-root .sample-value {
  font-weight: var(--dyni-font-weight, 700); /* dyni-lint-disable-line legacy-theme-css-input-consumer -- negative fixture for css token migration rule coverage */
}
`
  },
  {
    rule: "absent-numeric-sentinel",
    severity: "block",
    rel: "cluster/mappers/SampleMapper.js",
    positive: `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      return {
        renderer: "SpeedRadialWidget",
        warningFrom: props.warningEnabled ? props.warningFrom : NaN
      };
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`,
    clean: `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      return {
        renderer: "SpeedRadialWidget",
        warningFrom: props.warningEnabled ? props.warningFrom : undefined
      };
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      return {
        renderer: "SpeedRadialWidget",
        // dyni-lint-disable-next-line absent-numeric-sentinel -- negative fixture for absent-sentinel rule coverage
        warningFrom: props.warningEnabled ? props.warningFrom : NaN
      };
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`,
    disableLine: `
(function () {
  "use strict";
  function create() {
    function translate(props) {
      return {
        renderer: "SpeedRadialWidget",
        warningFrom: props.warningEnabled ? props.warningFrom : NaN /* dyni-lint-disable-line absent-numeric-sentinel -- negative fixture for absent-sentinel rule coverage */
      };
    }
    return { cluster: "sample", translate: translate };
  }
  return { id: "SampleMapper", create: create };
}());
`
  },
  {
    rule: "mapper-prop-renormalization",
    severity: "block",
    rel: "widgets/text/SampleTextWidget/SampleTextWidget.js",
    positive: `
(function () {
  "use strict";
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    function buildModel(props) {
      const p = props || {};
      return { zoomNumber: toOptionalFiniteNumber(p.zoom) };
    }
    return { id: "MapZoomTextHtmlWidget", buildModel: buildModel };
  }
  return { id: "MapZoomTextHtmlWidget", create: create };
}());
`,
    clean: `
(function () {
  "use strict";
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    function buildModel(props) {
      const p = props || {};
      return { zoomNumber: p.zoom, scaleNumber: p.captionUnitScale };
    }
    return { id: "MapZoomTextHtmlWidget", buildModel: buildModel };
  }
  return { id: "MapZoomTextHtmlWidget", create: create };
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    function buildModel(props) {
      const p = props || {};
      // dyni-lint-disable-next-line mapper-prop-renormalization -- negative fixture for mapper-prop-renormalization rule coverage
      return { zoomNumber: toOptionalFiniteNumber(p.zoom) };
    }
    return { id: "MapZoomTextHtmlWidget", buildModel: buildModel };
  }
  return { id: "MapZoomTextHtmlWidget", create: create };
}());
`,
    disableLine: `
(function () {
  "use strict";
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    function buildModel(props) {
      const p = props || {};
      return { zoomNumber: toOptionalFiniteNumber(p.zoom) }; /* dyni-lint-disable-line mapper-prop-renormalization -- negative fixture for mapper-prop-renormalization rule coverage */
    }
    return { id: "MapZoomTextHtmlWidget", buildModel: buildModel };
  }
  return { id: "MapZoomTextHtmlWidget", create: create };
}());
`
  },
  {
    rule: "unsafe-html-dom-sink",
    severity: "block",
    rel: "widgets/text/SampleHtmlWidget.js",
    positive: `
(function () {
  "use strict";
  function patch(rootEl, markup) {
    rootEl.innerHTML = markup;
    return rootEl;
  }
  patch({}, "<div></div>");
}());
`,
    clean: `
(function () {
  "use strict";
  function renderHtml(props) {
    return "<div class=\\"dyni-html-root\\">" + String(props && props.value) + "</div>";
  }
  renderHtml({ value: 1 });
}());
`,
    disableNextLine: `
(function () {
  "use strict";
  function patch(rootEl, markup) {
    // dyni-lint-disable-next-line unsafe-html-dom-sink -- negative fixture for unsafe-html-dom-sink rule coverage
    rootEl.innerHTML = markup;
    return rootEl;
  }
  patch({}, "<div></div>");
}());
`,
    disableLine: `
(function () {
  "use strict";
  function patch(rootEl, markup) {
    rootEl.innerHTML = markup; /* dyni-lint-disable-line unsafe-html-dom-sink -- negative fixture for unsafe-html-dom-sink rule coverage */
    return rootEl;
  }
  patch({}, "<div></div>");
}());
`
  }
];
