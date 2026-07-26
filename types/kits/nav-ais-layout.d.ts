// Ambient types for the AIS target nav kit layout/geometry/sizing shapes.

type DyniAisTargetLayoutMode = "flat" | "high" | "normal";

type DyniAisTargetMetricId = "dst" | "cpa" | "tcpa" | "brg";

interface DyniAisTargetVerticalShellProfileArgs {
  W?: unknown;
  H?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetVerticalShellProfile {
  isVerticalCommitted: boolean;
  forceHigh: boolean;
  effectiveLayoutHeight: number;
  wrapperStyle: "";
  aspectRatio: "" | "7/8";
  minHeight: "" | "8em";
}

interface DyniAisTargetModeArgs {
  W?: unknown;
  H?: unknown;
  mode?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalCommitted?: unknown;
}

interface DyniAisTargetAccentChrome {
  accentWidth: number;
  accentGap: number;
  accentReserve: number;
}

interface DyniAisTargetInsets extends DyniAisTargetAccentChrome {
  padX: number;
  padY: number;
  identityGap: number;
  identityMetricsGap: number;
  metricGridGap: number;
  responsive: DyniResponsiveScaleProfile;
}

type DyniAisTargetMetricVisibility = Record<DyniAisTargetMetricId, boolean>;

interface DyniAisTargetVisualChromeArgs extends DyniAisTargetModeArgs {
  W?: unknown;
  H?: unknown;
  hasAccent?: unknown;
  mode?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetVisualChrome {
  mode: DyniAisTargetLayoutMode;
  shellWidth: number;
  shellHeight: number;
  effectiveLayoutHeight: number;
  isVerticalCommitted: boolean;
  padX: number;
  padY: number;
  accentWidth: number;
  accentGap: number;
  accentReserve: number;
  stripLeft: number;
  stripTop: number;
  stripBottom: number;
  stripWidth: number;
  stripRadius: number;
  contentLeft: number;
  contentRight: number;
  contentTop: number;
  contentBottom: number;
}

interface DyniAisTargetLayoutSizingApi {
  id: "AisTargetLayoutSizing";
  computeVerticalShellProfile(args?: DyniAisTargetVerticalShellProfileArgs): DyniAisTargetVerticalShellProfile;
  resolveMode(args?: DyniAisTargetModeArgs): DyniAisTargetLayoutMode;
  computeInsets(
    W: unknown,
    H: unknown,
    isVerticalCommitted: boolean,
    mode: DyniAisTargetLayoutMode,
    hasAccent: boolean
  ): DyniAisTargetInsets;
  createContentRect(W: unknown, H: unknown, insets?: DyniAisTargetInsets): DyniRect;
  resolveVisualChrome(args?: DyniAisTargetVisualChromeArgs): DyniAisTargetVisualChrome;
  resolveMetricVisibility(renderState: unknown): DyniAisTargetMetricVisibility;
  resolveMetricOrder(renderState: unknown): DyniAisTargetMetricId[];
  constants: {
    METRIC_ORDER: DyniAisTargetMetricId[];
    VERTICAL_ASPECT_RATIO: { width: number; height: number };
    VERTICAL_MIN_HEIGHT: string;
    RESPONSIVE_SCALES: Record<string, number>;
  };
}

interface DyniAisTargetLayoutArgs {
  W?: unknown;
  H?: unknown;
  mode?: unknown;
  renderState?: unknown;
  showTcpaBranch?: unknown;
  hasAccent?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetComputedLayout {
  mode: DyniAisTargetLayoutMode;
  renderState: DyniAisTargetRenderState;
  showTcpaBranch: boolean;
  responsive: DyniResponsiveScaleProfile;
  isVerticalCommitted: boolean;
  verticalShell: DyniAisTargetVerticalShellProfile;
  shellWidth: number;
  shellHeight: number;
  effectiveLayoutHeight: number;
  hasAccent: boolean;
  insets: DyniAisTargetInsets;
  contentRect: DyniRect;
  accentRect: DyniRect | null;
  placeholderRect: DyniRect;
  identityRect: DyniRect | null;
  wrapperStyle: string;
  inlineGeometry: DyniAisTargetInlineGeometry | null;
  nameRect: DyniRect | null;
  frontRect: DyniRect | null;
  metricsRect: DyniRect | null;
  metricBoxes: Partial<Record<DyniAisTargetMetricId, DyniAisTargetMetricBox>>;
  metricVisibility: DyniAisTargetMetricVisibility;
  metricOrder: DyniAisTargetMetricId[];
}

type DyniAisTargetRenderState = "data" | "hidden" | "placeholder";

interface DyniAisTargetIdentityLayout {
  identityRect: DyniRect;
  nameRect: DyniRect;
  frontRect: DyniRect;
  metricsRect: DyniRect;
}

interface DyniAisTargetLayoutApi {
  id: "AisTargetLayout";
  computeVerticalShellProfile: DyniAisTargetLayoutSizingApi["computeVerticalShellProfile"];
  resolveMode: DyniAisTargetLayoutSizingApi["resolveMode"];
  computeInsets: DyniAisTargetLayoutSizingApi["computeInsets"];
  createContentRect: DyniAisTargetLayoutSizingApi["createContentRect"];
  computeLayout(args?: DyniAisTargetLayoutArgs): DyniAisTargetComputedLayout;
  constants: DyniAisTargetLayoutSizingApi["constants"];
}

interface DyniAisTargetLayoutModule {
  id: "AisTargetLayout";
  create(def: unknown, componentContext: DyniComponentContext): DyniAisTargetLayoutApi;
}

interface DyniAisTargetShellSize {
  width: number;
  height: number;
}

interface DyniAisTargetFormatterArgs {
  value?: unknown;
  formatter?: unknown;
  formatterParameters?: unknown;
  defaultText?: unknown;
}

interface DyniAisTargetStateArgs {
  domain?: unknown;
  isEditingMode?: unknown;
  pageId?: unknown;
  isVerticalContainer?: unknown;
  disconnect?: unknown;
}

interface DyniAisTargetInteractionArgs {
  kind?: unknown;
  canDispatch?: unknown;
  isEditingMode?: unknown;
}

interface DyniAisTargetNormalizedMetricValue {
  valueText: unknown;
  plainValueText: unknown;
}

interface DyniAisTargetBuildModelArgs {
  props?: unknown;
  shellRect?: unknown;
  mode?: unknown;
  isVerticalCommitted?: unknown;
  effectiveLayoutHeight?: unknown;
}

interface DyniAisTargetRenderModel {
  kind: string;
  stateLabel: string;
  mode: DyniAisTargetLayoutMode;
  interactionState: string;
  showTcpaBranch: boolean;
  shellWidth: number;
  shellHeight: number;
  isVerticalCommitted: boolean;
  effectiveLayoutHeight: number;
  wrapperStyle: string;
  inlineGeometry: Partial<DyniAisTargetInlineGeometry>;
  layout: DyniAisTargetComputedLayout;
  captureClicks: boolean;
  showHotspot: boolean;
  stableDigitsEnabled: boolean;
  dispatchMmsi: string;
  nameText: string;
  frontText: string;
  metrics: Record<DyniAisTargetMetricId, DyniAisTargetMetricText & DyniAisTargetNormalizedMetricValue>;
  metricVisibility: DyniAisTargetMetricVisibility;
  visibleMetricIds: DyniAisTargetMetricId[];
  colorRole: string;
  hasAccent: boolean;
  wrapperClasses: string[];
  resizeSignatureParts: Array<string | number>;
}

interface DyniAisTargetRenderModelApi {
  id: "AisTargetRenderModel";
  buildModel(args?: DyniAisTargetBuildModelArgs): DyniAisTargetRenderModel;
  buildResizeSignatureParts(model?: Partial<DyniAisTargetRenderModel>): Array<string | number>;
}

interface DyniAisTargetThemeColors {
  ais?: Record<string, unknown>;
}

interface DyniAisTargetThemeFont {
  family: unknown;
  familyMono?: unknown;
  weight: unknown;
  labelWeight: unknown;
}

interface DyniAisTargetThemeTokens {
  colors?: DyniAisTargetThemeColors;
  font: DyniAisTargetThemeFont;
}

interface DyniAisTargetThemeResolver {
  resolveForRoot(rootEl: unknown): DyniAisTargetThemeTokens;
}

interface DyniAisTargetTypography {
  tokens: DyniAisTargetThemeTokens;
  family: unknown;
  monoFamily: unknown;
}

interface DyniAisTargetMetricValueFitArgs {
  rect: DyniRect;
  valueText?: unknown;
  plainText?: unknown;
  textApi?: DyniCanvasTextLayoutApi;
  ctx?: CanvasRenderingContext2D;
  family?: unknown;
  weight?: unknown;
  textFillScale?: unknown;
}

interface DyniAisTargetMetricValueFit {
  valueText: string;
  valuePx: number;
}

interface DyniAisTargetMetricBoxDetails {
  captionRect: DyniRect | null;
  labelRect: DyniRect | null;
  valueRect: DyniRect | null;
  valueTextRect: DyniRect | null;
  unitRect: DyniRect | null;
}

interface DyniAisTargetMetricBox extends DyniAisTargetMetricBoxDetails, DyniRect {}

interface DyniAisTargetStackedMetricRects {
  captionRect: DyniRect;
  valueRect: DyniRect;
  unitRect: DyniRect;
}

interface DyniAisTargetInlineMetricRects {
  labelRect: DyniRect;
  valueRect: DyniRect;
  valueTextRect: DyniRect;
  unitRect: DyniRect;
}

interface DyniAisTargetInlineMetricSettings {
  labelShare: number;
  labelMinRatio: number;
  labelMaxRatio: number;
  unitShare: number;
  unitMinPx: number;
  unitMaxRatio: number;
  gapRatio: number;
  padXRatio: number;
  padYRatio: number;
  padXFloorPx: number;
  padYFloorPx: number;
  maxPadXTileRatio: number;
  maxPadYTileRatio: number;
}

interface DyniAisTargetInlineMetricBoxOptions {
  mode?: unknown;
}

interface DyniAisTargetWrapperPaddings {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface DyniAisTargetGeometryLayout {
  contentRect?: DyniRect | null;
  shellWidth?: unknown;
  effectiveLayoutHeight?: unknown;
  renderState?: unknown;
  mode?: DyniAisTargetLayoutMode | unknown;
  identityRect?: DyniRect | null;
  nameRect?: DyniRect | null;
  frontRect?: DyniRect | null;
  metricsRect?: DyniRect | null;
  metricBoxes?: Partial<Record<DyniAisTargetMetricId, DyniAisTargetMetricBox>>;
  metricOrder?: DyniAisTargetMetricId[];
  accentRect?: DyniRect | null;
  hasAccent?: unknown;
}

interface DyniAisTargetLayoutGeometryApi {
  id: "AisTargetLayoutGeometry";
  createInlineMetricBox(
    tileRect: DyniRect,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi,
    makeRect: DyniMakeRect,
    options?: DyniAisTargetInlineMetricBoxOptions
  ): DyniAisTargetMetricBox;
  createStackedMetricBox(
    tileRect: DyniRect,
    responsive: DyniResponsiveScaleProfile,
    profileApi: DyniResponsiveScaleProfileApi,
    makeRect: DyniMakeRect
  ): DyniAisTargetMetricBox;
  computeInlineGeometry(layout: unknown): DyniAisTargetInlineGeometry;
}

interface DyniAisTargetLayoutGeometryStylesApi {
  id: "AisTargetLayoutGeometryStyles";
  computeInlineGeometry(layout?: DyniAisTargetGeometryLayout): DyniAisTargetInlineGeometry;
}

interface DyniAisTargetHtmlFitArgs {
  model?: DyniAisTargetRenderModel;
  shellRect?: DyniHtmlShellRect;
  targetEl?: unknown;
  hostContext?: unknown;
}

interface DyniAisTargetHtmlFitApi {
  id: "AisTargetHtmlFit";
  compute(args?: DyniAisTargetHtmlFitArgs): DyniAisTargetMarkupFit | null;
}
