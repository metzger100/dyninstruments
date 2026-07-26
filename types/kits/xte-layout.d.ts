// Ambient types for XTE layout kits (highway/linear layout results, render setup, metrics).

type DyniXteMode = "flat" | "high" | "normal";

interface DyniXteMetricRects {
  cog: DyniRect;
  btw: DyniRect;
  xte: DyniRect;
  dtw: DyniRect;
}

interface DyniXteLayoutArgs {
  contentRect?: DyniRect;
  responsive?: DyniResponsiveScaleProfile;
  gap?: unknown;
  mode?: unknown;
  hideTextualMetrics?: unknown;
  showWpName?: unknown;
  hasWaypointName?: unknown;
  flatHighwayShare?: unknown;
  flatGaugeShare?: unknown;
  flatHeaderRatio?: unknown;
  highTopRatio?: unknown;
  highHighwayRatio?: unknown;
  highGaugeRatio?: unknown;
  normalHighwayRatio?: unknown;
  normalGaugeRatio?: unknown;
  normalNameHeightRatio?: unknown;
}

interface DyniXteHighwayInsets {
  pad: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniXteHighwayLayoutResult {
  mode: DyniXteMode;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
  contentRect: DyniRect;
  highway: DyniRect;
  nameRect: DyniRect | null;
  metricRects: DyniXteMetricRects | null;
}

interface DyniXteHighwayLayoutApi {
  id: "XteHighwayLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): DyniXteMode;
  computeInsets(W: unknown, H: unknown): DyniXteHighwayInsets;
  createContentRect(W: number, H: number, insets: { pad: number }): DyniRect;
  computeLayout(args?: unknown): DyniXteHighwayLayoutResult;
  computeMetricTileSpacing(
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ): DyniIntrinsicTileSpacing;
}

interface DyniXteLinearInsets {
  padX: number;
  padY: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniXteLinearLayoutResult {
  mode: DyniXteMode;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
  contentRect: DyniRect;
  gaugeBar: DyniRect;
  nameRect: DyniRect | null;
  metricRects: DyniXteMetricRects | null;
}

interface DyniXteLinearLayoutApi {
  id: "XteLinearLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): DyniXteMode;
  computeInsets(W: unknown, H: unknown): DyniXteLinearInsets;
  createContentRect(W: unknown, H: unknown, insets?: Record<string, unknown>): DyniRect;
  computeLayout(args?: unknown): DyniXteLinearLayoutResult;
  computeMetricTileSpacing(
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ): DyniIntrinsicTileSpacing;
}

type DyniXteLinearData = Record<string, unknown> & {
  disconnect?: unknown;
  wpName?: unknown;
  xte?: unknown;
  cog?: unknown;
  dtw?: unknown;
  btw?: unknown;
};

type DyniXteLinearLayoutConfig = Record<string, unknown> & {
  easing?: unknown;
  hideTextualMetrics?: unknown;
  showWpName?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  tickMajor?: unknown;
  tickMinor?: unknown;
  showEndLabels?: unknown;
  leadingZero?: unknown;
};

interface DyniXteLinearThemeSection {
  widthFactor?: unknown;
  lineWidthFactor?: unknown;
  majorLenFactor?: unknown;
  majorWidthFactor?: unknown;
  minorLenFactor?: unknown;
  minorWidthFactor?: unknown;
  depthFactor?: unknown;
  sideFactor?: unknown;
  fontFactor?: unknown;
  insetFactor?: unknown;
}

type DyniXteLinearTheme = DyniRadialResolvedTheme & {
  surface: { fg: string };
  colors: { pointer: string; alarm: string };
  linear: {
    track: DyniXteLinearThemeSection;
    ticks: DyniXteLinearThemeSection;
    pointer: DyniXteLinearThemeSection;
    labels: DyniXteLinearThemeSection;
  };
};

interface DyniXteLinearThemeResolver {
  resolveForRoot(rootEl: unknown): DyniXteLinearTheme;
}

type DyniXteLinearToolkit = DyniGaugeToolkitApi & {
  theme: DyniXteLinearThemeResolver;
};

type DyniXteLinearContext = DyniComponentContext & {
  canvas: DyniCanvasHostApi;
};

interface DyniXteLinearGeometry {
  primaryDim: number;
  trackThickness: number;
  trackLineWidth: number;
  majorTickLen: number;
  majorTickWidth: number;
  minorTickLen: number;
  minorTickWidth: number;
  pointerDepth: number;
  pointerSide: number;
  x0: number;
  x1: number;
  trackY: number;
  labelFontPx: number;
  labelInset: number;
}

interface DyniXteDisplayNormalizedProps {
  display: Record<string, unknown>;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  formatUnits: Record<string, unknown>;
  layoutConfig: Record<string, unknown>;
  easingEnabled: boolean;
  hideTextualMetrics: boolean;
  xteScale: number;
}

interface DyniXteDisplayPropsNormalizeApi {
  read(p: DyniWidgetValues): DyniXteDisplayNormalizedProps;
}

interface DyniXteRenderThemeView {
  family: unknown;
  labelWeight: unknown;
  [key: string]: unknown;
}

interface DyniXteRenderSetupArgs {
  componentContext: DyniComponentContext & {
    canvas: DyniCanvasHostApi;
    dom: { requirePluginRoot(target: unknown): unknown };
  };
  toolkit: { theme: { resolveForRoot(rootEl: unknown): unknown } };
  canvas: HTMLCanvasElement;
  props: DyniWidgetValues;
  resolveThemeView(theme: unknown, stableDigitsEnabled: boolean): DyniXteRenderThemeView;
  resolveStateKind(props: DyniWidgetValues): string;
  stateScreenLabels: { KINDS: Readonly<Record<string, string>> };
  stateScreenCanvasOverlay: { drawStateScreen(args: Record<string, unknown>): void };
  stateScreenColor(theme: unknown, themeView: DyniXteRenderThemeView): string;
}

interface DyniXteRenderSetupResult {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  theme: unknown;
  themeView: DyniXteRenderThemeView;
}

interface DyniXteDisplayRenderSetupApi {
  resolveRenderSetup(args: DyniXteRenderSetupArgs): DyniXteRenderSetupResult | null;
}

interface DyniXteDynamicXteResult {
  xteNumber: number | undefined;
  xteAvailable: boolean;
  xteDistance: string;
  xteDistanceMissing: boolean;
  xteSide: string;
  defaultText: string;
  dtwDistance: string;
  cogRaw: unknown;
  btwRaw: unknown;
  headingParams: [boolean];
}

interface DyniXteDisplayMetricsBuildResult {
  metricSpacing: Record<"cog" | "xte" | "dtw" | "btw", DyniIntrinsicTileSpacing>;
  metrics: Record<"cog" | "xte" | "dtw" | "btw", { caption: unknown; value: string; unit: unknown }>;
}

interface DyniXteDynamicOptions {
  springMotion: DyniSpringMotion;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  geom: DyniHighwayGeom;
  colors: DyniHighwayColors;
  primaryDim: number;
  theme: DyniRadialResolvedTheme;
  display: Record<string, unknown>;
  formatUnits: Record<string, unknown>;
  layoutConfig: Record<string, unknown>;
  props: DyniWidgetValues;
  xteScale: number;
  easingEnabled: boolean;
}

interface DyniXteStableDigitsOptions {
  ctx: CanvasRenderingContext2D;
  xteDistance: string;
  xteSide: string;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  family: unknown;
  valueWeight: unknown;
  labelWeight: unknown;
  layout: DyniXteHighwayLayoutResult;
  metricSpacing: Record<"cog" | "xte" | "dtw" | "btw", DyniIntrinsicTileSpacing>;
  metricRects: DyniXteMetricRects;
}

interface DyniXteMetricsOptions {
  ctx: CanvasRenderingContext2D;
  dyn: DyniXteDynamicXteResult;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  stableDigitsEnabled: boolean;
  themeView: DyniXteRenderThemeView;
  layout: DyniXteHighwayLayoutResult;
  metricRects: DyniXteMetricRects;
}

interface DyniXteDisplayMetricsApi {
  resolveAndDrawDynamicXte(options: DyniXteDynamicOptions): DyniXteDynamicXteResult;
  buildXteMetrics(options: DyniXteMetricsOptions): DyniXteDisplayMetricsBuildResult;
}

interface DyniXteLinearEndLabelOptions {
  ctx: CanvasRenderingContext2D;
  theme: DyniXteLinearTheme;
  geom: DyniXteLinearGeometry;
  ticks: DyniLinearTicks;
  showEndLabels: boolean;
  family: unknown;
  labelWeight: unknown;
}

interface DyniXteLinearPrimitivesApi {
  resolveGeometry(layout: DyniXteLinearLayoutResult, theme: DyniXteLinearTheme): DyniXteLinearGeometry;
  drawEndLabels(options: DyniXteLinearEndLabelOptions): void;
  drawPointerUpward(ctx: CanvasRenderingContext2D, x: number, geom: DyniXteLinearGeometry, color: string): void;
  drawTrackLayer(ctx: CanvasRenderingContext2D, geom: DyniXteLinearGeometry, color: string): void;
  drawTicksLayer(
    ctx: CanvasRenderingContext2D,
    geom: DyniXteLinearGeometry,
    ticks: DyniLinearTicks,
    xteScale: number,
    color: string
  ): void;
}

interface DyniXteLinearDynamicResult {
  xteNumber: number | undefined;
  xteHasValue: boolean;
  defaultText: string;
  xteDistance: string;
  xteDistanceMissing: boolean;
}

interface DyniXteLinearMetricsResult {
  cog: { caption: unknown; value: string; unit: unknown };
  xte: { caption: unknown; value: string; unit: unknown };
  dtw: { caption: unknown; value: string; unit: unknown };
  btw: { caption: unknown; value: string; unit: unknown };
}

interface DyniXteLinearPointerOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  geom: DyniXteLinearGeometry;
  theme: DyniXteLinearTheme;
  display: DyniXteLinearData;
  formatUnits: DyniXteLinearData;
  props: DyniWidgetValues;
  xteScale: number;
  easingEnabled: boolean;
}

interface DyniXteLinearStableDigitsOptions {
  ctx: CanvasRenderingContext2D;
  xteDistance: string;
  xteSide: string;
  captions: DyniXteLinearData;
  units: DyniXteLinearData;
  family: unknown;
  valueWeight: unknown;
  labelWeight: unknown;
  layout: DyniXteLinearLayoutResult;
  metricRects: DyniXteMetricRects | null;
}

interface DyniXteLinearMetricsOptions {
  display: DyniXteLinearData;
  formatUnits: DyniXteLinearData;
  layoutConfig: DyniXteLinearLayoutConfig;
  defaultText: string;
  xteValueText: string;
  captions: DyniXteLinearData;
  units: DyniXteLinearData;
}

interface DyniXteLinearDynamicMetricsApi {
  isPointerMotionActive(canvas: HTMLCanvasElement): boolean;
  resolveAndDrawLinearPointer(options: DyniXteLinearPointerOptions): DyniXteLinearDynamicResult;
  resolveStableDigitsXteTextLinear(options: DyniXteLinearStableDigitsOptions): string;
  buildLinearMetrics(options: DyniXteLinearMetricsOptions): DyniXteLinearMetricsResult;
}
