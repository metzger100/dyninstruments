// Pending ambient types for the radial rendering widget-kit cluster.
// These interfaces are candidates for promotion into types/dyni-globals.d.ts.
// Declaration merges extend the shared interfaces defined elsewhere.

// --- shared context / value-math extensions -------------------------------

// Host DOM helper used by the radial engines to resolve the plugin root.
interface DyniRadialHostDom {
  requirePluginRoot(canvas: unknown): HTMLElement;
}

interface DyniComponentContext {
  dom: DyniRadialHostDom;
}

// HtmlWidgetUtils member consumed by the radial text-layout modules.
interface DyniHtmlWidgetUtilsApi {
  buildTextOptions(state: unknown): unknown;
}

// Text-drawing facade as consumed by the radial text-layout modules. The
// radial callers invoke measureValueUnitFit without the trailing textOptions
// argument, so it is modelled here with that shorter call shape.
interface DyniRadialTextApi {
  fitTextPx: DyniCanvasTextLayoutApi["fitTextPx"];
  fitInlineCapValUnit: DyniCanvasTextLayoutApi["fitInlineCapValUnit"];
  drawThreeRowsBlock: DyniCanvasTextLayoutApi["drawThreeRowsBlock"];
  drawValueUnitWithFit: DyniCanvasTextLayoutApi["drawValueUnitWithFit"];
  drawCaptionMax: DyniCanvasTextLayoutApi["drawCaptionMax"];
  drawInlineCapValUnit: DyniCanvasTextLayoutApi["drawInlineCapValUnit"];
  measureValueUnitFit(
    ctx: CanvasRenderingContext2D,
    family: unknown,
    value: unknown,
    unit: unknown,
    w: unknown,
    h: unknown,
    secScale: unknown,
    valueWeight: unknown,
    labelWeight: unknown
  ): DyniValueUnitFitResult;
}

// Value-math members consumed by the radial engines beyond the base surface.
interface DyniValueMathApi {
  isFiniteNumber(value: unknown): boolean;
  normalizeRange(
    minRaw: unknown,
    maxRaw: unknown,
    defaultMin: unknown,
    defaultMax: unknown
  ): { min: number; max: number; range: number };
  formatMajorLabel(value: unknown): string;
}

// RadialAngleMath exposes the canvas-radian conversion beyond the base surface.
interface DyniRadialAngleMathApi {
  degToCanvasRad(deg: unknown, cfg?: DyniAngleConfig | null, rotationDeg?: unknown): number;
}

// --- theme shapes ----------------------------------------------------------

// A theme config node whose leaf values are numeric factors read defensively.
interface DyniRadialConfigMap {
  [key: string]: unknown;
}

interface DyniRadialThemeConfig {
  ring: DyniRadialConfigMap;
  labels: DyniRadialConfigMap;
  ticks: DyniRadialConfigMap;
  pointer: DyniRadialConfigMap;
  fullCircle?: DyniRadialConfigMap;
}

interface DyniRadialResolvedThemeFont {
  weight: unknown;
  labelWeight: unknown;
  family: unknown;
  familyMono?: unknown;
}

interface DyniRadialResolvedTheme {
  font: DyniRadialResolvedThemeFont;
  surface: { fg: unknown };
  colors: { pointer: unknown; warning: unknown; alarm: unknown; laylinePort?: unknown; laylineStb?: unknown };
  opacity?: { caption?: unknown; unit?: unknown };
  radial: DyniRadialThemeConfig;
  strokeWeight?: unknown;
  pointerDepthWeight?: unknown;
  pointerSideWeight?: unknown;
}

// Theme resolver reached through GaugeToolkit.theme on the radial toolkit.
interface DyniGaugeThemeResolver {
  resolveForRoot(rootEl: unknown): DyniRadialResolvedTheme;
}

// --- canvas primitives / frame renderer -----------------------------------

// Canvas-2D state applied inside withCtx save/restore blocks. All values are
// host-supplied and narrowed inside the primitive before assignment.
interface DyniCtxStyle {
  alpha?: unknown;
  strokeStyle?: unknown;
  fillStyle?: unknown;
  lineWidth?: unknown;
  lineCap?: unknown;
  lineJoin?: unknown;
  dash?: unknown;
}

// Options bag shared by the radial draw primitives; every key is host input.
interface DyniRadialDrawOptions {
  angleCfg?: DyniAngleConfig;
  [key: string]: unknown;
}

interface DyniRadialCanvasPrimitivesApi {
  id: "RadialCanvasPrimitives";
  withCtx(ctx: CanvasRenderingContext2D, fn: () => void, style?: DyniCtxStyle): void;
  drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, opts?: DyniRadialDrawOptions): void;
  drawArcRing(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    startDeg: unknown,
    endDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
  drawAnnularSector(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    opts?: DyniRadialDrawOptions
  ): void;
  drawArrow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    angleDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
  drawPointerAtRim(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    angleDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
  drawRimMarker(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    angleDeg: unknown,
    opts?: DyniRadialDrawOptions
  ): void;
}

interface DyniRadialFrameRendererApi {
  id: "RadialFrameRenderer";
  drawTicksFromAngles(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    angles?: DyniRadialTickAngles,
    opts?: DyniRadialDrawOptions
  ): void;
  drawTicks(ctx: CanvasRenderingContext2D, cx: number, cy: number, rOuter: number, opts?: DyniRadialDrawOptions): void;
  drawLabels(ctx: CanvasRenderingContext2D, cx: number, cy: number, rOuter: number, opts?: DyniRadialDrawOptions): void;
  drawDialFrame(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rOuter: number,
    opts?: DyniRadialDrawOptions
  ): void;
}

// Combined draw facade exposed by the radial toolkit.
interface DyniRadialDrawApi {
  drawRing: DyniRadialCanvasPrimitivesApi["drawRing"];
  drawArcRing: DyniRadialCanvasPrimitivesApi["drawArcRing"];
  drawAnnularSector: DyniRadialCanvasPrimitivesApi["drawAnnularSector"];
  drawArrow: DyniRadialCanvasPrimitivesApi["drawArrow"];
  drawPointerAtRim: DyniRadialCanvasPrimitivesApi["drawPointerAtRim"];
  drawRimMarker: DyniRadialCanvasPrimitivesApi["drawRimMarker"];
  drawTicksFromAngles: DyniRadialFrameRendererApi["drawTicksFromAngles"];
  drawTicks: DyniRadialFrameRendererApi["drawTicks"];
  drawLabels: DyniRadialFrameRendererApi["drawLabels"];
  drawDialFrame: DyniRadialFrameRendererApi["drawDialFrame"];
}

interface DyniRadialToolkitApi extends DyniGaugeToolkitApi {
  angle: DyniRadialAngleMathApi;
  tick: DyniRadialTickMathApi;
  draw: DyniRadialDrawApi;
  text: DyniRadialTextApi;
}

// --- RadialValueMath -------------------------------------------------------

interface DyniRadialValueMathApi extends DyniValueMathApi {
  id: "RadialValueMath";
  valueToAngle: DyniRadialAngleMathApi["valueToAngleFlat"];
  angleToValue(angleDeg: unknown, minV: unknown, maxV: unknown, arc: DyniArc, doClamp?: boolean): number;
  buildValueTickAngles(
    minV: number,
    maxV: number,
    majorStep: unknown,
    minorStep: unknown,
    arc: DyniArc
  ): DyniRadialTickAngles;
  sectorAngles: DyniRadialSectorMathApi["sectorAngles"];
  buildHighEndSectors: DyniRadialSectorMathApi["buildHighEndSectors"];
  buildLowEndSectors: DyniRadialSectorMathApi["buildLowEndSectors"];
}

// --- CanvasLayerCache ------------------------------------------------------

type DyniLayerRebuildFn = (
  layerCtx: CanvasRenderingContext2D,
  layerName: string,
  layerCanvas: HTMLCanvasElement
) => void;

interface DyniCanvasLayerCacheLayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

interface DyniCanvasLayerDrawSize {
  W: number;
  H: number;
}

interface DyniCanvasLayerCache {
  ensureLayer(canvas: unknown, key: unknown, rebuildFn: DyniLayerRebuildFn): void;
  blit(targetCtx: CanvasRenderingContext2D): void;
  blitLayer(targetCtx: CanvasRenderingContext2D, layerName: unknown): void;
  invalidate(): void;
}

type DyniCanvasLayerCacheInstance = DyniCanvasLayerCache;

interface DyniCanvasLayerCacheApi {
  id: "CanvasLayerCache";
  createLayerCache(spec?: unknown): DyniCanvasLayerCache;
}

// --- geometry / layout result shapes --------------------------------------

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

// --- text layout render states / displays ---------------------------------

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

// --- engine apis -----------------------------------------------------------

type DyniRadialRenderResult = { wantsFollowUpFrame: boolean } | undefined;

type DyniRadialRenderCanvas = (canvas: unknown, props: unknown) => DyniRadialRenderResult;

interface DyniFullCircleEngineState extends DyniFullCircleRenderState {
  canvas: unknown;
  W: number;
  H: number;
  mode: string;
  color: unknown;
  pad: number;
  gap: number;
  ratio: number;
  responsive: DyniResponsiveScaleProfile;
  draw: DyniRadialDrawApi;
  value: DyniValueMathApi;
  angle: DyniRadialAngleMathApi;
  staticKey: string;
  bufferW: number;
  bufferH: number;
  dpr: number;
}

interface DyniFullCircleRendererApi {
  drawFullCircleRing(targetCtx?: CanvasRenderingContext2D): void;
  drawFullCircleTicks(targetCtx?: CanvasRenderingContext2D, opts?: DyniRadialDrawOptions): void;
  drawFixedPointer(targetCtx?: CanvasRenderingContext2D, angleDeg?: unknown, opts?: DyniRadialDrawOptions): void;
  drawCachedLayer(layerName: unknown, opts?: DyniRadialDrawOptions): void;
  getCacheMeta(key: unknown): unknown;
  setCacheMeta(key: unknown, metaValue: unknown): unknown;
}

type DyniFullCircleRenderHook = (
  state: DyniFullCircleEngineState,
  props: Record<string, unknown>,
  api: DyniFullCircleRendererApi
) => DyniRadialRenderResult;

interface DyniFullCircleRendererSpec {
  ratioProps?: { normal: string; flat: string };
  ratioDefaults?: { normal: number; flat: number };
  hideTextualMetricsProp?: string;
  cacheLayers?: unknown;
  layout?: DyniRadialConfigMap;
  buildStaticKey?: (state: DyniFullCircleEngineState, props: Record<string, unknown>) => unknown;
  rebuildLayer?: (
    layerCtx: CanvasRenderingContext2D,
    layerName: string,
    state: DyniFullCircleEngineState,
    props: Record<string, unknown>,
    api: DyniFullCircleRendererApi
  ) => void;
  drawFrame?: DyniFullCircleRenderHook;
  drawMode?: Record<string, DyniFullCircleRenderHook>;
}

interface DyniFullCircleRadialEngineApi {
  id: "FullCircleRadialEngine";
  createRenderer(spec?: DyniFullCircleRendererSpec): DyniRadialRenderCanvas;
}

interface DyniSemicircleFormattedDisplay {
  num: unknown;
  text: string;
}

interface DyniSemicircleEngineProps {
  [key: string]: unknown;
}

interface DyniSemicirclePropKeys {
  min: string;
  max: string;
}

interface DyniSemicircleTickPropKeys {
  major: string;
  minor: string;
  showEndLabels: string;
}

interface DyniSemicircleRatioPropKeys {
  normal: string;
  flat: string;
}

interface DyniSemicircleRangeDefaults {
  min: number;
  max: number;
}

interface DyniSemicircleRatioDefaults {
  normal: number;
  flat: number;
}

interface DyniSemicircleTickPreset {
  major: unknown;
  minor: unknown;
}

type DyniSemicircleFormatDisplay = (
  rawValue: unknown,
  props: DyniSemicircleEngineProps,
  unitText: unknown,
  componentContext?: DyniComponentContext
) => DyniSemicircleFormattedDisplay;

type DyniSemicircleTickSteps = (range: number) => DyniSemicircleTickPreset;

type DyniSemicircleBuildSectors = (
  props: DyniSemicircleEngineProps,
  min: number,
  max: number,
  arc: DyniArc,
  sectorMath: Pick<DyniRadialSectorMathApi, "sectorAngles" | "buildHighEndSectors" | "buildLowEndSectors">,
  theme: DyniRadialResolvedTheme
) => DyniColoredAngleRange[];

interface DyniSemicircleRendererSpec {
  arc?: DyniArc;
  ratioDefaults?: DyniSemicircleRatioDefaults;
  rangeDefaults?: DyniSemicircleRangeDefaults;
  rangeProps?: DyniSemicirclePropKeys;
  tickProps?: DyniSemicircleTickPropKeys;
  ratioProps?: DyniSemicircleRatioPropKeys;
  hideTextualMetricsProp?: unknown;
  unitDefault?: unknown;
  rawValueKey?: string;
  formatDisplay?: DyniSemicircleFormatDisplay;
  tickSteps?: DyniSemicircleTickSteps;
  buildSectors?: DyniSemicircleBuildSectors;
}

interface DyniSemicircleMemoLayout {
  key: string;
  themeRef: DyniRadialResolvedTheme;
  mode: "flat" | "high" | "normal";
  insets: DyniRadialInsets;
  layout: DyniSemicircleLayout;
}

interface DyniSemicircleRadialEngineApi {
  id: "SemicircleRadialEngine";
  createRenderer(spec?: DyniSemicircleRendererSpec): DyniRadialRenderCanvas;
}

// --- component require overloads ------------------------------------------

interface DyniComponentRequire {
  (id: "RadialCanvasPrimitives"): DyniRadialCanvasPrimitivesApi;
  (id: "RadialFrameRenderer"): DyniRadialFrameRendererApi;
  (id: "RadialToolkit"): DyniRadialToolkitApi;
  (id: "RadialValueMath"): DyniRadialValueMathApi;
  (id: "CanvasLayerCache"): DyniCanvasLayerCacheApi;
  (id: "FullCircleRadialLayout"): DyniFullCircleRadialLayoutApi;
  (id: "FullCircleRadialMeasure"): DyniFullCircleRadialMeasureApi;
  (id: "FullCircleRadialDrawing"): DyniFullCircleRadialDrawingApi;
  (id: "FullCircleRadialTextLayout"): DyniFullCircleRadialTextLayoutApi;
  (id: "FullCircleRadialEngine"): DyniFullCircleRadialEngineApi;
  (id: "SemicircleRadialLayout"): DyniSemicircleRadialLayoutApi;
  (id: "SemicircleRadialTextLayout"): DyniSemicircleRadialTextLayoutApi;
  (id: "RadialMajorValueLabels"): DyniRadialMajorValueLabelsApi;
  (id: "SemicircleRadialEngine"): DyniSemicircleRadialEngineApi;
}
