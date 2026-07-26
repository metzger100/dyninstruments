// Ambient types for the linear gauge layout/theme shapes
// (LinearGaugeLayout, LinearGaugeLayoutVariants, LinearGaugeLayoutApi and related theme/config shapes).

interface DyniLinearDrawOptions {
  [key: string]: unknown;
}

interface DyniLinearCanvasPrimitivesApi {
  id: "LinearCanvasPrimitives";
  drawTrack(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, opts?: DyniLinearDrawOptions): void;
  drawBand(
    ctx: CanvasRenderingContext2D,
    x0: number,
    x1: number,
    y: number,
    thickness: unknown,
    opts?: DyniLinearDrawOptions
  ): void;
  drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, len: unknown, opts?: DyniLinearDrawOptions): void;
  drawPointer(ctx: CanvasRenderingContext2D, x: number, y: number, opts?: DyniLinearDrawOptions): void;
}

interface DyniLinearGaugeMathApi {
  id: "LinearGaugeMath";
  keyToText: DyniValueMathApi["keyToText"];
  clamp: DyniValueMathApi["clamp"];
  mapValueToX(value: unknown, minV: number, maxV: number, x0: number, x1: number, doClamp?: boolean): number;
  resolveAxisDomain(axisMode: string, range: DyniLinearRange): DyniLinearRange;
  buildTicks(minV: number, maxV: number, majorStepRaw: unknown, minorStepRaw: unknown): DyniLinearTicks;
  formatTickLabel(value: number): string;
}

interface DyniLinearGaugeLayout {
  mode: unknown;
  responsive: DyniResponsiveScaleProfile;
  captionBox?: DyniRect | null;
  valueBox?: DyniRect | null;
  scaleX0: number;
  scaleX1: number;
  trackY: number;
  trackBox: DyniRect;
  inlineBox?: DyniRect | null;
  trackThickness: number;
  trackLineWidth: number;
  majorTickLen: number;
  majorTickWidth: number;
  minorTickLen: number;
  minorTickWidth: number;
  pointerDepth: number;
  pointerSide: number;
  labelFontPx: number;
  labelInsetPx: number;
  dualRowGap?: number;
  textTopBox?: DyniRect | null;
  textBottomBox?: DyniRect | null;
}

interface DyniLinearGaugeLayoutVariantsApi {
  id: "LinearGaugeLayoutVariants";
  computeFlatLayout(
    contentRect: DyniRect,
    right: number,
    gap: number,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi
  ): DyniLinearLayoutBlock;
  computeStackedLayout(
    contentRect: DyniRect,
    bottom: number,
    gap: number,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi
  ): DyniLinearLayoutBlock;
  computeSplitHighLayout(contentRect: DyniRect, gap: number): DyniLinearLayoutBlock;
  computeGraphicsOnlyFlatLayout(contentRect: DyniRect): DyniLinearLayoutBlock;
  computeGraphicsOnlyNormalLayout(contentRect: DyniRect, right: number): DyniLinearLayoutBlock;
  computeGraphicsOnlyHighLayout(contentRect: DyniRect): DyniLinearLayoutBlock;
  computeInlineLayout(
    contentRect: DyniRect,
    right: number,
    bottom: number,
    gap: number,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi
  ): DyniLinearLayoutBlock;
}

interface DyniLinearGaugeLayoutApi {
  id: "LinearGaugeLayout";
  computeMode(W: unknown, H: unknown, thresholdNormal: unknown, thresholdFlat: unknown): "flat" | "high" | "normal";
  computeInsets(W: unknown, H: unknown): { pad: number; gap: number; responsive: DyniResponsiveScaleProfile };
  createContentRect(W: unknown, H: unknown, insets: { pad: number }): DyniRect;
  computeLayout(args?: unknown): DyniLinearGaugeLayout;
  splitCaptionValueRows(
    captionBox: DyniRect | null | undefined,
    valueBox: DyniRect | null | undefined,
    secScale: unknown
  ): { captionBox: DyniRect | null | undefined; valueBox: DyniRect | null | undefined };
}

interface DyniLinearLayoutThemeSection {
  track: { widthFactor: unknown; lineWidthFactor: unknown };
  ticks: {
    majorLenFactor: unknown;
    majorWidthFactor: unknown;
    minorLenFactor: unknown;
    minorWidthFactor: unknown;
  };
  pointer: { depthFactor: unknown; sideFactor: unknown };
  labels: { fontFactor: unknown; insetFactor: unknown };
}

interface DyniLinearLayoutTheme {
  strokeWeight: unknown;
  pointerDepthWeight: unknown;
  pointerSideWeight: unknown;
  linear: DyniLinearLayoutThemeSection;
}

interface DyniLinearLayoutConfig {
  contentRect?: DyniRect;
  insets?: DyniLinearLayoutInsets;
  W?: unknown;
  H?: unknown;
  gap?: unknown;
  responsive?: DyniResponsiveScaleProfile;
  theme: DyniLinearLayoutTheme;
  mode?: "flat" | "high" | "normal";
  layoutConfig?: Record<string, unknown>;
  hideTextualMetrics?: boolean;
}

interface DyniLinearLayoutBlock {
  scaleX0: number;
  scaleX1: number;
  trackY: number;
  trackBox: DyniRect;
  captionBox: DyniRect | null;
  valueBox: DyniRect | null;
  inlineBox: DyniRect | null;
  dualRowGap: number;
  inlineDualGap: number;
  textTopBox: DyniRect | null;
  textBottomBox: DyniRect | null;
}

interface DyniLinearLayoutInsets {
  pad: number;
  gap: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniLinearGaugeTheme {
  colors: { pointer: unknown; warning: unknown; alarm: unknown; laylinePort?: unknown; laylineStb?: unknown };
}
