// Ambient types for the runtime and plugin namespaces, the component loader,
// and the composed component tree.

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
