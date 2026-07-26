// Ambient types for canvas text measurement/fitting primitives: single/multi
// row fit results, inline triplet fit, and the CanvasTextFitting/CanvasTextLayout
// APIs.

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
