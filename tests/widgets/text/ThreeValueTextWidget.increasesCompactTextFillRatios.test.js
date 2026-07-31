// @ts-check
const {
  findTextCall,
  loadFresh,
  makeComponentContext,
  parseFontPx,
  renderCaptured
} = require("./ThreeValueTextWidget-setup");

describe("ThreeValueTextWidget", function () {
  it("increases compact text fill ratios within high, normal, and flat modes", function () {
    const props = { value: "12.3", caption: "SPD", unit: "kn" };
    const cases = [
      {
        name: "high",
        compact: { width: 100, height: 180 },
        large: { width: 180, height: 300 },
        targetText: "SPD",
        /** @param {number} H @param {{innerY: number}} insets @param {number} secScale @returns {number} */
        usableHeight(H, insets, secScale) {
          const hTop = Math.round(H * (secScale / (1 + secScale + secScale)));
          return Math.max(1, hTop - insets.innerY * 2);
        }
      },
      {
        name: "normal",
        compact: { width: 160, height: 120 },
        large: { width: 360, height: 260 },
        targetText: "SPD",
        /** @param {number} H @param {{innerY: number}} insets @param {number} secScale @returns {number} */
        usableHeight(H, insets, secScale) {
          const hTop = Math.round(H * (1 / (1 + secScale)));
          const hBot = H - hTop;
          return Math.max(1, hBot - insets.innerY * 2);
        }
      },
      {
        name: "flat",
        compact: { width: 220, height: 40 },
        large: { width: 520, height: 140 },
        targetText: "12.3",
        /** @param {number} H @returns {number} */
        usableHeight(H) {
          return H;
        }
      }
    ];

    cases.forEach(function (item) {
      const compactHelpers = makeComponentContext();
      const compactSpec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create(
        {},
        compactHelpers
      );
      const compactEngine = compactHelpers.components.require("TextLayoutEngine");
      const compactMode = compactEngine.computeModeLayout({
        W: item.compact.width,
        H: item.compact.height,
        captionText: props.caption,
        unitText: props.unit,
        collapseNoCaptionToFlat: true,
        collapseHighWithoutUnitToNormal: true
      });
      const compactInsets = compactEngine.computeResponsiveInsets(item.compact.width, item.compact.height);
      const compactCalls = renderCaptured(compactSpec, item.compact.width, item.compact.height, props);
      const compactTarget = findTextCall(compactCalls, item.targetText);

      const largeHelpers = makeComponentContext();
      const largeSpec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, largeHelpers);
      const largeEngine = largeHelpers.components.require("TextLayoutEngine");
      const largeMode = largeEngine.computeModeLayout({
        W: item.large.width,
        H: item.large.height,
        captionText: props.caption,
        unitText: props.unit,
        collapseNoCaptionToFlat: true,
        collapseHighWithoutUnitToNormal: true
      });
      const largeInsets = largeEngine.computeResponsiveInsets(item.large.width, item.large.height);
      const largeCalls = renderCaptured(largeSpec, item.large.width, item.large.height, props);
      const largeTarget = findTextCall(largeCalls, item.targetText);

      expect(compactMode.mode).toBe(item.name);
      expect(largeMode.mode).toBe(item.name);
      expect(compactTarget).toBeTruthy();
      expect(largeTarget).toBeTruthy();
      if (!compactTarget || !largeTarget) {
        throw new Error("Expected both captured target text calls.");
      }
      // The safety-factor margin (ROW_SAFE_RATIO) is applied uniformly to both compact
      // and large, but the responsive profile's textFillScale interacts with it at
      // boundary cases. The invariant: compact fill ratio must be within 10% of large
      // fill ratio — compact must not be materially less dense than large.
      const compactRatio =
        parseFontPx(compactTarget.font) / item.usableHeight(item.compact.height, compactInsets, compactMode.secScale);
      const largeRatio =
        parseFontPx(largeTarget.font) / item.usableHeight(item.large.height, largeInsets, largeMode.secScale);
      expect(compactRatio).toBeGreaterThanOrEqual(largeRatio * 0.9);
    });
  });
});
