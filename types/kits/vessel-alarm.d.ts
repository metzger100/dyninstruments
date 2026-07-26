// Ambient types for the vessel alarm kit (render model, markup, HTML fit chrome).

type DyniAlarmInteractionState = "dispatch" | "passive";

type DyniAlarmState = "active" | "idle";

interface DyniAlarmRenderModel {
  state: DyniAlarmState;
  isActive: boolean;
  hasActiveAlarms: boolean;
  activeCount: number;
  alarmNames: unknown[];
  alarmText: string;
  captionText: string;
  idleValueText: string;
  activeValueText: string;
  valueText: string;
  unitText: string;
  showStrip: boolean;
  showActiveBackground: boolean;
  showHotspot: boolean;
  interactionState: DyniAlarmInteractionState;
  canDispatch: boolean;
  ratioThresholdNormal: number | undefined;
  ratioThresholdFlat: number | undefined;
}

interface DyniAlarmRenderModelApi {
  id: "AlarmRenderModel";
  buildModel(args?: unknown): DyniAlarmRenderModel;
}

interface DyniAlarmMarkupModel extends Record<string, unknown> {
  state?: unknown;
  interactionState?: unknown;
  showStrip?: unknown;
  captionText?: unknown;
  valueText?: unknown;
}

interface DyniAlarmMarkupFit extends Record<string, unknown> {
  mode?: unknown;
  captionStyle?: unknown;
  valueStyle?: unknown;
  shellStyle?: unknown;
  accentStyle?: unknown;
  activeBackgroundStyle?: unknown;
  activeForegroundStyle?: unknown;
}

interface DyniAlarmMarkupArgs {
  model?: unknown;
  fit?: unknown;
}

interface DyniAlarmMarkupApi {
  id: "AlarmMarkup";
  render(args?: unknown): string;
}

interface DyniAlarmShellRect {
  width: number;
  height: number;
}

interface DyniAlarmChromeBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  stripWidth: number;
  stripGap: number;
  stripLeft: number;
  stripTop: number;
  stripBottom: number;
  padX: number;
  padY: number;
  accentReserve: number;
  stripRadius: number;
}

interface DyniAlarmContentRect {
  width: number;
  height: number;
  chrome: DyniAlarmChromeBox;
}

interface DyniAlarmHtmlFitLayout {
  mode: "flat" | "high" | "normal";
  shellRect: DyniAlarmShellRect;
  contentRect: DyniAlarmContentRect;
}

interface DyniAlarmChromeModel {
  state?: unknown;
  interactionState?: unknown;
  captionText?: unknown;
  valueText?: unknown;
  ratioThresholdNormal?: unknown;
  ratioThresholdFlat?: unknown;
  showStrip?: unknown;
  showActiveBackground?: unknown;
}

interface DyniAlarmThemeTokens {
  bg?: unknown;
  fg?: unknown;
  strip?: unknown;
}

interface DyniAlarmThemeColors {
  alarmWidget?: DyniAlarmThemeTokens;
}

interface DyniAlarmThemeFont {
  family?: unknown;
  weight?: unknown;
  labelWeight?: unknown;
}

interface DyniAlarmResolvedTheme {
  colors?: DyniAlarmThemeColors;
  font?: DyniAlarmThemeFont;
}

interface DyniAlarmThemeResolver {
  resolveForRoot(rootEl: unknown): DyniAlarmResolvedTheme;
}

interface DyniAlarmHtmlFitChromeResolveArgs {
  model?: unknown;
  shellRect?: unknown;
}

interface DyniAlarmHtmlFitChromeSignatureArgs {
  mode?: unknown;
  width?: unknown;
  height?: unknown;
  shellWidth?: unknown;
  shellHeight?: unknown;
  chrome?: unknown;
  padX?: unknown;
  model?: unknown;
  family?: unknown;
  valueWeight?: unknown;
  labelWeight?: unknown;
  themeBg?: unknown;
  themeFg?: unknown;
  themeStrip?: unknown;
  fontMetricsEpoch?: unknown;
}

interface DyniAlarmHtmlFitChromeApi {
  id: "AlarmHtmlFitChrome";
  resolveLayout(args?: DyniAlarmHtmlFitChromeResolveArgs): DyniAlarmHtmlFitLayout | null;
  buildShellStyle(chrome: DyniAlarmChromeBox): string;
  buildAccentStyle(model: unknown, chrome: DyniAlarmChromeBox, tokens: DyniAlarmThemeTokens): string;
  buildSignature(args?: DyniAlarmHtmlFitChromeSignatureArgs): string;
}

interface DyniAlarmFitModel extends DyniAlarmChromeModel {
  showActiveBackground?: unknown;
  showStrip?: unknown;
  captionText?: unknown;
  valueText?: unknown;
  state?: unknown;
  interactionState?: unknown;
}

interface DyniAlarmModeFitArgs {
  mode: DyniAlarmHtmlFitLayout["mode"];
  model: DyniAlarmFitModel;
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  family?: unknown;
  valueWeight?: unknown;
  labelWeight?: unknown;
}

interface DyniAlarmModeFit {
  captionPx: number;
  valuePx: number;
  modeFit: unknown;
}

interface DyniAlarmHtmlFitComputeArgs {
  model?: unknown;
  shellRect?: unknown;
  targetEl?: unknown;
  rootEl?: unknown;
  hostContext?: unknown;
  fontMetricsEpoch?: unknown;
}

interface DyniAlarmHtmlFitResult extends DyniAlarmMarkupFit {
  mode: DyniAlarmHtmlFitLayout["mode"];
  captionPx: number;
  valuePx: number;
  captionStyle: string;
  valueStyle: string;
  shellStyle: string;
  accentStyle: string;
  activeBackgroundStyle: string;
  activeForegroundStyle: string;
  idleStripStyle: string;
  showStrip: boolean;
  showActiveBackground: boolean;
  valueSingleLine: boolean;
  interactionState: unknown;
  state: unknown;
}

interface DyniAlarmHtmlFitApi {
  id: "AlarmHtmlFit";
  compute(args?: DyniAlarmHtmlFitComputeArgs | null): DyniAlarmHtmlFitResult | null;
  resolveLayout(args?: DyniAlarmHtmlFitChromeResolveArgs): DyniAlarmHtmlFitLayout | null;
}
