// Shared strict vocabulary for JavaScript test harnesses.
// Add a precise capability here when a mock boundary requires one.

type DyniTestScalar = boolean | null | number | string | undefined;

type DyniTestData = DyniTestScalar | DyniTestData[] | DyniTestObject;

interface DyniTestObject {
  [key: string]: DyniTestData;
}

interface DyniTestCall {
  args: unknown[];
  name: string;
}

/** A mock collection whose fixture contract guarantees a requested matching entry. */
interface DyniTestKnownArray<T> extends Array<T> {
  find(predicate: (value: T, index: number, obj: T[]) => unknown): T;
}

interface DyniTestCanvasContext {
  calls: DyniTestCall[];
  fillStyle: string;
  font: string;
  globalAlpha: number;
  lineCap: string;
  lineJoin: string;
  lineWidth: number;
  strokeStyle: string;
  textAlign: string;
  textBaseline: string;
  beginPath(): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  fill(): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  lineTo(x: number, y: number): void;
  measureText(text: string): { width: number };
  moveTo(x: number, y: number): void;
  restore(): void;
  save(): void;
  scale(x: number, y: number): void;
  stroke(): void;
  strokeText(text: string, x: number, y: number): void;
  translate(x: number, y: number): void;
}

interface DyniTestFormatter {
  applyFormatter(value: unknown, options?: Record<string, unknown>): unknown;
}

interface DyniTestThemeSnapshot {
  colors?: Record<string, string>;
  font?: {
    family?: string;
    familyMono?: string;
    labelWeight?: number;
    weight?: number;
  };
  surface?: {
    bg?: string;
    border?: string;
    fg?: string;
  };
}

interface DyniTestComponentContext {
  canvas: {
    setupCanvas(canvas: HTMLCanvasElement): DyniTestCanvasContext | null;
  };
  components: {
    require(id: string): unknown;
  };
  format: DyniTestFormatter;
  theme: {
    tokens: {
      resolveForRoot(root?: Element | null): DyniTestThemeSnapshot;
    };
  };
}

interface DyniTestAvnavApi {
  formatter?: Record<string, (...args: unknown[]) => unknown>;
}

declare var avnav: { api?: DyniTestAvnavApi } | undefined;

/** Save/restore slot for the global plugin namespace; harnesses only round-trip this value. */
declare var DyniPlugin: unknown;

/** Bare-global exposure of XteDisplayLinearWidget.harness.js's canvas factory; unused by any consumer. */
declare var createCanvas: unknown;

/** Bare-global exposure of XteDisplayLinearWidget.harness.js's props factory; unused by any consumer. */
declare var makeProps: unknown;

/** Bare-global exposure of XteDisplayLinearWidget.harness.js's pointer-triangle finder; unused by any consumer. */
declare var findPointerTriangles: unknown;

interface DyniTestViewModel {
  build(props: Record<string, unknown>): unknown;
}
