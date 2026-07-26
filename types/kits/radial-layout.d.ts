// Ambient types for the radial kit's geometry/layout result shapes and
// text-layout render states/displays (full-circle and semicircle).

interface DyniFullCircleGeom {
  D: number;
  R: number;
  cx: number;
  cy: number;
  rOuter: number;
  ringW: number;
  majorTickLen: number;
  majorTickWidth: number;
  minorTickLen: number;
  minorTickWidth: number;
  arcLineWidth: number;
  pointerDepth: number;
  pointerSide: number;
  fixedPointerDepth: number;
  markerLen: number;
  markerWidth: number;
  leftStrip: number;
  rightStrip: number;
  topStrip: number;
  bottomStrip: number;
  labelInsetVal: number;
  labelPx: number;
  labelRadius: number;
}

interface DyniFullCircleSlots {
  leftTop: DyniRect | null;
  leftBottom: DyniRect | null;
  rightTop: DyniRect | null;
  rightBottom: DyniRect | null;
  top: DyniRect | null;
  bottom: DyniRect | null;
}

interface DyniFullCircleLabels {
  radiusOffset: number;
  fontPx: number;
  spriteRadius: number;
}

interface DyniFullCircleNormal {
  safeRadius: number;
  compactCenterHeight: number;
  dualCompactWidth: number;
  dualCompactInset: number;
  dualCompactHeight: number;
}

interface DyniFullCircleLayout {
  mode: string;
  pad: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
  textFillScale: number;
  compactGeometryScale: number;
  contentRect: DyniRect;
  geom: DyniFullCircleGeom;
  labels: DyniFullCircleLabels;
  slots: DyniFullCircleSlots;
  flat: {
    leftTop: DyniRect | null;
    leftBottom: DyniRect | null;
    rightTop: DyniRect | null;
    rightBottom: DyniRect | null;
  } | null;
  high: { top: DyniRect | null; bottom: DyniRect | null } | null;
  normal: DyniFullCircleNormal;
}

interface DyniFullCircleLayoutArgs {
  W?: unknown;
  H?: unknown;
  mode?: unknown;
  theme?: DyniRadialResolvedTheme;
  insets?: DyniRadialInsets;
  responsive?: DyniResponsiveScaleProfile;
  layoutConfig?: DyniRadialConfigMap;
}

interface DyniRadialInsets {
  pad: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniFullCircleRadialLayoutApi {
  id: "FullCircleRadialLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): "flat" | "high" | "normal";
  computeInsets(W: unknown, H: unknown): DyniRadialInsets;
  computeLayout(args?: DyniFullCircleLayoutArgs): DyniFullCircleLayout;
}

interface DyniSemicircleGeom {
  availW: number;
  availH: number;
  R: number;
  gaugeLeft: number;
  gaugeTop: number;
  cx: number;
  cy: number;
  rOuter: number;
  ringW: number;
  majorTickLen: number;
  majorTickWidth: number;
  minorTickLen: number;
  minorTickWidth: number;
  arcLineWidth: number;
  pointerDepth: number;
  pointerSide: number;
}

interface DyniSemicircleLabels {
  radiusOffset: number;
  fontPx: number;
}

interface DyniRadialMajorValueLabelsOptions {
  ctx: CanvasRenderingContext2D;
  family: unknown;
  geom: DyniSemicircleGeom;
  labels: DyniSemicircleLabels;
  minV: number;
  maxV: number;
  majorStep: unknown;
  arc: DyniArc;
  showEndLabels: unknown;
  labelWeight: unknown;
}

interface DyniRadialMajorValueLabelsApi {
  id: "RadialMajorValueLabels";
  drawMajorValueLabels(options: DyniRadialMajorValueLabelsOptions): void;
}

interface DyniSemicircleNormal {
  extra: number;
  innerMargin: number;
  rSafe: number;
  yBottom: number;
  mhMax: number;
  mhMin: number;
}

interface DyniSemicircleLayout {
  mode: string;
  contentRect: DyniRect;
  pad: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
  textFillScale: number;
  compactGeometryScale: number;
  geom: DyniSemicircleGeom;
  labels: DyniSemicircleLabels;
  flat: { box: DyniRect; topBox: DyniRect; bottomBox: DyniRect };
  high: { bandBox: DyniRect };
  normal: DyniSemicircleNormal;
}

interface DyniSemicircleLayoutArgs {
  W?: unknown;
  H?: unknown;
  mode?: unknown;
  theme?: DyniRadialResolvedTheme;
  insets?: DyniRadialInsets;
  responsive?: DyniResponsiveScaleProfile;
}

interface DyniSemicircleRadialLayoutApi {
  id: "SemicircleRadialLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): "flat" | "high" | "normal";
  computeInsets(W: unknown, H: unknown): DyniRadialInsets;
  computeLayout(args?: DyniSemicircleLayoutArgs): DyniSemicircleLayout;
}

interface DyniBlockSizes {
  cPx: number;
  vPx: number;
  uPx: number;
  hCap: number;
  hVal: number;
  hUnit: number;
}

interface DyniFullCircleDisplay {
  caption: unknown;
  value: unknown;
  unit: unknown;
  secScale: number;
}

interface DyniFullCircleRenderState {
  ctx: CanvasRenderingContext2D;
  family: unknown;
  valueWeight: unknown;
  labelWeight: unknown;
  textFillScale: number;
  text: DyniRadialTextApi;
  layout: DyniFullCircleLayout;
  slots: DyniFullCircleSlots;
  geom: DyniFullCircleGeom;
  labels: DyniFullCircleLabels;
  theme: DyniRadialResolvedTheme;
  __dyniFullCircleBlockMeasureCache?: Record<string, DyniBlockSizes>;
}

interface DyniFullCircleModeOptions {
  side?: unknown;
  align?: unknown;
  slot?: unknown;
  leftAlign?: unknown;
  rightAlign?: unknown;
}

interface DyniFullCircleNormalConfig {
  innerMarginFactor: number;
  minHeightFactor: number;
  dualGapFactor: number;
}

interface DyniFullCircleSingleCandidate {
  blockHeight: number;
  boxWidth: number;
  score: number;
  sizes: DyniBlockSizes;
}

interface DyniFullCircleDualCandidate {
  blockHeight: number;
  halfWidth: number;
  score: number;
  leftSizes: DyniBlockSizes;
  rightSizes: DyniBlockSizes;
}

interface DyniFullCircleRadialMeasureApi {
  id: "FullCircleRadialMeasure";
  resolveSecondaryScale(value: unknown): number;
  growSize(currentSize: unknown, ceilingSize: unknown, textFillScale: unknown): number;
  normalConfig(state: DyniFullCircleRenderState): DyniFullCircleNormalConfig;
  boostValueUnitFit(
    state: DyniFullCircleRenderState,
    fit: DyniValueUnitFitResult | null,
    unitText: unknown,
    boxHeight: unknown
  ): DyniValueUnitFitResult;
  boostInlineFit(
    state: DyniFullCircleRenderState,
    fit: DyniInlineCapValUnitFitResult | null,
    caption: unknown,
    unitText: unknown,
    boxHeight: unknown
  ): DyniInlineCapValUnitFitResult;
  measureBlockSizes(
    state: DyniFullCircleRenderState,
    display: DyniFullCircleDisplay,
    boxWidth: unknown,
    blockHeight: unknown
  ): DyniBlockSizes;
  mergeBlockSizes(leftSizes: DyniBlockSizes, rightSizes: DyniBlockSizes): DyniBlockSizes;
  scoreSingleCandidate(
    display: DyniFullCircleDisplay,
    sizes: DyniBlockSizes,
    boxWidth: number,
    blockHeight: number
  ): number;
  scoreDualCandidate(
    leftDisplay: DyniFullCircleDisplay,
    rightDisplay: DyniFullCircleDisplay,
    leftSizes: DyniBlockSizes,
    rightSizes: DyniBlockSizes,
    halfWidth: number,
    blockHeight: number
  ): number;
  selectSingleCandidate(
    state: DyniFullCircleRenderState,
    display: DyniFullCircleDisplay,
    effectiveRadius: number,
    minHeightFactor: number
  ): DyniFullCircleSingleCandidate | null;
  selectDualCandidate(
    state: DyniFullCircleRenderState,
    left: DyniFullCircleDisplay,
    right: DyniFullCircleDisplay,
    effectiveRadius: number,
    columnGap: number,
    minHeightFactor: number
  ): DyniFullCircleDualCandidate | null;
}

interface DyniFullCircleRadialDrawingApi {
  id: "FullCircleRadialDrawing";
  drawSingleFlat(
    state: DyniFullCircleRenderState,
    display: DyniFullCircleDisplay,
    opts?: DyniFullCircleModeOptions
  ): void;
  drawSingleHigh(
    state: DyniFullCircleRenderState,
    display: DyniFullCircleDisplay,
    opts?: DyniFullCircleModeOptions
  ): void;
  drawSingleNormal(state: DyniFullCircleRenderState, display: DyniFullCircleDisplay): void;
  drawDualNormal(state: DyniFullCircleRenderState, left: DyniFullCircleDisplay, right: DyniFullCircleDisplay): void;
}

interface DyniFullCircleRadialTextLayoutApi {
  id: "FullCircleRadialTextLayout";
  drawSingleModeText(
    state: DyniFullCircleRenderState,
    mode: string,
    display: DyniFullCircleDisplay,
    opts?: DyniFullCircleModeOptions
  ): void;
  drawDualModeText(
    state: DyniFullCircleRenderState,
    mode: string,
    left: DyniFullCircleDisplay,
    right: DyniFullCircleDisplay,
    opts?: DyniFullCircleModeOptions
  ): void;
}

interface DyniSemicircleDisplay {
  caption: unknown;
  valueText: unknown;
  unit: unknown;
  secScale: unknown;
  hideTextualMetrics?: unknown;
}

interface DyniSemicircleRenderState {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  family: unknown;
  color: unknown;
  theme: DyniRadialResolvedTheme;
  valueWeight: unknown;
  labelWeight: unknown;
  text: DyniRadialTextApi;
  value: DyniValueMathApi;
  layout: DyniSemicircleLayout;
  geom: DyniSemicircleGeom;
  responsive: DyniResponsiveScaleProfile;
  textFillScale: number;
}

interface DyniSemicircleRadialTextLayoutApi {
  id: "SemicircleRadialTextLayout";
  createFitCache(modeList?: unknown): DyniFitCache;
  drawModeText(state: DyniSemicircleRenderState, display: DyniSemicircleDisplay, fitCache: DyniFitCache): void;
}
