// Ambient types for the vessel regatta-timer kit (audio, session store, markup, HTML fit).

type DyniRegattaAudioContextCtor = {
  new (): AudioContext;
};

interface DyniRegattaTimerAudioGlobal {
  AudioContext?: DyniRegattaAudioContextCtor;
  webkitAudioContext?: DyniRegattaAudioContextCtor;
}

interface DyniRegattaTimerAudioEngine {
  ensureContext(): boolean;
  playTone(frequency: unknown, durationMs: unknown): void;
  destroy(): void;
  LOW_TONE_HZ: number;
  HIGH_TONE_HZ: number;
  MINUTE_BEEP_MS: number;
  SECOND_BEEP_MS: number;
  START_TONE_MS: number;
}

interface DyniRegattaTimerAudioApi {
  id: "RegattaTimerAudio";
  createAudioEngine(): DyniRegattaTimerAudioEngine;
}

interface DyniRegattaTimerSessionSnapshot {
  phase?: unknown;
  durationMinutes?: unknown;
  endTimeMs?: unknown;
  elapsedStartMs?: unknown;
  lastCountdownSecond?: unknown;
  [key: string]: unknown;
}

interface DyniRegattaTimerState {
  phase: DyniRegattaPhase;
  remainingMs: number;
  elapsedMs: number;
  displayTime: string;
  colorPhase: string;
}

interface DyniRegattaTimerModelOptions {
  durationMinutes?: unknown;
  snapshot?: DyniRegattaTimerSessionSnapshot | null;
  onTick?: (state: DyniRegattaTimerState) => void;
  onSignal?: (type: string, frequency: number, durationMs: number) => void;
}

interface DyniRegattaTimerModel {
  start(): void;
  sync(): void;
  reset(): void;
  destroy(): void;
  getState(): DyniRegattaTimerState;
  getSnapshot(): DyniRegattaTimerSessionSnapshot;
}

interface DyniRegattaTimerModelApi {
  id: "RegattaTimerModel";
  createTimerModel(options?: DyniRegattaTimerModelOptions): DyniRegattaTimerModel;
}

interface DyniRegattaTimerHostContext {
  __dyniRegattaTimerSession?: DyniRegattaTimerSessionSnapshot | null;
  [key: string]: unknown;
}

interface DyniRegattaTimerSessionStore {
  syncIdentity(props?: unknown, payload?: unknown): void;
  readStoredSnapshot(): DyniRegattaTimerSessionSnapshot | null;
  persistSnapshot(snapshot?: unknown): void;
  clearStoredSnapshot(): void;
}

interface DyniRegattaTimerSessionStoreApi {
  id: "RegattaTimerSessionStore";
  createSessionStore(options?: unknown): DyniRegattaTimerSessionStore;
}

interface DyniRegattaTimerMarkupModel {
  phase?: unknown;
  colorPhase?: unknown;
  displayTime?: unknown;
  remainingMs?: unknown;
}

interface DyniRegattaTimerMarkupFit {
  wrapperStyle?: unknown;
  displayStyle?: unknown;
  timerStyle?: unknown;
  controlsStyle?: unknown;
  barStyle?: unknown;
  buttonStyle?: unknown;
  startButtonStyle?: unknown;
  syncButtonStyle?: unknown;
  resetButtonStyle?: unknown;
}

interface DyniRegattaTimerMarkupConfig {
  progressBarEnabled?: unknown;
  durationMinutes?: unknown;
}

interface DyniRegattaTimerConfig extends DyniRegattaTimerMarkupConfig {
  soundEnabled: boolean;
  progressBarEnabled: boolean;
  durationMinutes: number;
  stableDigitsEnabled: boolean;
}

interface DyniRegattaTimerMarkupOptions {
  model: DyniRegattaTimerMarkupModel;
  fit: DyniRegattaTimerMarkupFit;
  config: DyniRegattaTimerMarkupConfig;
  htmlUtils: DyniHtmlWidgetUtilsApi;
  mode?: unknown;
  interactionState?: unknown;
  stableDigitsEnabled?: unknown;
}

interface DyniRegattaTimerMarkupApi {
  id: "RegattaTimerMarkup";
  render(options: DyniRegattaTimerMarkupOptions): string;
}

type DyniRegattaTimerFitMode = "high" | "flat" | "normal";

interface DyniRegattaTimerModeShares {
  display: number;
  controls: number;
}

interface DyniRegattaTimerHtmlFitModel {
  phase?: unknown;
  displayTime?: unknown;
}

interface DyniRegattaTimerHtmlFitHostContext {
  __dyniRegattaTimerHtmlFitCache?: DyniRegattaTimerHtmlFitCache;
  [key: string]: unknown;
}

interface DyniRegattaTimerHtmlFitCache {
  signature: string;
  result: DyniRegattaTimerHtmlFitResult | null;
}

interface DyniRegattaTimerThemeResolver {
  resolveForRoot(rootEl: unknown): {
    font?: { family?: unknown; familyMono?: unknown; weight?: unknown; labelWeight?: unknown };
    regatta: { buttonStrokeWeight: unknown };
  };
}

interface DyniRegattaTimerDomApi {
  requirePluginRoot(targetEl: unknown): unknown;
}

interface DyniRegattaTimerHtmlFitArgs {
  model?: unknown;
  targetEl?: unknown;
  shellRect?: unknown;
  hostContext?: unknown;
  mode?: unknown;
  stableDigitsEnabled?: unknown;
}

interface DyniRegattaTimerHtmlFitResult {
  wrapperStyle: string;
  displayStyle: string;
  timerStyle: string;
  controlsStyle: string;
  barStyle: string;
  buttonStyle: string;
  startButtonStyle: string;
  syncButtonStyle: string;
  resetButtonStyle: string;
}

interface DyniRegattaTimerHtmlFitApi {
  id: "RegattaTimerHtmlFit";
  compute(options?: DyniRegattaTimerHtmlFitArgs): DyniRegattaTimerHtmlFitResult | null;
  clearCache(hostContext: unknown): void;
  FIT_CACHE_KEY: string;
}

type DyniRegattaTimerContext = DyniComponentContext & {
  theme: { tokens: DyniRegattaTimerThemeResolver };
};

interface DyniRegattaTimerResourceOptions {
  preserveSession?: boolean;
  clearSession?: boolean;
}
