declare const define:
  | undefined
  | {
      amd?: unknown;
      (dependencies: unknown[], factory: () => unknown): unknown;
    };

declare const module:
  | undefined
  | {
      exports?: unknown;
    };

interface Window {
  DyniComponents?: Record<string, unknown>;
  avnav?: { api?: DyniAvnavApi };
  DyniPluginBootstrapCore?: DyniBootstrapCoreApi;
}

declare var DyniComponents: Record<string, unknown> | undefined;

interface DyniClusterRoute {
  cluster: string;
  kind: string;
  mapperId: string;
  rendererId: string;
  viewModelId?: string;
  surface: "html" | "canvas-dom";
  shellSizing: { kind: "ratio"; aspectRatio: number } | { kind: "natural" };
  routeId?: string;
}

interface DyniClusterRoutesConfig {
  schemaVersion: number;
  routes: DyniClusterRoute[];
  byRouteId?: Record<string, DyniClusterRoute>;
}

interface DyniComponentDefinition {
  js: string;
  css?: undefined;
  shadowCss?: string[];
  globalKey: string;
  deps?: string[];
  assets?: DyniAssetDeclaration[];
  apiShape?: "factory" | "module";
}

type DyniComponentRegistryGroup = Record<string, DyniComponentDefinition>;

interface DyniUnitFormatFamily {
  tokens: readonly string[];
  labels: Readonly<Record<string, string>>;
  selectorList?: readonly DyniEditableOption[];
}

interface DyniUnitFormatBinding {
  family: string;
  defaultToken: string;
  rendererKey?: string;
}

interface DyniUnitFormatCatalog {
  families: Readonly<Record<string, DyniUnitFormatFamily>>;
  metricBindings: Readonly<Record<string, DyniUnitFormatBinding>>;
}

interface DyniPluginSharedConfig {
  kindMaps?: Record<string, DyniPerKindTextParameterMap>;
  componentRegistryGroups?: Record<string, DyniComponentRegistryGroup>;
  unitFormatFamilies?: DyniUnitFormatCatalog;
  commonThreeElementsEditables?: DyniEditableParameters;
  makeKindCondition?: (kind: unknown, fallbackKind: string) => DyniEditableCondition;
  makePerKindTextParams?: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makePerKindCaptionParams?: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makeUnitAwareTextParams?: (
    map: DyniPerKindTextParameterMap,
    bindings: Readonly<Record<string, DyniUnitFormatBinding>>
  ) => DyniEditableParameters;
  opt?: (name: unknown, value: unknown) => DyniEditableOption;
  buildEnvironmentEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentBaseEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentDepthEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentModeEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentTemperatureEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentSharedScaleEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentPerKindEditableParameters?: () => DyniEditableParameters;
  buildEnvironmentThresholdEditableParameters?: () => DyniEditableParameters;
  buildVesselVoltageGaugeParams?: () => DyniEditableParameters;
}

interface DyniXteScaleFieldSpec {
  default: number;
  min: number;
  max: number;
  step: number;
}

interface DyniNavClusterSharedConfig extends DyniPluginSharedConfig {
  kindMaps: {
    NAV_TEXT_KIND: DyniPerKindTextParameterMap;
    NAV_UNIT_AWARE_KIND: DyniPerKindTextParameterMap;
  };
  unitFormatFamilies: DyniUnitFormatCatalog;
  commonThreeElementsEditables: DyniEditableParameters;
  makePerKindCaptionParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makePerKindTextParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  makeUnitAwareTextParams: (
    map: DyniPerKindTextParameterMap,
    bindings: Readonly<Record<string, DyniUnitFormatBinding>>
  ) => DyniEditableParameters;
  makeFormatUnitSelectParam: (
    metricKey: string,
    binding: DyniUnitFormatBinding,
    kindDef?: DyniPerKindTextParameterDescriptor
  ) => DyniEditableParameters;
  makePerUnitStringParams: (
    metricKey: string,
    binding: DyniUnitFormatBinding,
    kindDef?: DyniPerKindTextParameterDescriptor
  ) => DyniEditableParameters;
  opt: (name: unknown, value: unknown) => DyniEditableOption;
}

interface DyniNavClusterRoot {
  DyniPlugin: DyniPluginNamespace & {
    config: DyniPluginConfig & {
      clusters: DyniWidgetDefinition[];
      shared: DyniNavClusterSharedConfig;
    };
  };
}

interface DyniVesselClusterSharedConfig extends DyniPluginSharedConfig {
  kindMaps: {
    VESSEL_KIND: DyniPerKindTextParameterMap;
  };
  makePerKindTextParams: (map: DyniPerKindTextParameterMap) => DyniEditableParameters;
  opt: (name: unknown, value: unknown) => DyniEditableOption;
  buildVesselVoltageGaugeParams: () => DyniEditableParameters;
}

interface DyniVesselClusterRoot {
  DyniPlugin: DyniPluginNamespace & {
    config: DyniPluginConfig & {
      clusters: DyniWidgetDefinition[];
      shared: DyniVesselClusterSharedConfig;
    };
  };
}

type DyniClusterConfigValues = Record<string, unknown>;

interface DyniEnvironmentEditableBuilders {
  buildEnvironmentBaseEditableParameters(): DyniEditableParameters;
  buildEnvironmentDepthEditableParameters(): DyniEditableParameters;
  buildEnvironmentModeEditableParameters(): DyniEditableParameters;
  buildEnvironmentTemperatureEditableParameters(): DyniEditableParameters;
  buildEnvironmentSharedScaleEditableParameters(): DyniEditableParameters;
  buildEnvironmentPerKindEditableParameters(): DyniEditableParameters;
  buildEnvironmentThresholdEditableParameters(): DyniEditableParameters;
}

interface DyniPluginConfig {
  bootstrapManifest?: string[];
  clusterRoutes: DyniClusterRoutesConfig;
  clusters?: DyniWidgetDefinition[];
  shared?: DyniPluginSharedConfig;
  components?: DyniComponentRegistryGroup;
  widgetDefinitions?: DyniWidgetDefinition[];
}

interface DyniRuntimeNamespace {
  getAvnavApi?: (rootRef: unknown) => unknown;
  defaultsFromEditableParams?: (editableParams?: DyniEditableParameters | null) => Record<string, unknown>;
  editableParamsForRegistration?: (editableParams?: DyniEditableParameters | null) => Record<string, unknown>;
  format?: DyniFormatService;
  hostActions?: () => unknown;
  registerWidget?: (componentSpec: DyniWidgetComponentSpec, widgetDef: DyniWidgetDefinition) => void;
  _createClusterSurfacePolicy?: () => DyniSurfacePolicy;
  _createCanvasDomSurfaceAdapter?: () => DyniSurfaceControllerFactory;
  _createHtmlSurfaceController?: () => DyniSurfaceControllerFactory;
  surfaces?: DyniSurfaceRuntimeApi;
  createAssetPreloader?: (baseUrl: string) => DyniAssetPreloader;
  assetUrl?: (relativePath: string) => string;
  getAsset?: (key: string) => unknown;
  loadScriptOnce?: DyniBootstrapLoader;
  loadCssOnce?: DyniBootstrapLoader;
  createComponentLoader?: (components: DyniComponentRegistryGroup) => DyniComponentLoader;
  componentLoader?: DyniComponentLoader | null;
  clusterShellRenderer?: DyniClusterShellRendererApi;
  canvas?: {
    setupCanvas(canvas: HTMLCanvasElement): DyniCanvasSurface;
  };
  dom?: {
    requirePluginRoot(target: unknown): Element;
    getNightModeState(rootEl: Element | null | undefined): boolean;
  };
}

interface DyniComponentLoader {
  loadComponent(id: string): Promise<unknown>;
  uniqueComponents(definitions: Array<{ widget: string }>): string[];
  areComponentsLoaded(ids: unknown): boolean;
  createInstance(id: string, definition: DyniWidgetDefinitionData): unknown;
}

interface DyniComposedTreeNode {
  nodeType: number;
  parentNode?: DyniComposedTreeNode | null;
  host?: DyniComposedTreeNode | null;
  closest?(selector: string): Element | null;
}

interface DyniComposedTreeTarget {
  nodeType?: unknown;
  target?: DyniComposedTreeNode | null;
  composedPath?(): Array<DyniComposedTreeNode | null>;
}

interface DyniPluginNamespace {
  config: DyniPluginConfig;
  baseUrl: unknown;
  runtime?: DyniRuntimeNamespace;
  state?: Record<string, unknown>;
  avnavApi?: unknown;
}

declare var DyniPlugin: DyniPluginNamespace;

interface DyniEditableParameterSpec {
  default?: unknown;
  internal?: unknown;
  [key: string]: unknown;
}

type DyniEditableParameters = Record<string, DyniEditableParameterSpec | boolean>;

type DyniEditableCondition = { kind: string } | Array<{ kind: unknown }>;

interface DyniEditableOption {
  name: unknown;
  value: unknown;
}

interface DyniPerKindTextParameterDescriptor {
  kind?: unknown;
  captionName?: unknown;
  unitName?: unknown;
  cap?: unknown;
  unit?: unknown;
}

type DyniPerKindTextParameterMap = Record<string, DyniPerKindTextParameterDescriptor>;

type DyniFormatterCallback = (value: unknown, ...parameters: unknown[]) => unknown;

interface DyniFormatterOptions {
  formatter?: unknown;
  formatterParameters?: unknown;
  default?: unknown;
}

interface DyniAvnavFormatter {
  [formatterName: string]: DyniFormatterCallback | undefined;
}

interface DyniAvnavApi {
  formatter?: DyniAvnavFormatter;
  registerWidget?(definition: Record<string, unknown>, editable: Record<string, unknown>): void;
  log?(...args: unknown[]): void;
}

declare var avnav: { api?: DyniAvnavApi } | undefined;
declare var AVNAV_BASE_URL: string | undefined;

type DyniWidgetValues = Record<string, unknown>;
type DyniWidgetLifecycle = (this: DyniWidgetValues, ...args: unknown[]) => unknown;
type DyniWidgetUpdate = (this: unknown, values: DyniWidgetValues) => unknown;

interface DyniWidgetComponentSpec {
  id?: string;
  wantsHideNativeHead?: unknown;
  className?: unknown;
  storeKeys?: unknown;
  renderHtml?: unknown;
  renderCanvas?: unknown;
  createCommittedRenderer?: unknown;
  initFunction?: unknown;
  finalizeFunction?: unknown;
  translateFunction?: unknown;
  updateFunction?: unknown;
}

interface DyniWidgetDefinitionData {
  name: unknown;
  className?: unknown;
  storeKeys?: unknown;
  storeKey?: unknown;
  updateFunction?: unknown;
  editableParameters?: DyniEditableParameters;
  description?: unknown;
  caption?: unknown;
  unit?: unknown;
  default?: unknown;
  cluster?: unknown;
}

interface DyniWidgetDefinition {
  def: DyniWidgetDefinitionData;
  widget: string;
}

interface DyniSurfaceControllerOptions {
  surface?: unknown;
  hostContext?: unknown;
  rendererId?: unknown;
  props?: unknown;
  [key: string]: unknown;
}

interface DyniSurfaceControllerFactory {
  createSurfaceController(options: DyniSurfaceControllerOptions): unknown;
}

interface DyniSurfacePolicyRouteState {
  route: { rendererId: string };
  props: Record<string, unknown>;
}

interface DyniSurfacePolicy {
  resolveRouteStateWithPolicy(
    routeState: DyniSurfacePolicyRouteState,
    hostContext: unknown
  ): DyniSurfacePolicyRouteState;
  resolveShellWidth(shellEl: unknown): number | undefined;
}

interface DyniSurfaceRuntimeApi {
  createController(options?: DyniSurfaceControllerOptions | null): unknown;
  materializeSurfacePolicyProps(options?: DyniSurfaceControllerOptions | null): Record<string, unknown>;
  getCommonShadowCssUrl(): string;
}

type DyniAssetType = "svg" | "image" | "audio" | "json" | "font";

interface DyniAssetDeclaration {
  key: string;
  path: string;
  type: DyniAssetType;
}

interface DyniAssetRecord {
  status: "pending" | "loaded" | "failed";
  type: DyniAssetType;
  value: unknown;
}

interface DyniAssetFetchResponse {
  ok?: unknown;
  status?: unknown;
  text(): Promise<unknown>;
  arrayBuffer(): Promise<unknown>;
  json(): Promise<unknown>;
}

interface DyniAssetPreloader {
  preloadAssets(assetDeclarations: unknown): Promise<unknown[]>;
  getAsset(key: string): unknown;
}

interface DyniRouteFrame extends Record<string, unknown> {
  cluster?: unknown;
  kind?: unknown;
  __dyniRouteId?: unknown;
  __dyniRawProps?: DyniMapperProps;
}

interface DyniClusterShellHostContext {
  __dyniHostCommitState?: DyniHostCommitState | { instanceId?: unknown } | null;
}

interface DyniClusterShellRendererApi {
  normalizeRouteFrame(rawProps: unknown, def: unknown, clusterRoutes?: unknown): DyniRouteFrame;
  renderRouteShell(
    routeFrame: unknown,
    routeMeta: DyniClusterRoute | null | undefined,
    instanceId: unknown,
    hostContext: DyniClusterShellHostContext | null | undefined
  ): string;
}

interface DyniMapperToolkit {
  cap(kind: string): unknown;
  unit(kind: string): unknown;
  unitText(kind: string, metric: string, token: unknown): unknown;
  formatUnit(kind: string, metric: string): unknown;
  unitNumber(key: string, token: unknown): number | undefined;
  makeAngleFormatter(direction: boolean, leadingZero: boolean, defaultValue: unknown): unknown;
  num(value: unknown): number | undefined;
  out(
    value: unknown,
    caption: unknown,
    unit: unknown,
    formatter: unknown,
    formatterParameters: unknown
  ): Record<string, unknown>;
}

interface DyniMapperViewModel {
  build(props: DyniMapperProps): unknown;
}

interface DyniMapperRouteContextWithViewModel extends DyniMapperRouteContext {
  viewModel?: DyniMapperViewModel | null;
}

interface DyniMapperRouteContext {
  toolkit: DyniMapperToolkit;
}

type DyniMapperProps = Record<string, unknown>;

interface DyniViewModelToolkit {
  cap?(key: string): unknown;
  unit?(key: string): unknown;
  num?(value: unknown): number | undefined;
}

interface DyniActiveRouteViewModelToolkit {
  cap(key: string): unknown;
  unit(key: string): unknown;
  num?(value: unknown): number | undefined;
}

type DyniZeroDirection = "north" | "east" | string;

interface DyniAngleConfig {
  zeroDegAt?: DyniZeroDirection;
  clockwise?: boolean;
}

interface DyniArc {
  startDeg: unknown;
  endDeg: unknown;
}

interface DyniAngleOptions {
  min?: unknown;
  max?: unknown;
  startDeg?: unknown;
  endDeg?: unknown;
  clamp?: boolean;
}

interface DyniAngleRange {
  a0: number;
  a1: number;
}

interface DyniColoredAngleRange extends DyniAngleRange {
  color?: unknown;
}

interface DyniSectorProps {
  warningFrom?: unknown;
  alarmFrom?: unknown;
}

interface DyniSectorOptions {
  warningColor?: unknown;
  alarmColor?: unknown;
  defaultWarningFrom?: unknown;
  defaultAlarmFrom?: unknown;
}

interface DyniRadialTickAngles {
  majors: number[];
  minors: number[];
}

interface DyniLinearRange {
  min: number;
  max: number;
}

interface DyniLinearTicks {
  major: number[];
  minor: number[];
}

type DyniRegattaPhase = "countdown" | "elapsed" | "idle";

interface DyniRegattaTimerPhaseApi {
  id: "RegattaTimerPhase";
  normalize(phase: unknown): DyniRegattaPhase;
}

interface DyniStateScreenInteractionOptions {
  kind?: unknown;
  baseInteraction?: unknown;
}

interface DyniStateScreenInteractionApi {
  id: "StateScreenInteraction";
  resolveInteraction(options?: DyniStateScreenInteractionOptions): unknown;
}

interface DyniStateScreenLabelsApi {
  id: "StateScreenLabels";
  KINDS: Readonly<Record<string, string>>;
  LABELS: Readonly<Record<string, string>>;
}

interface DyniStateScreenPrecedenceApi {
  id: "StateScreenPrecedence";
  pickFirst(candidates: unknown): string;
}

interface DyniValueMathApi {
  ensureObject(value: unknown, name: unknown): object;
  keyToText(value: unknown): string | undefined;
  toText(value: unknown): string;
  toFiniteNumber(value: unknown): number | undefined;
  toOptionalFiniteNumber(value: unknown): number | undefined;
  resolveFiniteNumber(value: unknown, defaultValue: number): number;
  clamp(value: unknown, lo: unknown, hi: unknown): number;
  clampNumber(value: unknown, min: number, max: number, defaultValue: number): number;
  appendUnit(valueText: unknown, displayUnit: unknown, defaultText: unknown): string;
  textLength(value: unknown): number;
  toSafeInteger(value: unknown, defaultValue: number): number;
  isApprox(a: unknown, b: unknown, eps: unknown): boolean;
  almostInt(value: number, eps: unknown): boolean;
  lerp(from: number, to: number, t: number): number;
  formatGaugeDisplay(
    raw: unknown,
    props: DyniFormatterOptions | undefined,
    applyFormatter: (value: number, options: DyniFormatterOptions) => unknown,
    normalize: (text: unknown, defaultText: unknown) => string,
    defaultFormatter: unknown,
    defaultFormatterParameters: unknown
  ): { num: number; text: unknown };
  formatAngle180(value: unknown, leadingZero?: boolean): string;
  formatDirection360(value: unknown, leadingZero?: boolean): string;
  isFiniteNumber(value: unknown): value is number;
  resolveStandardTickSteps(range: unknown): { major: number; minor: number };
  resolveTemperatureTickSteps(range: unknown): { major: number; minor: number };
  resolveVoltageTickSteps(range: unknown): { major: number; minor: number };
}

interface DyniFormatService {
  applyFormatter(value: unknown, options: DyniFormatterOptions): unknown;
}

interface DyniPlaceholderNormalizeApi {
  isPlaceholder(text: unknown): boolean;
  normalize(text: unknown, defaultText?: unknown): string;
}

interface DyniStableDigitsOptions {
  integerWidth?: unknown;
  reserveSignSlot?: boolean;
  sideSuffix?: unknown;
  reserveSideSuffixSlot?: boolean;
  suffix?: unknown;
}

interface DyniStableDigitsTextPair {
  padded: string;
  plain: string;
}

interface DyniStableDigitsApi {
  id: "StableDigits";
  resolveIntegerWidth(textValue: unknown, minWidth: unknown, rangeMax?: unknown): number;
  normalize(rawFormattedText: unknown, options?: DyniStableDigitsOptions): DyniStableDigitsTextPair;
}

interface DyniUnitAwareFormatterApi {
  id: "UnitAwareFormatter";
  formatWithToken(value: unknown, formatter: unknown, token: unknown, defaultText: unknown): string;
  formatDistance(value: unknown, token: unknown, defaultText: unknown): string;
  appendUnit(valueText: unknown, displayUnit: unknown, defaultText: unknown): string;
  extractNumericDisplay(valueText: unknown, defaultValue: number): number;
}

interface DyniNavRatios {
  flat: unknown;
  high: unknown;
  normal: unknown;
}

interface DyniNavModeRatioApi {
  id: "NavModeRatio";
  resolve(mode: unknown, ratios: DyniNavRatios): unknown;
}

interface DyniLatLon {
  lat: number;
  lon: number;
}

interface DyniCourseDistance {
  course: number;
  distance: number;
}

interface DyniCenterDisplayMathApi {
  id: "CenterDisplayMath";
  normalizePoint(value: unknown): DyniLatLon | null;
  computeCourseDistance(srcValue: unknown, dstValue: unknown, useRhumbLine: unknown): DyniCourseDistance | null;
  extractMeasureStart(activeMeasure: unknown): DyniLatLon | null;
}

interface DyniAisIdentityBandHeights {
  nameHeight: number;
  frontHeight: number;
  metricsHeight: number;
}

interface DyniAisTargetLayoutMathApi {
  id: "AisTargetLayoutMath";
  clampNumber: DyniValueMathApi["clampNumber"];
  resolveIdentityBandHeights(
    contentHeight: unknown,
    identityGapPx: unknown,
    identityMetricsGapPx: unknown,
    nameShare: unknown,
    frontShare: unknown,
    frontMinHeight: unknown
  ): DyniAisIdentityBandHeights;
}

interface DyniEditRouteLayoutMathApi {
  id: "EditRouteLayoutMath";
  toFiniteNumber: DyniValueMathApi["toFiniteNumber"];
  toOptionalFiniteNumber: DyniValueMathApi["toOptionalFiniteNumber"];
  clampNumber: DyniValueMathApi["clampNumber"];
}

interface DyniTextFitArgs {
  secondaryToValueRatio?: unknown;
  valueMaxPxRatio?: unknown;
  valuePx?: unknown;
  valueRect?: unknown;
}

interface DyniTextFitMathApi {
  id: "TextFitMath";
  resolveSecondaryMaxPx(args?: DyniTextFitArgs): number;
}

interface DyniLayoutSizingHelpersApi {
  id: "LayoutSizingHelpers";
  createInsetContentRectFactory(
    makeRect: DyniMakeRect,
    padXKey: string,
    padYKey: string
  ): (W: unknown, H: unknown, insets?: Record<string, unknown>) => DyniRect;
  createMetricTileSpacingFactory(
    profileApi: DyniResponsiveScaleProfileApi,
    tilePadRatio: unknown,
    captionRatio: unknown
  ): (
    rect: Partial<DyniRect> | undefined,
    responsive: DyniResponsiveScaleProfile | undefined
  ) => DyniIntrinsicTileSpacing;
}

interface DyniDepthDisplayProps {
  default?: unknown;
  formatter?: unknown;
  formatterParameters?: unknown;
}

interface DyniDepthDisplayResult {
  num: number;
  text: unknown;
}

type DyniDepthFormat = (raw: unknown, props?: DyniDepthDisplayProps) => DyniDepthDisplayResult;

interface DyniDepthDisplayFormatterApi {
  id: "DepthDisplayFormatter";
  formatDisplay(
    raw: unknown,
    props: DyniDepthDisplayProps | undefined,
    unitFormatter: DyniUnitAwareFormatterApi,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): DyniDepthDisplayResult;
  createFormatDisplay(
    unitFormatter: DyniUnitAwareFormatterApi,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): DyniDepthFormat;
  createCanvasFormatDisplay(
    unitFormatter: DyniUnitAwareFormatterApi,
    placeholderNormalize: DyniPlaceholderNormalizeApi
  ): (raw: unknown, props?: DyniDepthDisplayProps) => { num: number; text: string };
}

interface DyniSpringSpec {
  stiffness?: unknown;
  maxDtMs?: unknown;
  epsilon?: unknown;
  epsilonVelocity?: unknown;
  wrap?: unknown;
}

interface DyniSpring {
  setTarget(value: unknown): number;
  advance(nowMs: unknown): number;
  isSettled(): boolean;
  reset(value: unknown): number;
}

interface DyniSpringMotionSpec {
  spring?: unknown;
  wrap?: unknown;
}

interface DyniSpringMotionState {
  spring: DyniSpring;
  ready: boolean;
}

interface DyniSpringMotion {
  resolve(canvas: object, target: unknown, easingEnabled: unknown, nowMs: unknown): number;
  isActive(canvas: object): boolean;
}

interface DyniSpringEasingApi {
  id: "SpringEasing";
  create(spec?: DyniSpringSpec): DyniSpring;
  createMotion(spec?: DyniSpringMotionSpec): DyniSpringMotion;
}

interface DyniRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DyniMakeRect = (x: number, y: number, w: number, h: number) => DyniRect;

interface DyniLayoutRectMathApi {
  id: "LayoutRectMath";
  makeRect: DyniMakeRect;
  splitRow(rect: DyniRect | undefined, gap: number, count: number, makeRectFn?: DyniMakeRect): DyniRect[];
  splitStack(rect: DyniRect | undefined, gap: number, count: number, makeRectFn?: DyniMakeRect): DyniRect[];
}

interface DyniGeometryScaleApi {
  id: "GeometryScale";
  scale(primaryDim: unknown, factor: unknown, floor?: unknown): number;
  scaleStroke(primaryDim: unknown, factor: unknown, strokeWeight: unknown, floor?: unknown): number;
  scalePointer(primaryDim: unknown, factor: unknown, weight: unknown, floor?: unknown): number;
  strokeFloor(strokeWeight: unknown): number;
  extentFloor(strokeWeight: unknown): number;
}

interface DyniResponsiveScaleSpec {
  scales?: Record<string, unknown>;
}

interface DyniResponsiveScaleProfile {
  minDim: number;
  t: number;
  textFillScale?: number;
  [key: string]: number | undefined;
}

interface DyniIntrinsicTileSpacing {
  padX: number;
  captionHeightPx: number;
}

interface DyniResponsiveScaleProfileApi {
  id: "ResponsiveScaleProfile";
  computeProfile(W: unknown, H: unknown, spec?: DyniResponsiveScaleSpec): DyniResponsiveScaleProfile;
  computeInsetPx(profile: DyniResponsiveScaleProfile | undefined, ratio: unknown, floor: unknown): number;
  computeIntrinsicSpacePx(
    profile: DyniResponsiveScaleProfile | undefined,
    spanPx: unknown,
    ratio: unknown,
    count: unknown,
    floor: unknown
  ): number;
  computeIntrinsicTileSpacing(
    profile: DyniResponsiveScaleProfile | undefined,
    rect: Partial<DyniRect> | undefined,
    padRatio: unknown,
    captionRatio: unknown
  ): DyniIntrinsicTileSpacing;
  scaleShare(base: unknown, scale: unknown, minValue: number, maxValue: number): number;
  scaleMaxTextPx(base: unknown, textFillScale: unknown): number;
}

interface DyniRadialAngleMathApi {
  mod(n: number, m: number): number;
  norm360(deg: number): number;
  norm180(deg: number): number;
  valueToAngleFlat(
    rawValue: unknown,
    minV: unknown,
    maxV: unknown,
    arc: DyniArc | undefined,
    doClamp?: boolean
  ): number;
  angleToValue(angleDeg: unknown, opts: DyniAngleOptions | undefined): number;
}

interface DyniRadialTickOptions {
  startDeg?: unknown;
  endDeg?: unknown;
  stepMajor?: unknown;
  stepMinor?: unknown;
  includeEnd?: boolean;
  majorMode?: unknown;
}

interface DyniRadialSweepInfo {
  s: number;
  e: number;
  sweep: number;
  dir: number;
}

interface DyniRadialTickMathApi {
  id: "RadialTickMath";
  computeSweep(startDeg: unknown, endDeg: unknown): DyniRadialSweepInfo;
  isBeyondEnd(curr: number, end: number, dir: unknown, includeEnd: boolean): boolean;
  buildTickAngles(opts?: DyniRadialTickOptions): DyniRadialTickAngles;
}

interface DyniRadialSectorMathApi {
  sectorAngles(from: unknown, to: unknown, minV: number, maxV: number, arc: DyniArc): DyniAngleRange | null;
  buildHighEndSectors(
    props: DyniSectorProps | undefined,
    minV: number,
    maxV: number,
    arc: DyniArc,
    options?: DyniSectorOptions
  ): DyniColoredAngleRange[];
  buildLowEndSectors(
    props: DyniSectorProps | undefined,
    minV: number,
    maxV: number,
    arc: DyniArc,
    options?: DyniSectorOptions
  ): DyniColoredAngleRange[];
}

interface DyniPreparedPayloadInput {
  props?: unknown;
  shellRect?: unknown;
  revision?: unknown;
}

interface DyniPreparedPayloadEntry {
  revision: number | null;
  props: unknown;
  shellWidth: number | null;
  shellHeight: number | null;
  model: unknown;
}

interface DyniPreparedModelCache {
  getPreparedPayload(payload: unknown): DyniPreparedPayloadEntry;
  clear(): void;
}

interface DyniPreparedModelCacheOptions {
  buildModel?: unknown;
}

interface DyniPreparedPayloadModelCacheApi {
  createPreparedModelCache(options?: DyniPreparedModelCacheOptions): DyniPreparedModelCache;
  createPreparedPayloadCache(buildModel: unknown): DyniPreparedModelCache;
}

interface DyniHtmlMount {
  mountEl: HTMLElement;
  rootEl: HTMLElement;
}

interface DyniHtmlMountSpec {
  applyMounted(mounted: DyniHtmlMount): void;
  patchDom(payload: unknown): void;
}

interface DyniHtmlRendererPayload {
  props?: unknown;
  shellRect?: DyniHtmlShellRect | null;
  rootEl?: HTMLElement | null;
  hostContext?: unknown;
  [key: string]: unknown;
}

interface DyniHtmlResizeModel {
  resizeSignatureParts: unknown[];
}

type DyniHtmlBuildModel = (props: unknown, shellRect: unknown) => DyniHtmlResizeModel;

interface DyniHtmlWidgetLifecycleApi {
  id: "HtmlWidgetLifecycle";
  mountRootDiv(mountHostEl: HTMLElement): DyniHtmlMount;
  joinSignatureParts(parts: unknown[]): string;
  createMountHandler(spec?: DyniHtmlMountSpec): (mountHostEl: HTMLElement, payload: unknown) => void;
  createResizeSignatureHandler(buildModel: DyniHtmlBuildModel): (payload: unknown) => string;
}

interface DyniComponentRequire {
  (id: "AisTargetLayoutMath"): DyniAisTargetLayoutMathApi;
  (id: "HtmlWidgetLifecycle"): DyniHtmlWidgetLifecycleApi;
  (id: "PreparedPayloadModelCache"): DyniPreparedPayloadModelCacheApi;
  (id: "RadialTextFitting"): DyniCanvasTextFittingApi;
  (id: "RadialTextLayout"): DyniCanvasTextLayoutApi;
  (id: "CenterDisplayMath"): DyniCenterDisplayMathApi;
  (id: "EditRouteLayoutMath"): DyniEditRouteLayoutMathApi;
  (id: "GeometryScale"): DyniGeometryScaleApi;
  (id: "LayoutSizingHelpers"): DyniLayoutSizingHelpersApi;
  (id: "LinearGaugeMath"): DyniLinearGaugeMathApi;
  (id: "LayoutRectMath"): DyniLayoutRectMathApi;
  (id: "NavModeRatio"): DyniNavModeRatioApi;
  (id: "TextFitMath"): DyniTextFitMathApi;
  (id: "DepthDisplayFormatter"): DyniDepthDisplayFormatterApi;
  (id: "PlaceholderNormalize"): DyniPlaceholderNormalizeApi;
  (id: "UnitAwareFormatter"): DyniUnitAwareFormatterApi;
  (id: "RadialAngleMath"): DyniRadialAngleMathApi;
  (id: "RadialSectorMath"): DyniRadialSectorMathApi;
  (id: "RadialTickMath"): DyniRadialTickMathApi;
  (id: "RegattaTimerPhase"): DyniRegattaTimerPhaseApi;
  (id: "StateScreenInteraction"): DyniStateScreenInteractionApi;
  (id: "StateScreenLabels"): DyniStateScreenLabelsApi;
  (id: "StateScreenPrecedence"): DyniStateScreenPrecedenceApi;
  (id: "ResponsiveScaleProfile"): DyniResponsiveScaleProfileApi;
  (id: "SpringEasing"): DyniSpringEasingApi;
  (id: "StableDigits"): DyniStableDigitsApi;
  (id: "ValueMath"): DyniValueMathApi;
  (id: string): unknown;
}

interface DyniComponentContext {
  components: {
    require: DyniComponentRequire;
  };
  format: DyniFormatService;
}
