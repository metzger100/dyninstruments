---
name: scan-smells
description: Scans proposed code changes against the dyninstruments smell catalog before committing and catches the defensive, verbose patterns that AI agents typically introduce.
---

# Skill: scan-smells

## Description

Scans proposed code changes against the dyninstruments smell catalog before committing. Catches the defensive, verbose, "play it safe" patterns that AI agents typically introduce. Understands the boundary model: where defaults/validation belong vs. where interior code should trust its inputs.

## When to Use

Before committing any code change. Run this mental checklist against every file you've written or modified.

## Instructions

### The Core Principle

**Fail-fast / keep-it-simple:** Defaults and validation belong at boundaries. Internal code trusts normalized contracts. If you're adding a guard, fallback, or normalization inside a renderer, shared module, or widget — you're almost certainly in the wrong place.

Boundaries are: mappers, config files, runtime service boundaries, `componentContext.format.applyFormatter`, `runtime.theme` internals, `componentContext.theme.tokens.resolveForRoot(rootEl)`, editable-parameter defaults, `plugin.css`.

Interior code is: renderers, shared engines, widget-kits, layout modules, fit modules, canvas draw functions.

### Smell Checklist

Scan every line of your proposed code against these patterns. If you find a match, apply the fix. Generic
`dyni-lint-disable-*` directives are forbidden in production; use only a checker-owned canonical exception or the
validated external-boundary marker described below.

#### Category 1: Redundant Guards on Normalized Values (BLOCK)

**`redundant-null-type-guard`** — Interior code repeatedly sanitizes already-normalized values.

```javascript
// ❌ SMELL: Props are already normalized by mapper
String(x == null ? "" : x)
Array.isArray(x) ? x : []
isFiniteNumber(x) ? x : 0
typeof value === "number" ? value : parseFloat(value)

// ✅ FIX: Trust the mapper/boundary contract
x       // it's already a string
x       // it's already an array
x       // it's already a finite number or undefined
value   // it's already a number
```

**`renderer-numeric-coercion-without-boundary-contract`** — Renderer does `Number(props.x)` on mapper-owned normalized props.

```javascript
// ❌ SMELL
const speed = Number(props.speed);

// ✅ FIX: Normalize in mapper, renderer receives finite number or undefined
const speed = props.speed; // already normalized by mapper
```

**`mapper-prop-renormalization`** — Any renderer directly normalizes a numeric or string prop again.

```javascript
// ❌ SMELL: mapper/editable boundaries already own these contracts
toOptionalFiniteNumber(p.warningFrom);
trimText(p.caption);
String(p.unit);
p.label.trim();

// ✅ FIX: trust rendererProps in every widget file
p.warningFrom;
p.caption;
p.unit;
```

The AST rule also follows local aliases/destructuring and rejects delegating the complete `p`/`props` bag to a
`normalize*` helper. Moving normalization behind another local/shared call does not move the boundary.

#### Category 2: Duplicated Defaults (BLOCK)

**`hardcoded-runtime-default`** — Runtime/widget/shared code embeds fallback literals already owned elsewhere.

```javascript
// ❌ SMELL: Default is already in editable-parameter config
const unit = props.unit || "kn";
const caption = props.caption || "Speed";

// ✅ FIX: Trust the editable-default boundary
const unit = props.unit;     // config owns the default
const caption = props.caption; // config owns the default
```

**`widget-renderer-default-duplication`** — Widget `createRenderer(...)` spec repeats editable-parameter defaults in `ratioDefaults` / `rangeDefaults`.

```javascript
// ❌ SMELL
const renderCanvas = renderer.createRenderer({
  rangeDefaults: { min: 0, max: 40 },  // already in editable config
  ratioDefaults: { normal: 1.0, flat: 3.5 },  // already in editable config
  ...
});

// ✅ FIX: Remove widget-local defaults; engine fallback is the single last-resort owner
const renderCanvas = renderer.createRenderer({
  rawValueKey: "speed",
  unitDefault: "kn",
  rangeProps: { min: "speedRadialMinValue", max: "speedRadialMaxValue" },
  ...
});
```

**`inline-config-default-duplication`** — Widget/shared code re-declares editable defaults inline.

```javascript
// ❌ SMELL
const threshold = typeof p.ratioThreshold !== "undefined" ? p.ratioThreshold : 12.2;

// ✅ FIX: Trust the editable-default contract
const threshold = p.ratioThreshold;
```

**`engine-layout-default-drift`** — Layout module re-declares semantic ratio defaults already owned by the engine family.

```javascript
// ❌ SMELL: Layout copies engine defaults
const NORMAL_THRESHOLD = 1.0;  // already in engine
const FLAT_THRESHOLD = 3.5;    // already in engine

// ✅ FIX: Layout keeps only structural safety bounds (0, 1, 2)
```

**`css-js-default-duplication`** (BLOCK) — JS repeats CSS/theme token defaults.

```javascript
// ❌ SMELL
const color = getComputedStyle(el).getPropertyValue("--dyni-fg") || "#ffffff";

// ✅ FIX: Keep visual defaults in CSS/theme boundary only
```

#### Category 3: Defensive Framework Guards (BLOCK)

**`canvas-api-typeof-guard`** — Internal drawing code checks standard Canvas 2D methods.

```javascript
// ❌ SMELL: Canvas 2D context is validated at the boundary
if (typeof ctx.setLineDash === "function") {
  ctx.setLineDash([5, 3]);
}

// ✅ FIX: Trust the validated Canvas 2D context
ctx.setLineDash([5, 3]);
```

**`framework-method-typeof-guard`** — Internal code checks Helpers or module methods after resolution.

```javascript
// ❌ SMELL: Module was already resolved by the loader
if (typeof componentContext.format.applyFormatter === "function") {
  return componentContext.format.applyFormatter(value, opts);
}

// ✅ FIX: Trust module-loader/helper contracts
return componentContext.format.applyFormatter(value, opts);
```

**`try-finally-canvas-drawing`** — Internal draw path wraps save/restore in try/finally without an external throwing boundary.

```javascript
// ❌ SMELL
try {
  ctx.save();
  ctx.rotate(angle);
  drawPointer(ctx);
} finally {
  ctx.restore();
}

// ✅ FIX: Direct save/draw/restore pairing
ctx.save();
ctx.rotate(angle);
drawPointer(ctx);
ctx.restore();
```

#### Category 4: Internal Hook/Spec Fallbacks (BLOCK)

**`internal-hook-fallback`** — Shared/widget code normalizes or fallbacks internal hook/spec results.

```javascript
// ❌ SMELL: Creating normalize* helpers for internal contracts
function normalizeThemeColors(colors) {
  return {
    warning: colors.warning || "#ff0",
    alarm: colors.alarm || "#f00",
    ...
  };
}

// ✅ FIX: Keep defaults at the boundary (`runtime.theme` + `componentContext.theme.tokens`) and trust internal contracts
const theme = componentContext.theme.tokens.resolveForRoot(rootEl);
const { warning, alarm } = theme.colors;
```

#### Category 5: Falsy Default Clobbering (BLOCK)

**`default-truthy-fallback`** — Using `||` which clobbers explicit `""`, `0`, `false`.

```javascript
// ❌ SMELL: Clobbers explicit empty string or zero
const text = p.default || "---";
const value = p.minValue || 0;

// ✅ FIX: Use nullish coalescing or property-presence checks
const text = p.default ?? "---";
const value = p.minValue != null ? p.minValue : 0;
// Or better: trust the boundary contract entirely
```

#### Category 6: Mapper Boundary Violations (BLOCK)

**`mapper-logic-leakage`** — Mapper adds helper functions or presentation logic.

```javascript
// ❌ SMELL: Formatter logic inside mapper
function formatValue(raw) { ... }  // only create() and translate() allowed

// ✅ FIX: Move to renderer, toolkit, or shared module
```

**`mapper-output-complexity`** (BLOCK >8) — Mapper branch returns oversized object literal.

```javascript
// ❌ SMELL: Too many top-level props
return { renderer, value, caption, unit, min, max, warning, alarm, tick, format, style, mode, label };

// ✅ FIX: Group into sub-objects
return {
  renderer: "Widget",
  domain: { value, caption, unit },
  layout: { min, max, mode },
  formatting: { format, style }
};
```

**`absent-numeric-sentinel`** — Optional numeric mapper output uses `NaN`, `Infinity`, or a non-zero numeric sentinel.

```javascript
// ❌ SMELL
return { warningFrom: enabled ? num(p.warningFrom) : -1 };

// ✅ FIX
return { warningFrom: enabled ? num(p.warningFrom) : undefined };
```

Zero remains valid for real counts and other non-optional numeric values.

#### Category 7: Responsive Ownership Violations (BLOCK)

**`responsive-layout-hard-floor`** — Widget-local responsive floors instead of shared profile.

```javascript
// ❌ SMELL: User-visible floor in widget code
const fontSize = Math.max(9, computed);

// ✅ FIX: Derive from ResponsiveScaleProfile; keep only technical guards (0, 1, 2)
```

**`responsive-profile-ownership`** — Consumer imports ResponsiveScaleProfile directly.

```javascript
// ❌ SMELL: Widget directly imports profile
const profile = ResponsiveScaleProfile.computeProfile(w, h, spec);

// ✅ FIX: Read from layout-owner state (responsive, textFillScale, computeResponsiveInsets)
```

#### Category 8: Structural Patterns (BLOCK)

**`redundant-internal-fallback`** — Renderer re-applies fallback for props already guaranteed by mapper.

```javascript
// ❌ SMELL: Wrapping componentContext.format.applyFormatter default with the same fallback again
const result = componentContext.format.applyFormatter(v, opts) || props.default;
// applyFormatter already handles the default

// ✅ FIX: Trust componentContext.format.applyFormatter's contract
const result = componentContext.format.applyFormatter(v, opts);
```

**`catch-fallback-without-suppression`** (BLOCK) — Non-rethrow catch silently degrades behavior.

```javascript
// ❌ SMELL
try { result = compute(); } catch (e) { result = fallback; }

// ✅ FIX: Re-throw, or mark a genuine external boundary with audited metadata
try { result = compute(); }
// dyni-boundary-next-line(category: avnav-host-uncertainty, owner: Metzger100, date: 2026-07-20) -- AvNav host may not expose this API
catch (e) {
  result = fallback;
}
```

**`premature-legacy-support`** (BLOCK) — Speculative compat/legacy/fallback naming.

```javascript
// ❌ SMELL
function legacyResolve() { ... }
const compatValue = oldApi ? oldApi.get() : newApi.get();

// ✅ FIX: Remove until a live boundary requires it
```

### After Scanning

1. Fix every finding before committing; all live rules are blocking.
2. Run `node tools/check-patterns.mjs` to verify mechanically.
3. Run `npm run check:all` as the final gate.

### Suppression Syntax

Generic production suppressions are forbidden. The only source marker is for a genuine external catch boundary:

```javascript
// dyni-boundary-next-line(category: <slug>, owner: <handle>, date: <YYYY-MM-DD>) -- <reason>
/* dyni-boundary-line(category: <slug>, owner: <handle>, date: <YYYY-MM-DD>, expires: <YYYY-MM-DD>) -- <reason> */
```

- Boundary markers affect only `catch-fallback-without-suppression`.
- `category`, `owner`, `date`, and a reason are required; `expires` is optional and fail-closed.
- Generic `dyni-lint-disable-*`, malformed, missing-field, or expired directives fail via `invalid-lint-suppression`.
