// Rule definitions for the responsive-layout family in rules-responsive.mjs.

import { runResponsiveLayoutHardFloorRule, runResponsiveProfileOwnershipRule } from "../rules-responsive.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const RESPONSIVE_RULES = [
  {
    name: "responsive-layout-hard-floor",
    severity: "block",
    scope: {
      include: [
        "shared/widget-kits/text/TextLayoutEngine.js",
        "shared/widget-kits/text/TextLayoutComposite.js",
        "shared/widget-kits/text/TextTileLayout.js",
        "shared/widget-kits/nav/ActiveRouteLayout.js",
        "shared/widget-kits/nav/CenterDisplayLayout.js",
        "shared/widget-kits/xte/XteHighwayLayout.js",
        "shared/widget-kits/linear/LinearGaugeLayout.js",
        "shared/widget-kits/linear/LinearGaugeTextLayout.js",
        "shared/widget-kits/radial/SemicircleRadialLayout.js",
        "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
        "shared/widget-kits/radial/FullCircleRadialLayout.js",
        "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
        "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
        "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
        "widgets/linear/WindLinearWidget/WindLinearWidget.js",
        "widgets/radial/WindRadialWidget/WindRadialWidget.js",
        "widgets/radial/CompassRadialWidget/CompassRadialWidget.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runResponsiveLayoutHardFloorRule,
    /** @param {{file: string, line: number, expression: string}} finding */
    message: ({ file, line, expression }) =>
      `[responsive-layout-hard-floor] ${file}:${line}\nResponsive layout/text floor detected (${expression}). Use ResponsiveScaleProfile-derived sizing or add a rule-specific suppression for a technical safety guard.`
  },
  {
    name: "responsive-profile-ownership",
    severity: "block",
    scope: {
      include: [
        "shared/widget-kits/text/TextLayoutEngine.js",
        "shared/widget-kits/text/TextLayoutComposite.js",
        "shared/widget-kits/text/TextTileLayout.js",
        "shared/widget-kits/nav/ActiveRouteLayout.js",
        "shared/widget-kits/nav/CenterDisplayLayout.js",
        "shared/widget-kits/xte/XteHighwayLayout.js",
        "shared/widget-kits/linear/LinearGaugeLayout.js",
        "shared/widget-kits/linear/LinearGaugeEngine.js",
        "shared/widget-kits/linear/LinearGaugeTextLayout.js",
        "shared/widget-kits/radial/SemicircleRadialLayout.js",
        "shared/widget-kits/radial/SemicircleRadialEngine.js",
        "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
        "shared/widget-kits/radial/FullCircleRadialLayout.js",
        "shared/widget-kits/radial/FullCircleRadialEngine.js",
        "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
        "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
        "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
        "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
        "widgets/text/XteDisplayWidget/XteDisplayWidget.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runResponsiveProfileOwnershipRule,
    /** @param {{file: string, line: number, detail: string}} finding */
    message: ({ file, line, detail }) => `[responsive-profile-ownership] ${file}:${line}\n${detail}`
  }
];
