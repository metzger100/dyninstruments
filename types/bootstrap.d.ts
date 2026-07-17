interface DyniBootstrapLoader {
  (assetId: string, url: string): Promise<void>;
}

interface DyniBootstrapLogger {
  error(...args: unknown[]): void;
}

interface DyniBootstrapGeneration {
  id: string;
  entrypoint: "legacy" | "module";
  baseUrl: string;
  hostApi: unknown;
}

interface DyniBootstrapConfig {
  bootstrapManifest?: unknown;
  [key: string]: unknown;
}

interface DyniBootstrapRuntime {
  loadScriptOnce: DyniBootstrapLoader;
  loadCssOnce: DyniBootstrapLoader;
  runInit?: () => Promise<(() => void) | undefined>;
  [key: string]: unknown;
}

interface DyniBootstrapNamespace {
  baseUrl: string;
  avnavApi: unknown;
  config: DyniBootstrapConfig;
  runtime: DyniBootstrapRuntime;
  state: Record<string, unknown>;
  startupGeneration: DyniBootstrapGeneration;
}

interface DyniBootstrapOptions {
  document?: Document | null;
  logger?: DyniBootstrapLogger;
  baseUrl?: unknown;
  scriptIdScope?: unknown;
  entrypoint?: unknown;
  hostApi?: unknown;
  root?: DyniBootstrapRoot;
}

interface DyniBootstrapCoreApi {
  start(options?: DyniBootstrapOptions): Promise<(() => void) | undefined>;
  makeScriptId(relativePath: unknown, scope: unknown): string;
  resolveGenerationDiscriminator(baseUrl: unknown): string;
  resolveScriptScope(options: DyniBootstrapOptions | undefined, baseUrl: string): string;
  resolveEntrypoint(options: DyniBootstrapOptions | undefined): "legacy" | "module";
  normalizeBaseUrl(baseUrl: unknown): string;
}

interface DyniBootstrapRoot {
  window?: DyniBootstrapRoot;
  DyniPlugin?: unknown;
  DyniPluginBootstrapCore?: DyniBootstrapCoreApi;
}
