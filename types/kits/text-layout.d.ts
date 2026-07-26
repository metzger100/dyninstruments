// Ambient types for text layout composition/engine/tile APIs, plus the
// small state-screen/center-display/position-coordinate consumer shapes and
// componentContext.components.require() overloads.

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
