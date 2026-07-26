// Ambient types for the AvNav formatter/api surface and widget lifecycle
// (widget definitions, HTML mount/renderer payload, resize/build models).

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
