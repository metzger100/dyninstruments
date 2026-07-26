// Ambient types for the shared state-screen overlay/markup/text-fit kits.

interface DyniStateScreenDrawArgs {
  kind?: unknown;
  ctx?: CanvasRenderingContext2D | null;
  W?: unknown;
  H?: unknown;
  color?: unknown;
  label?: unknown;
  labelWeight?: unknown;
  family?: unknown;
}

interface DyniStateScreenCanvasOverlayApi {
  id: "StateScreenCanvasOverlay";
  drawStateScreen(args?: unknown): void;
  setFont: DyniCanvasTextFittingApi["setFont"];
}

interface DyniStateScreenRenderArgs {
  htmlUtils?: DyniHtmlWidgetUtilsApi;
  kind?: unknown;
  wrapperClasses?: unknown;
  label?: unknown;
  extraAttrs?: unknown;
  labelStyle?: unknown;
  fitStyle?: unknown;
  shellRect?: unknown;
  availableRect?: unknown;
  textApi?: unknown;
  measureCtx?: unknown;
  fontFamily?: unknown;
  fontWeight?: unknown;
  hostContext?: unknown;
  targetEl?: unknown;
  ownerDocument?: unknown;
}

interface DyniStateScreenMarkupApi {
  id: "StateScreenMarkup";
  renderStateScreen(args?: unknown): string;
}

interface DyniStateScreenSizeRect {
  width?: unknown;
  height?: unknown;
}

interface DyniStateScreenTextFitArgs {
  label?: unknown;
  shellRect?: DyniStateScreenSizeRect | null;
  availableRect?: DyniStateScreenSizeRect | null;
  measureCtx?: CanvasRenderingContext2D | null;
  textApi?: DyniStateScreenTextApi | null;
  family?: unknown;
  weight?: unknown;
  hostContext?: unknown;
  targetEl?: unknown;
  ownerDocument?: unknown;
}

interface DyniStateScreenTextApi {
  fitSingleTextPx(
    ctx: CanvasRenderingContext2D,
    text: unknown,
    basePx: unknown,
    maxW: unknown,
    maxH: unknown,
    family: unknown,
    weight: unknown
  ): number;
}

interface DyniStateScreenTextFitApi {
  id: "StateScreenTextFit";
  compute(args?: unknown): string;
}
