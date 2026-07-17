interface DyniInitGeneration {
  id: string;
  entrypoint: string;
  baseUrl: unknown;
  hostApi: unknown;
}

interface DyniInitHostActionBridge {
  destroy(): void;
  getHostActions(): unknown;
}

interface DyniInitThemeRuntime {
  configure(options: { activePresetName: unknown }): void;
  applyToRoot(rootEl: unknown): void;
  resolveStartupPresetName(rootEl: Element | null): unknown;
}

interface DyniInitComponentLoader {
  uniqueComponents(definitions: DyniWidgetDefinition[]): string[];
  loadComponent(id: string): Promise<unknown>;
  createInstance(widget: string, definition: DyniWidgetDefinitionData): DyniWidgetComponentSpec;
}

interface DyniInitAvnavApi {
  registerWidget(definition: Record<string, unknown>, editable: Record<string, unknown>): void;
  log(message: string): void;
}

interface DyniInitRuntime {
  theme?: DyniInitThemeRuntime;
  clusterShellRenderer?: DyniClusterShellRendererApi;
  getAvnavApi(root: unknown): DyniInitAvnavApi | null;
  createTemporaryHostActionBridge(): DyniInitHostActionBridge;
  createComponentLoader(components: DyniComponentRegistryGroup): DyniInitComponentLoader;
  registerWidget(spec: DyniWidgetComponentSpec, definition: DyniWidgetDefinition): void;
  hostActions: (() => unknown) | null;
  componentLoader: DyniInitComponentLoader | null;
  runInit?: () => Promise<(() => void) | undefined>;
}

interface DyniInitState {
  initGenerationId: string | null;
  initStarted: boolean;
  initPromise: Promise<(() => void) | undefined> | null;
  hostActionBridge: DyniInitHostActionBridge | null;
}

interface DyniInitNamespace {
  config: { components: DyniComponentRegistryGroup; widgetDefinitions: DyniWidgetDefinition[] };
  runtime: DyniInitRuntime;
  state: DyniInitState;
  startupGeneration?: DyniInitGeneration;
  baseUrl: unknown;
  avnavApi: unknown;
}

interface DyniInitRoot {
  DyniPlugin: DyniInitNamespace;
  document?: Document;
}
