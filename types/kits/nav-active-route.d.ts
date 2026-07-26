// Ambient types for the active-route nav kit (layout, render model, HTML fit).

interface DyniNavInteractionPolicyApi {
  id: "NavInteractionPolicy";
  canDispatchWhenNotEditing(props: unknown): boolean;
  openActiveRoute(props: unknown): boolean;
}

type DyniActiveRouteLayoutMode = "flat" | "high" | "normal";

interface DyniActiveRouteInsets {
  padX: number;
  innerY: number;
  gap: number;
  namePadX: number;
  responsive: DyniResponsiveScaleProfile;
}

interface DyniActiveRouteMetricRects {
  remain?: DyniRect;
  rteEta?: DyniRect;
  next?: DyniRect;
  [key: string]: DyniRect | undefined;
}

interface DyniActiveRouteLayoutResult {
  mode: DyniActiveRouteLayoutMode;
  gap: number;
  namePadX: number;
  responsive: DyniResponsiveScaleProfile;
  nameRect: DyniRect;
  metricRects: DyniActiveRouteMetricRects;
}

interface DyniActiveRouteLayoutArgs {
  contentRect?: DyniRect;
  responsive?: DyniResponsiveScaleProfile;
  gap?: unknown;
  namePadX?: unknown;
  mode?: unknown;
  isApproaching?: unknown;
  flatNameShare?: unknown;
  highNameBandRatio?: unknown;
  normalNameBandRatio?: unknown;
}

interface DyniActiveRouteLayoutApi {
  id: "ActiveRouteLayout";
  computeInsets(W: unknown, H: unknown): DyniActiveRouteInsets;
  createContentRect(W: unknown, H: unknown, insets?: Partial<DyniActiveRouteInsets>): DyniRect;
  computeLayout(args?: DyniActiveRouteLayoutArgs): DyniActiveRouteLayoutResult;
  computeMetricTileSpacing(
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ): DyniIntrinsicTileSpacing;
}

interface DyniActiveRouteDisplayProps {
  display: DyniActiveRouteData;
  captions: Record<string, unknown>;
  units: Record<string, unknown>;
  formatUnits?: Record<string, unknown>;
  wpServer?: unknown;
  stableDigits?: unknown;
  default: unknown;
  [key: string]: unknown;
}

interface DyniActiveRouteData {
  disconnect?: unknown;
  routeName?: unknown;
  isApproaching?: unknown;
  hideSeconds?: unknown;
  remain?: unknown;
  rteEta?: unknown;
  nextCourse?: unknown;
  [key: string]: unknown;
}

interface DyniActiveRouteRenderModel {
  kind: string;
  stateLabel: string;
  mode: DyniActiveRouteLayoutMode;
  isApproaching: boolean;
  disconnect?: boolean;
  stableDigitsEnabled: boolean;
  routeNameText: string;
  remainCaption: string;
  remainText: string;
  remainPlainText: string;
  remainUnit: string;
  etaCaption: string;
  etaText: string;
  etaPlainText: string;
  etaUnit: string;
  nextCourseCaption: string;
  nextCourseText: string;
  nextCoursePlainText: string;
  nextCourseUnit: string;
  interactionState: unknown;
}

interface DyniActiveRouteMetricSpec extends DyniMetricTileSpec {}

interface DyniActiveRouteMetricStyle {
  captionStyle: string;
  valueStyle: string;
  unitStyle: string;
  gapStyle: string;
}

interface DyniActiveRouteMarkupFit {
  routeNameStyle: string;
  metrics: Record<string, DyniActiveRouteMetricStyle>;
  metricValues?: Record<string, string>;
}

interface DyniActiveRouteHtmlFitArgs {
  model?: DyniActiveRouteRenderModel | null;
  shellRect?: DyniHtmlShellRect | null;
  hostContext?: unknown;
  targetEl?: unknown;
}

interface DyniActiveRouteFitSignatureArgs {
  width?: number;
  height?: number;
  family?: string;
  valueFamily?: string;
  valueWeight?: unknown;
  labelWeight?: unknown;
  model?: DyniActiveRouteRenderModel | null;
}

interface DyniActiveRouteFitCache {
  signature?: string;
  result?: DyniActiveRouteMarkupFit;
}

interface DyniActiveRouteThemeTokens {
  font: {
    weight: unknown;
    labelWeight: unknown;
    family: string;
    familyMono?: string;
  };
}

interface DyniActiveRouteThemeResolver {
  resolveForRoot(rootEl: unknown): DyniActiveRouteThemeTokens;
}

type DyniActiveRouteContext = DyniComponentContext & {
  theme: { tokens: DyniActiveRouteThemeResolver };
};

interface DyniActiveRouteHtmlFitApi {
  id: "ActiveRouteHtmlFit";
  compute(args?: DyniActiveRouteHtmlFitArgs): DyniActiveRouteMarkupFit | null;
  ensureDisplayProps(props: unknown): DyniActiveRouteDisplayProps;
  resolveDisplayMode(
    props: unknown,
    shellRect: DyniHtmlShellRect | null | undefined,
    htmlUtils: DyniHtmlWidgetUtilsApi
  ): DyniActiveRouteLayoutMode;
  formatActiveRouteMetric(
    rawValue: unknown,
    formatter: unknown,
    formatterParameters: unknown,
    defaultText: unknown,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): string;
  textLength: DyniValueMathApi["textLength"];
  normalizeStableValue(
    rawText: string,
    stableDigitsEnabled: boolean,
    stableDigits: DyniStableDigitsApi,
    minWidth: number
  ): DyniStableDigitsTextPair;
}

interface DyniActiveRouteHtmlFitModule {
  id: "ActiveRouteHtmlFit";
  create(def: unknown, componentContext: DyniComponentContext): DyniActiveRouteHtmlFitApi;
}
