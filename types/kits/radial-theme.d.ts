// Ambient types for the radial kit's shared context/value-math extensions
// and resolved theme shapes.

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
