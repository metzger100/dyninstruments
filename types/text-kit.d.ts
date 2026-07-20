// Pending ambient types for the shared text widget-kit modules.
// These interfaces are candidates for promotion into types/dyni-globals.d.ts.

interface DyniValueMathApi {
  clampPositive(value: unknown, defaultValue: number): number;
  computeMode(ratio: unknown, thresholdNormal: unknown, thresholdFlat: unknown): "high" | "flat" | "normal";
}

// Canvas contexts are augmented at runtime with private cache keys. This
// record view is used only for those dynamic string-keyed reads/writes.
type DyniAugmentedCanvas = Record<string, unknown>;

// Generic single-config argument object: `ctx` is a canvas context, every
// other field is host-supplied and treated as unknown until narrowed.
interface DyniTextArgs {
  ctx: CanvasRenderingContext2D;
  [key: string]: unknown;
}

interface DyniValueUnitFitResult {
  vPx: number;
  uPx: number;
  gap: number;
  total: number;
}

interface DyniInlineCapValUnitFitResult {
  cPx: number;
  vPx: number;
  uPx: number;
  g1: number;
  g2: number;
  total: number;
}

interface DyniCanvasTextFittingApi {
  id: "CanvasTextFitting";
  MIN_FONT_PX: number;
  WIDTH_EPSILON: number;
  clampPositive: DyniValueMathApi["clampPositive"];
  setFont(ctx: CanvasRenderingContext2D, px: unknown, weight: unknown, family: unknown): number;
  measureTextWidth(ctx: CanvasRenderingContext2D, text: unknown): number;
  fitTextPx(
    ctx: CanvasRenderingContext2D,
    text: unknown,
    maxW: unknown,
    maxH: unknown,
    family: unknown,
    weight: unknown
  ): number;
  fitSingleTextPx(
    ctx: CanvasRenderingContext2D,
    text: unknown,
    basePx: unknown,
    maxW: unknown,
    maxH: unknown,
    family: unknown,
    weight: unknown
  ): number;
  measureValueUnitFit(
    ctx: CanvasRenderingContext2D,
    family: unknown,
    value: unknown,
    unit: unknown,
    w: unknown,
    h: unknown,
    secScale: unknown,
    valueWeight: unknown,
    labelWeight: unknown,
    textOptions?: unknown
  ): DyniValueUnitFitResult;
  fitInlineCapValUnit(
    ctx: CanvasRenderingContext2D,
    family: unknown,
    caption: unknown,
    value: unknown,
    unit: unknown,
    maxW: unknown,
    maxH: unknown,
    secScale: unknown,
    valueWeight: unknown,
    labelWeight: unknown
  ): DyniInlineCapValUnitFitResult;
}

interface DyniCanvasTextLayoutApi {
  id: "CanvasTextLayout";
  resolveFamily(family: unknown, options: unknown): unknown;
  setFont: DyniCanvasTextFittingApi["setFont"];
  measureTextWidth: DyniCanvasTextFittingApi["measureTextWidth"];
  fitTextPx: DyniCanvasTextFittingApi["fitTextPx"];
  fitSingleTextPx: DyniCanvasTextFittingApi["fitSingleTextPx"];
  measureValueUnitFit: DyniCanvasTextFittingApi["measureValueUnitFit"];
  fitInlineCapValUnit: DyniCanvasTextFittingApi["fitInlineCapValUnit"];
  drawCaptionMax(
    ctx: CanvasRenderingContext2D,
    family: unknown,
    x: unknown,
    y: unknown,
    w: unknown,
    h: unknown,
    caption: unknown,
    capMaxPx: unknown,
    align: unknown,
    labelWeight: unknown,
    textOptions: unknown
  ): void;
  drawValueUnitWithFit(
    ctx: CanvasRenderingContext2D,
    family: unknown,
    x: unknown,
    y: unknown,
    w: unknown,
    h: unknown,
    value: unknown,
    unit: unknown,
    fit: unknown,
    align: unknown,
    valueWeight: unknown,
    labelWeight: unknown,
    textOptions: unknown
  ): void;
  drawInlineCapValUnit(
    ctx: CanvasRenderingContext2D,
    family: unknown,
    x: unknown,
    y: unknown,
    w: unknown,
    h: unknown,
    caption: unknown,
    value: unknown,
    unit: unknown,
    fit: unknown,
    valueWeight: unknown,
    labelWeight: unknown,
    textOptions: unknown
  ): void;
  drawThreeRowsBlock(
    ctx: CanvasRenderingContext2D,
    family: unknown,
    x: unknown,
    y: unknown,
    w: unknown,
    h: unknown,
    caption: unknown,
    value: unknown,
    unit: unknown,
    secScale: unknown,
    align: unknown,
    sizes: unknown,
    valueWeight: unknown,
    labelWeight: unknown,
    textOptions: unknown
  ): void;
}

interface DyniMultiRowMeta {
  px: number;
  rowIndex: number;
  text: string;
  width: number;
  metrics: TextMetrics;
  maxW: number;
  maxH: number;
}

interface DyniFitSingleLineResult {
  px: number;
  width: number;
  metrics: TextMetrics;
}

interface DyniFitMultiRowResult {
  px: number;
  widths: number[];
}

interface DyniFitValueUnitRowResult {
  vPx: number;
  uPx: number;
  vW: number;
  uW: number;
  total: number;
  gap: number;
}

interface DyniInlineTripletFit {
  vPx: number;
  sPx: number;
  cW: number;
  vW: number;
  uW: number;
  total: number;
  gap: number;
}

interface DyniTextLayoutPrimitivesApi {
  id: "TextLayoutPrimitives";
  setFont(ctx: CanvasRenderingContext2D, px: unknown, weight: unknown, family: unknown, options?: unknown): void;
  fitSingleLineBinary(args: unknown): DyniFitSingleLineResult;
  fitMultiRowBinary(args: unknown): DyniFitMultiRowResult;
  fitValueUnitRow(args: unknown): DyniFitValueUnitRowResult;
  fitInlineTriplet(args: unknown): DyniInlineTripletFit;
  drawInlineTriplet(args: unknown): void;
}

interface DyniTextLayoutScaleHelpersApi {
  id: "TextLayoutScaleHelpers";
  clampTextFillScale(value: unknown): number;
  scaleTextCeiling(basePx: unknown, maxPx: unknown, textFillScale: unknown): number;
  resolveTextFillScale(source: unknown): number;
  resolveCompactGeometryScale(textFillScale: unknown): number;
  scaleValueUnitFit(state: unknown, valueText: unknown, unitText: unknown, fit: unknown, boxHeight: unknown): unknown;
  scaleInlineFit(
    state: unknown,
    captionText: unknown,
    valueText: unknown,
    unitText: unknown,
    fit: unknown,
    boxHeight: unknown
  ): unknown;
  resolveOpacity(value: unknown): number;
}

interface DyniThreeRowFit {
  hTop: number;
  hMid: number;
  hBot: number;
  cPx: number;
  vPx: number;
  uPx: number;
}

interface DyniValueUnitCaptionFit {
  hTop: number;
  hBot: number;
  vPx: number;
  uPx: number;
  cPx: number;
  vW: number;
  uW: number;
  total: number;
  gap: number;
}

interface DyniTwoRowsHeaderFit {
  hasHeader: boolean;
  headerH: number;
  row1H: number;
  row2H: number;
  linePx: number;
  align: string;
  capPx: number;
  unitPx: number;
}

interface DyniDrawThreeRowArgs {
  ctx: CanvasRenderingContext2D;
  fit: DyniThreeRowFit;
  captionText: string;
  valueText: string;
  unitText: string;
  [key: string]: unknown;
}

interface DyniDrawValueUnitCaptionArgs {
  ctx: CanvasRenderingContext2D;
  fit: DyniValueUnitCaptionFit;
  captionText: string;
  padX: number;
  [key: string]: unknown;
}

interface DyniDrawTwoRowsHeaderArgs {
  ctx: CanvasRenderingContext2D;
  fit: DyniTwoRowsHeaderFit;
  captionText: string;
  unitText: string;
  topText: string;
  bottomText: string;
  padX: number;
  [key: string]: unknown;
}

interface DyniTextLayoutCompositeApi {
  id: "TextLayoutComposite";
  fitThreeRowBlock(args: unknown): DyniThreeRowFit;
  drawThreeRowBlock(args: unknown): void;
  fitValueUnitCaptionRows(args: unknown): DyniValueUnitCaptionFit;
  drawValueUnitCaptionRows(args: unknown): void;
  fitTwoRowsWithHeader(args: unknown): DyniTwoRowsHeaderFit;
  drawTwoRowsWithHeader(args: unknown): void;
  clampTextFillScale: DyniTextLayoutScaleHelpersApi["clampTextFillScale"];
  scaleTextCeiling: DyniTextLayoutScaleHelpersApi["scaleTextCeiling"];
  resolveTextFillScale: DyniTextLayoutScaleHelpersApi["resolveTextFillScale"];
  resolveCompactGeometryScale: DyniTextLayoutScaleHelpersApi["resolveCompactGeometryScale"];
  resolveOpacity: DyniTextLayoutScaleHelpersApi["resolveOpacity"];
  scaleValueUnitFit: DyniTextLayoutScaleHelpersApi["scaleValueUnitFit"];
  scaleInlineFit: DyniTextLayoutScaleHelpersApi["scaleInlineFit"];
}

interface DyniTextInsets {
  padX: number;
  innerY: number;
  gapBase: number;
}

interface DyniTextResponsiveInsets extends DyniTextInsets {
  responsive: DyniResponsiveScaleProfile;
}

interface DyniModeLayout {
  ratio: number;
  tNormal: unknown;
  tFlat: unknown;
  secScale: number;
  caption: string;
  unit: string;
  hasCaption: boolean;
  hasUnit: boolean;
  baseMode: "high" | "flat" | "normal";
  mode: string;
}

interface DyniFitCacheEntry {
  key: unknown;
  result: unknown;
}

type DyniFitCache = Record<string, DyniFitCacheEntry | null>;

interface DyniTextLayoutEngineApi {
  id: "TextLayoutEngine";
  setFont: DyniTextLayoutPrimitivesApi["setFont"];
  createFitCache(modeList: unknown): DyniFitCache;
  clearFitCache(cache: unknown, mode?: unknown): void;
  makeFitCacheKey(parts: unknown): string;
  readFitCache(cache: unknown, mode: unknown, key: unknown): unknown;
  writeFitCache(cache: unknown, mode: unknown, key: unknown, result: unknown): unknown;
  resolveFitCache(cache: unknown, mode: unknown, key: unknown, computeFn: () => unknown): unknown;
  computeInsets(W: unknown, H: unknown): DyniTextInsets;
  computeResponsiveInsets(W: unknown, H: unknown): DyniTextResponsiveInsets;
  scaleMaxTextPx(basePx: unknown, textFillScale: unknown): number;
  computeModeLayout(args: unknown): DyniModeLayout;
  fitSingleLineBinary: DyniTextLayoutPrimitivesApi["fitSingleLineBinary"];
  fitMultiRowBinary: DyniTextLayoutPrimitivesApi["fitMultiRowBinary"];
  fitValueUnitRow: DyniTextLayoutPrimitivesApi["fitValueUnitRow"];
  fitInlineTriplet: DyniTextLayoutPrimitivesApi["fitInlineTriplet"];
  drawInlineTriplet: DyniTextLayoutPrimitivesApi["drawInlineTriplet"];
  fitThreeRowBlock: DyniTextLayoutCompositeApi["fitThreeRowBlock"];
  drawThreeRowBlock: DyniTextLayoutCompositeApi["drawThreeRowBlock"];
  fitValueUnitCaptionRows: DyniTextLayoutCompositeApi["fitValueUnitCaptionRows"];
  drawValueUnitCaptionRows: DyniTextLayoutCompositeApi["drawValueUnitCaptionRows"];
  fitTwoRowsWithHeader: DyniTextLayoutCompositeApi["fitTwoRowsWithHeader"];
  drawTwoRowsWithHeader: DyniTextLayoutCompositeApi["drawTwoRowsWithHeader"];
}

interface DyniMetricTileMeasurement {
  capH: number;
  capMaxPx: number;
  valueY: number;
  valueH: number;
  valueMaxPx: number;
  textX: number;
  textW: number;
  fit: DyniValueUnitFitResult;
}

interface DyniFittedLineMeasurement {
  px: number;
}

interface DyniMetricTileSpec {
  id: string;
  caption: string;
  value: string;
  plainValue: string;
  unit: string;
}

interface DyniMeasureMetricTileArgs {
  textApi: DyniCanvasTextLayoutApi;
  ctx: CanvasRenderingContext2D;
  metric: DyniMetricTileSpec;
  rect: DyniRect;
  textFillScale?: unknown;
  family?: unknown;
  valueWeight?: unknown;
  labelWeight?: unknown;
  secScale?: unknown;
  padX?: unknown;
  captionHeightPx?: unknown;
  valueTextOptions?: unknown;
}

interface DyniMeasureFittedLineArgs {
  textApi: DyniCanvasTextLayoutApi;
  ctx: CanvasRenderingContext2D;
  text: string;
  maxW: number;
  maxH: number;
  maxPx: number;
  textFillScale?: unknown;
  family?: unknown;
  weight?: unknown;
}

interface DyniContextTileCache {
  metricTiles: Record<string, unknown>;
  fittedLines: Record<string, unknown>;
}

interface DyniTextTileLayoutApi {
  id: "TextTileLayout";
  measureMetricTile(args: unknown): unknown;
  drawMetricTile(args: unknown): unknown;
  measureFittedLine(args: unknown): unknown;
  drawFittedLine(args: unknown): unknown;
}

interface DyniStateScreenCanvasOverlayApi {
  id: "StateScreenCanvasOverlay";
  drawStateScreen(args: unknown): void;
}

interface DyniCenterDisplayStateAdapterApi {
  id: "CenterDisplayStateAdapter";
  renderStateScreenIfNeeded(args: unknown): boolean;
}

interface DyniPositionCoordinateFormatServices {
  componentContext: DyniComponentContext;
  placeholderNormalize: DyniPlaceholderNormalizeApi;
  toOptionalFiniteNumber: DyniValueMathApi["toOptionalFiniteNumber"];
}

interface DyniPositionCoordinateFormattingApi {
  id: "PositionCoordinateFormatting";
  DISPLAY_VARIANT_POSITION: "position";
  TIME_STATUS_SCALE_LIMIT: number;
  normalizeDisplayVariant(value: unknown): string;
  readCoordinatePair(
    value: unknown,
    rawMode: boolean,
    toOptionalFiniteNumber: DyniValueMathApi["toOptionalFiniteNumber"]
  ): { lat: unknown; lon: unknown } | null;
  resolveVariantProps(props: DyniWidgetValues): DyniWidgetValues;
  formatAxisValue(
    rawValue: unknown,
    axis: "lat" | "lon",
    defaultText: string,
    props: DyniWidgetValues,
    services: DyniPositionCoordinateFormatServices
  ): string;
  isTimeStatusMarker(text: string): boolean;
  readActualTextHeight(metrics: unknown): number | null;
}

interface DyniComponentRequire {
  (id: "CanvasTextFitting"): DyniCanvasTextFittingApi;
  (id: "CanvasTextLayout"): DyniCanvasTextLayoutApi;
  (id: "TextLayoutPrimitives"): DyniTextLayoutPrimitivesApi;
  (id: "TextLayoutScaleHelpers"): DyniTextLayoutScaleHelpersApi;
  (id: "TextLayoutComposite"): DyniTextLayoutCompositeApi;
  (id: "TextLayoutEngine"): DyniTextLayoutEngineApi;
  (id: "TextTileLayout"): DyniTextTileLayoutApi;
  (id: "StateScreenCanvasOverlay"): DyniStateScreenCanvasOverlayApi;
  (id: "CenterDisplayStateAdapter"): DyniCenterDisplayStateAdapterApi;
  (id: "PositionCoordinateFormatting"): DyniPositionCoordinateFormattingApi;
}
