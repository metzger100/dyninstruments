# PLAN5 — Documentation System Optimization for Token Efficiency and First-Attempt Success

## Status

Written after a full documentation audit comparing the existing documentation system against the routePoints execution plan (PLAN6.md). The audit identified two categories of problems: (1) critical knowledge gaps in HTML-kind lifecycle and vertical-container patterns that are undocumented outside of execution plans, and (2) token waste from rule duplication, verbose playbooks, and inflated navigation indexes loaded during every mandatory preflight.

This plan is documentation-only. No runtime code, test code, or configuration changes are in scope. The coding agent must not modify any `.js`, `.css`, or `.json` file. All deliverables are `.md` files. Validation is `npm run docs:check` (format + reachability). The agent may choose equivalent phrasings for documentation content as long as the structural, coverage, and token-budget outcomes below are met.

---

## Goal

Restructure the documentation system to eliminate the knowledge gaps discovered during route-workflow planning and reduce token waste from mandatory preflight reads by ~1,200 tokens per session.

Expected outcomes after completion:

- A new `documentation/architecture/html-renderer-lifecycle.md` documents the two-phase render pattern, `hostContext.__dyniHostCommitState` consumption contract, corrective rerender timing, post-commit DOM effects scheduling, and resize-signature stability rules. An agent reading this doc can correctly implement the lifecycle for any new HTML kind without reverse-engineering source code.
- A new `documentation/architecture/vertical-container-contract.md` documents `.widgetContainer.vertical` detection, width-only anchor strategy, natural height computation, wrapper-owned height injection, and vertical-mode resize-signature rules. An agent reading this doc can correctly implement vertical-container support for any HTML kind without guessing.
- `documentation/guides/add-new-html-kind.md` is expanded with a lifecycle patterns section covering: corrective rerender usage, renderer file split for complex kinds, box-driven text fitting workflow, page-aware handler registration, and grouped mapper output for complex payloads.
- `AGENTS.md` is compressed: §3 File Size Limits removed (canonical owner is `coding-standards.md`), §4 File Map reduced to 4 routing pointers (duplicates TABLEOFCONTENTS.md removed), §7 Smell Prevention reduced to a reference (canonical owner is `smell-prevention.md`).
- `documentation/core-principles.md` is compressed: rationale lines removed, rules that are fully restated in their canonical owner are replaced with one-line references.
- `documentation/conventions/smell-prevention.md` is split: fix playbooks (lines 76–244, 169 lines) moved to a new `documentation/conventions/smell-fix-playbooks.md`. The main file keeps the smell catalog table, tooling matrix, suppression syntax, and severity model only.
- `documentation/TABLEOFCONTENTS.md` is compressed: multi-entry groups pointing to the same file are collapsed into single grouped entries.
- A new `documentation/guides/exec-plan-authoring.md` codifies the structural patterns used in PLAN6.md, so future execution plans achieve consistent first-attempt success.
- `documentation/architecture/host-commit-controller.md` is expanded with the `hostContext.__dyniHostCommitState` shape and timing contract.
- All new and modified docs pass `npm run docs:check` (format + reachability).
- TABLEOFCONTENTS.md links resolve for all new docs.
- Net token change for mandatory preflight reads (AGENTS.md + TABLEOFCONTENTS.md + coding-standards.md + smell-prevention.md): reduction of ~1,200 tokens.

---

## Verified Baseline

The following points were checked against the repository before this plan:

1. The mandatory preflight chain is: AGENTS.md (176 lines) → TABLEOFCONTENTS.md (165 lines) → coding-standards.md (187 lines) → smell-prevention.md (251 lines). Total: 779 lines loaded on every session before any task-specific reads.
2. `__dyniHostCommitState` is set by `ClusterWidget.js` (lines 65, 111, 142), consumed by `ActiveRouteTextHtmlWidget.js` (line 42), `MapZoomHtmlFit.js` (line 43), `HtmlWidgetUtils.js` (line 38), and `ClusterRendererRouter.js` (lines 262–266). It appears in 10 test files. It is documented nowhere — not in any `.md` file under `documentation/`, not in `AGENTS.md`, not in `ARCHITECTURE.md`.
3. The corrective rerender pattern (`initFunction().triggerResize()` → committed DOM ancestry read) is used by `ActiveRouteTextHtmlWidget.js` (lines 278–281) and `MapZoomTextHtmlWidget` (same pattern). It is not documented in `plugin-lifecycle.md`, `add-new-html-kind.md`, `html-widget-visual-style-guide.md`, `surface-session-controller.md`, or `runtime-lifecycle.md`. PLAN6.md is the only document that describes this pattern.
4. `.widgetContainer.vertical` is used in CSS by `ActiveRouteTextHtmlWidget.css` (line 18) and `MapZoomTextHtmlWidget.css` (line 20) for presentation overrides only. No documentation describes the vertical-container concept, the width-only anchor strategy, natural height computation, or the forced-mode contract. PLAN6.md introduces these concepts for routePoints but no generalizable doc exists.
5. The `add-new-html-kind.md` guide (191 lines) is a structural checklist with 8 steps. It does not mention `initFunction`, `triggerResize()`, corrective rerenders, `__dyniHostCommitState`, `.widgetContainer.vertical`, renderer file splits, box-driven text fitting workflows, grouped mapper output, or page-aware handler registration patterns.
6. The `html-widget-visual-style-guide.md` (124 lines) defines ownership contracts and a visual contract template. It does not contain implementation patterns for lifecycle, text fitting, or interaction.
7. `smell-prevention.md` fix playbooks occupy lines 76–244 (169 lines, 67% of the file). These playbooks are relevant only during cleanup sessions, not during the implementation sessions that load them via mandatory preflight.
8. TABLEOFCONTENTS.md has 9 entries pointing to `theme-tokens.md`, 8 to `full-circle-dial-style-guide.md`, 6 to `gauge-style-guide.md`, 5 to `cluster-widget-system.md`, 5 to `documentation-maintenance.md`. Total entries pointing to a destination that already has ≥3 entries for the same file: ~52 entries that could be collapsed to ~18 grouped entries.
9. The 400-line file-size rule is stated in AGENTS.md §3 (2 lines), coding-standards.md §File Size Limits (3 lines), and core-principles.md §5 (1 line). The "no ES modules / no bundler" rule is stated in AGENTS.md §1, coding-standards.md §Key Details, and core-principles.md §1. The "preserve falsy defaults" rule is stated in AGENTS.md §7, coding-standards.md §Key Details, core-principles.md §14, and smell-prevention.md catalog. At least 6 rules have 3+ restatements across mandatory preflight files.
10. `core-principles.md` (54 lines) contains 19 rules, each with a "Rationale:" line. The rationale lines are descriptive commentary, not actionable implementation guidance.
11. AGENTS.md §4 File Map (lines 117–131) contains 15 specific file references. Of these, 11 duplicate entries already present in TABLEOFCONTENTS.md. Four entries add unique routing value: TABLEOFCONTENTS.md itself, core-principles.md, ARCHITECTURE.md, and exec-plans/active/.
12. `documentation/conventions/documentation-format.md` (82 lines) defines the mandatory doc format: title, status, overview, key details, API/interfaces, related. The `check-doc-format.mjs` tool validates title, status, overview, and related sections.
13. `tools/check-doc-reachability.mjs` walks links from AGENTS.md and CLAUDE.md as entry points. Any new documentation files must be linked from an existing reachable doc or they will be flagged as unreachable.
14. `tools/check-docs.mjs` aggregates `check-doc-format` and `check-doc-reachability`. `npm run docs:check` runs this aggregated gate.
15. No `html-renderer-lifecycle.md`, `vertical-container-contract.md`, `smell-fix-playbooks.md`, or `exec-plan-authoring.md` exists in the repository today.
16. The `host-commit-controller.md` (76 lines) documents the API, scheduling sequence, and state shape of `HostCommitController`. It does not document the renderer-side consumption pattern for `hostContext.__dyniHostCommitState` or the committed-element shape exposed to HTML renderers.
17. The `active-route.md` (217 lines) documents the canonical HTML-kind reference implementation. It includes props, visual contract, layout constants, text-fit constants, and resize-signature contract. It does not explain the corrective rerender pattern, `__dyniHostCommitState` usage, or the `initFunction().triggerResize()` motivation — these are in the source code only.
18. `ResponsiveScaleProfile.computeProfile(W, H, spec)` computes `minDim = min(W, H)` internally. Passing `W` for both dimensions forces `minDim = W`. This trick is documented in `responsive-scale-profile.md` line 26 (`computeProfile(W, H, spec)`) but the vertical-container application of `computeProfile(W, W, spec)` is not documented anywhere outside PLAN6.md.
19. `ActiveRouteTextHtmlWidget.js` resolves host elements via `resolveHostElements(hostContext)` which reads `hostContext.__dyniHostCommitState.shellEl` and `hostContext.__dyniHostCommitState.rootEl` (lines 40–49). `MapZoomHtmlFit.js` reads `hostContext.__dyniHostCommitState` at line 43. Both use the same consumption pattern but it is documented nowhere.

---

## Hard Constraints

### Scope

- Documentation files only. No `.js`, `.css`, `.json`, or config changes.
- No changes to any file under `tests/`, `tools/`, `runtime/`, `cluster/`, `shared/`, `widgets/`, `config/`, or `perf/`.
- No changes to `plugin.js`, `plugin.css`, `package.json`, `package-lock.json`, `vitest.config.js`, or `skills-lock.json`.
- No changes to exec-plans other than creating this plan file.

### Content accuracy

- New documentation must describe only patterns that exist in the current codebase. Do not document aspirational or planned behavior that has not been implemented.
- Source-of-truth for runtime patterns: existing source code in `cluster/ClusterWidget.js`, `widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js`, `widgets/text/MapZoomTextHtmlWidget/MapZoomTextHtmlWidget.js`, `cluster/rendering/HtmlSurfaceController.js`, `runtime/HostCommitController.js`, `runtime/SurfaceSessionController.js`, and `shared/widget-kits/html/HtmlWidgetUtils.js`.
- Source-of-truth for vertical-container and advanced HTML-kind patterns: the architectural contracts defined in §1A and §1B of this plan. Where patterns describe behavior not yet shipped (natural-height computation, forced-mode contracts), the documentation must clearly mark these as "architectural contract for kinds that need intrinsic sizing" rather than describing existing behavior.
- The `.widgetContainer.vertical` presentation overrides in `ActiveRouteTextHtmlWidget.css` and `MapZoomTextHtmlWidget.css` are the only currently shipped vertical behavior. Document the CSS overrides as existing, and the natural-height pattern as the architectural contract for kinds that need intrinsic sizing.

### Format

- All new documentation must follow the mandatory format from `documentation/conventions/documentation-format.md`: title, status, overview (1–2 sentences), key details, API/interfaces where applicable, related links.
- No verbose prose. No "why" sections longer than one sentence. No decorative formatting.
- Tables over bullet lists for structured contracts.
- Code blocks only for signatures, patterns, and compact examples (max 1–2 per section).

### Token budget

- New docs must be compact: `html-renderer-lifecycle.md` ≤ 120 lines, `vertical-container-contract.md` ≤ 80 lines, expanded `add-new-html-kind.md` addition ≤ 80 lines, `exec-plan-authoring.md` ≤ 80 lines, `smell-fix-playbooks.md` is a move (no new content).
- Compression targets: AGENTS.md ≤ 140 lines (from 176), core-principles.md ≤ 35 lines (from 54), smell-prevention.md ≤ 95 lines (from 251), TABLEOFCONTENTS.md ≤ 130 lines (from 165).
- Net mandatory-preflight token change must be negative. Target: ~1,200 token reduction.

### Validation

- `npm run docs:check` must pass after every phase.
- All new files must be reachable from AGENTS.md or CLAUDE.md via the link-walk in `check-doc-reachability.mjs`.
- No broken internal links in any modified file.

---

## Implementation Order

### Phase 1 — New Architecture Docs (Knowledge Gap Fills)

**Intent:** create the two architecture docs that fill the critical lifecycle and vertical-container knowledge gaps.

**Dependencies:** none.

#### 1A. Create `documentation/architecture/html-renderer-lifecycle.md`

Target: ≤ 120 lines.

Required sections and content:

**Overview** (1–2 sentences): Documents the renderer-side lifecycle patterns for `surface: "html"` kinds, covering the two-phase render model, committed host fact consumption, post-commit DOM effects, and resize-signature stability.

**Key Details:**

- HTML renderers run inside the `HtmlSurfaceController` lifecycle (`attach`/`update`/`detach`/`destroy`), but the renderer must also understand the host-commit timing that precedes `attach`.
- `renderHtml(props)` executes before the returned markup is mounted in the DOM. Committed DOM ancestry is unreliable at this point.
- `initFunction().triggerResize()` requests one corrective rerender after the first mount. This is the canonical entry point for renderers that depend on committed DOM state.
- Corrective rerenders and later normal updates may read committed host facts from `hostContext.__dyniHostCommitState`.

**Two-Phase Render Pattern** (table or compact flow):

| Phase               | Timing                                 | DOM state               | Renderer behavior                                                                               |
| ------------------- | -------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| First render        | `renderHtml(props)` before mount       | No committed DOM        | Use host-sized assumptions. No DOM reads. No committed-ancestry checks.                         |
| Corrective rerender | After `initFunction().triggerResize()` | Committed DOM available | Read `hostContext.__dyniHostCommitState`. Resolve committed ancestry. Apply layout corrections. |
| Normal updates      | Later `renderHtml(props)` calls        | Committed DOM available | Same as corrective rerender. Re-evaluate committed facts each pass.                             |

**`hostContext.__dyniHostCommitState` Contract:**

Shape (set by `ClusterWidget.js`, read by renderers):

```text
hostContext.__dyniHostCommitState = {
  instanceId: string,
  renderRevision: number,
  mountedRevision: number,
  lastProps: object | undefined,
  rootEl: Element | null,
  shellEl: Element | null,
  scheduledRevision: number,
  rafHandle: number | null,
  observer: MutationObserver | null,
  timeoutHandle: number | null,
  commitPending: boolean
}
```

Renderer consumption rules:

- Read `shellEl` and `rootEl` for committed DOM element references.
- `targetEl = shellEl || rootEl` is the standard resolution (see `ActiveRouteTextHtmlWidget.resolveHostElements`).
- If `__dyniHostCommitState` is missing, null, or lacks committed elements, fail closed: skip committed-DOM work, use host-sized assumptions, do not throw.
- Do not write to `__dyniHostCommitState`. Ownership is `ClusterWidget.js` only.

**Post-Commit DOM Effects Pattern:**

For renderers that need committed-DOM reads or writes after the markup is mounted (e.g., ancestry detection, scroll correction):

- Create a dedicated DOM-effects module that owns all committed-DOM side effects.
- The renderer shell schedules effects after attach and after rerenders that may change DOM state.
- Effects must be bounded (no unbounded polling), stale-safe (drop outdated scheduled work), and idempotent (repeated calls with same state produce no mutation).
- Effects must not cause resize-signature changes that trigger rerender loops.

Reference implementation: `ActiveRouteTextHtmlWidget.resolveHostElements` (committed element resolution).

**Resize-Signature Stability Rules:**

- `resizeSignature(props, hostContext)` must include all inputs that affect layout geometry and text fitting.
- Must not include inputs that are self-produced by the widget (e.g., a widget that computes its own height must not include that height in the signature, or the signature will churn).
- When a widget has two modes (e.g., host-sized vs. vertical-container), the signature may use different input sets per mode. The mode flag itself must be in both signatures.
- `HtmlSurfaceController` calls `triggerResize()` exactly once per signature change. Stable signatures prevent unnecessary rerenders.

**Related:** host-commit-controller.md, surface-session-controller.md, cluster-widget-system.md, add-new-html-kind.md, vertical-container-contract.md.

#### 1B. Create `documentation/architecture/vertical-container-contract.md`

Target: ≤ 80 lines.

Required sections and content:

**Overview** (1–2 sentences): Documents the `.widgetContainer.vertical` hosting context and the contracts HTML kinds must follow when computing intrinsic height inside vertical containers.

**Key Details:**

- `.widgetContainer.vertical` is an AvNav host layout class. AvNav owns when and where it is applied.
- Existing shipped behavior: `ActiveRouteTextHtmlWidget.css` and `MapZoomTextHtmlWidget.css` apply presentation overrides inside `.widgetContainer.vertical` (e.g., height adjustments). These are CSS-only and do not compute natural height.
- Advanced vertical contract (architectural pattern for kinds that need intrinsic sizing): force `high` mode, width-only anchor, natural height computation, wrapper-owned height injection.

**Detection:**

- Detection requires committed DOM ancestry: `targetEl.closest(".widgetContainer.vertical")`.
- Detection is authoritative only after attach (corrective rerender or later normal update). See `html-renderer-lifecycle.md` for timing.
- Pre-commit `renderHtml()` must treat vertical state as unknown and use host-sized assumptions.

**Width-Only Anchor Strategy:**

- Inside `.widgetContainer.vertical`, shell height is unknown or widget-computed. Using `min(W, H)` as anchor would be circular.
- Use `ResponsiveScaleProfile.computeProfile(W, W, spec)` to force `minDim = W`. This uses width as the sole structural anchor.
- All derived dimensions (row height, header height, gaps) must come from the width-only profile, not from shell height.

**Natural Height Computation:**

- Sum structural components: header height + header gap + (row count × row height) + max(0, row count − 1) × row gap + outer padding.
- Cap at `75vh` using `window.innerHeight` as viewport source (inject `viewportHeight` parameter for test environments).
- Clamp all derived heights to `>= 0`.
- Apply as inline style on the widget wrapper element (e.g., `.dyni-<widget>-html`).
- Never mutate `.dyni-surface-html`, `.widgetData.dyni-shell`, or any shared-owner element.

**Resize-Signature Rules for Vertical Mode:**

- Exclude shell height from the signature. Shell height in vertical mode is widget-produced and would cause churn.
- Include shell width, point/row count, mode flag, and `isVerticalCommitted` flag.
- The signature must remain stable when the only change is the widget's own computed height.

**CSS Pattern:**

```css
.widgetContainer.vertical .widget.dyniplugin .widgetData.dyni-shell .dyni-<widget>-html {
  height: auto;
  /* natural height applied as inline style by renderer */
}
```

**Related:** html-renderer-lifecycle.md, responsive-scale-profile.md, html-widget-visual-style-guide.md, add-new-html-kind.md.

#### 1C. Expand `documentation/architecture/host-commit-controller.md` with renderer consumption contract

Add a new section **"Renderer-Side Consumption (`__dyniHostCommitState`)"** after the existing API/Interfaces section. Target: ≤ 25 lines added.

Content:

- `ClusterWidget.js` sets `hostContext.__dyniHostCommitState` to the controller's state snapshot on init (line 65) and updates it on each render pass (line 111). On finalize it is set to `null` (line 142).
- HTML renderers read `shellEl` and `rootEl` from this state to resolve committed DOM elements.
- Standard resolution pattern: `targetEl = commitState.shellEl || commitState.rootEl`.
- If `__dyniHostCommitState` is missing or null, the renderer must use host-sized assumptions and skip committed-DOM work.
- Full lifecycle timing and fail-closed rules: see `html-renderer-lifecycle.md`.

#### 1D. Add TABLEOFCONTENTS.md entries for new docs

Add to the **Architecture** section:

```markdown
- **How does the HTML renderer lifecycle work (two-phase render, corrective rerender, committed host facts)?** → [architecture/html-renderer-lifecycle.md](architecture/html-renderer-lifecycle.md)
- **How does `.widgetContainer.vertical` detection and natural height computation work?** → [architecture/vertical-container-contract.md](architecture/vertical-container-contract.md)
```

Add to the **Feature-Specific Lookups** section:

```markdown
**"How do I read committed DOM state in an HTML renderer?"** → [architecture/html-renderer-lifecycle.md](architecture/html-renderer-lifecycle.md)
**"How do I make an HTML widget compute its own height in `.widgetContainer.vertical`?"** → [architecture/vertical-container-contract.md](architecture/vertical-container-contract.md)
```

#### 1E. Add AGENTS.md File Map entry for html-renderer-lifecycle

Add one line to §4 File Map:

```markdown
- HTML renderer lifecycle patterns (two-phase render, committed facts, post-commit effects): [documentation/architecture/html-renderer-lifecycle.md](documentation/architecture/html-renderer-lifecycle.md)
```

**Exit conditions:**

- `npm run docs:check` passes (format + reachability)
- New docs are reachable from AGENTS.md via TABLEOFCONTENTS.md link walk
- `html-renderer-lifecycle.md` ≤ 120 lines
- `vertical-container-contract.md` ≤ 80 lines
- `host-commit-controller.md` addition ≤ 25 lines

---

### Phase 2 — Guide Expansion (Teach Patterns, Not Just Checklist)

**Intent:** expand `add-new-html-kind.md` so that an agent building a complex HTML kind reads actionable patterns, not just a structural checklist.

**Dependencies:** Phase 1 must be complete (the guide will reference the new architecture docs).

#### 2A. Expand `documentation/guides/add-new-html-kind.md`

Add a new section **"Lifecycle Patterns for Complex HTML Kinds"** after the existing Step 8 and before the Validation section. Target: ≤ 80 lines added.

The section must cover five sub-topics:

**When to use the corrective rerender pattern:**

- Required when the renderer depends on committed DOM ancestry (e.g., `.widgetContainer.vertical` detection, container size from mounted elements).
- Add `initFunction` to the renderer's returned contract.
- `initFunction` calls `this.triggerResize()` to request one corrective rerender after first mount.
- Full contract: see `html-renderer-lifecycle.md`.
- Reference: `ActiveRouteTextHtmlWidget.js` lines 278–281.

**Renderer file split for complex HTML kinds:**

When a single renderer file would exceed the 400-line budget, split into separately registered UMD components:

| Module             | Responsibility                                                                                            | DOM access                                |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Shell (entrypoint) | Orchestrates lifecycle, exports `renderHtml`/`namedHandlers`/`resizeSignature`/`initFunction`             | Reads `hostContext.__dyniHostCommitState` |
| RenderModel        | Pure normalization: mode resolution, display-model assembly, interaction flags, resize-signature inputs   | None                                      |
| Markup             | Pure HTML string assembly: wrapper classes, escaped text, fit-style application, structural inline styles | None                                      |
| DomEffects         | Committed-DOM side effects: ancestry detection, post-commit scroll correction                             | Reads/writes committed DOM                |

Each module is a standalone UMD component with its own entry in `config/components/registry-widgets.js`. The shell depends on the helper modules via the normal `deps` chain. `ClusterRendererRouter` depends only on the shell.

**Box-driven text fitting workflow:**

For HTML kinds that use inline-style text fitting (not canvas drawing):

1. Layout module computes box rects for every text element.
2. Fit module measures text against each box using `RadialTextLayout.fitSingleTextPx(...)` or `TextTileLayout.measureFittedLine(...)` (measurement only).
3. Fit module returns inline `font-size:Npx;` style strings per text element.
4. Markup module applies the style strings via `style="..."` attributes.

Rules:

- Font size is reduced only when text does not fit its box.
- Never use ellipsis truncation for fitted text — always `white-space: nowrap` with `overflow: hidden`.
- Fit module must not alter, trim, or abbreviate text content. It returns font-size decisions only.
- Forbidden for fitted HTML text: `drawFittedLine(...)`, `trimToWidth(...)`, any helper that changes emitted text content.

**Page-aware handler registration:**

For HTML kinds that need interactive behavior on some pages but passive behavior on others:

1. Define a capability gate function: `canDispatch(hostContext)` checks `hostActions.getCapabilities()` for required dispatch capabilities plus any page-restricting capability.
2. `namedHandlers(props, hostContext)` returns `{ handlerName: fn }` when dispatch is active, `{}` when passive.
3. Markup adds `onclick="handlerName"` and `onclick="catchAll"` only in dispatch mode.
4. Never return `catchAll` from `namedHandlers` — it is host-owned and pre-registered.
5. In layout editing mode (`isEditingMode(props) === true`), always return passive.

Reference: `ActiveRouteTextHtmlWidget` (`canDispatchOpenRoute`/`activeRouteOpen`).

**Grouped mapper output for complex payloads:**

When a mapper branch needs more than 8 top-level props (smell rule `mapper-output-complexity`), group renderer-facing data into sub-objects:

```javascript
return {
  renderer: "NewHtmlWidget",
  domain: { /* route/selection/display state */ },
  layout: { /* thresholds, toggles */ },
  formatting: { /* unit strings, label text */ }
};
```

- The stable top-level shape is `renderer` + named groups.
- New groups may be added when a concrete field requires them.
- Existing groups must remain structurally stable after first implementation.
- `domain` receives data that affects what to render. `layout` receives data that affects geometry. `formatting` receives data that affects text presentation.

#### 2B. Update `add-new-html-kind.md` checklist

Add these items to the existing checklist:

```markdown
- [ ] Complex renderer split into Shell + helpers if approaching 400-line budget
- [ ] Corrective rerender pattern used when committed DOM ancestry is needed
- [ ] Text fitting follows box-driven workflow (font-size only, no text alteration)
- [ ] Handler registration is page-aware (dispatch/passive, never returns `catchAll`)
- [ ] Mapper output uses grouped sub-objects if >8 top-level props
```

#### 2C. Update `add-new-html-kind.md` Prerequisites

Add to the Prerequisites list:

```markdown
- [../architecture/html-renderer-lifecycle.md](../architecture/html-renderer-lifecycle.md)
- [../architecture/vertical-container-contract.md](../architecture/vertical-container-contract.md)
```

**Exit conditions:**

- `npm run docs:check` passes
- `add-new-html-kind.md` total ≤ 280 lines (191 existing + ≤ 80 new + ≤ 9 checklist/prereq lines)
- All internal links resolve

---

### Phase 3 — Token Waste Reduction (Mandatory Preflight Compression)

**Intent:** reduce the token cost of the mandatory preflight reads by deduplicating rules, splitting cleanup-only content, and compressing navigation indexes.

**Dependencies:** Phases 1–2 must be complete (TABLEOFCONTENTS.md updates from Phase 1D must be in place before compression).

###### 3A. Split `documentation/conventions/smell-prevention.md`

Create `documentation/conventions/smell-fix-playbooks.md`:

- Move the entire "Fix Playbooks" section (current lines 76–244) to this new file.
- Add a title, status, overview, and related section per documentation format.
- Title: `Smell Fix Playbooks`
- Status: `✅ Reference | Step-by-step remediation for smell catalog entries`
- Overview: `Remediation playbooks for smell rules defined in smell-prevention.md. Consult during cleanup sessions only.`

Update `smell-prevention.md`:

- Replace the Fix Playbooks section with a one-line reference:

```
 ## Fix Playbooks

 Remediation steps for each smell class: [smell-fix-playbooks.md](smell-fix-playbooks.md).
```

- In the smell catalog entry for `mapper-output-complexity`, add a one-line cross-reference to the grouped-output guidance in `documentation/guides/add-new-html-kind.md` so the implementation path is discoverable from mandatory preflight.
- Keep: smell catalog table, tooling matrix, suppression syntax, severity model, related.
- The remaining file must be ≤ 95 lines.

Add a Related link in the new `smell-fix-playbooks.md` back to `smell-prevention.md`.

#### 3B. Compress `documentation/TABLEOFCONTENTS.md`

Apply the grouped-entry pattern to all destination files that have ≥ 3 entries pointing to the same base file. Collapse entries that differ only by anchor into a single grouped entry.

Example transformation:

**Before (5 entries for cluster-widget-system.md):**

```markdown
- **How does ClusterWidget route to renderers?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
- **How does translateFunction mapper to graphic/numeric?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md#runtime-flow)
- **Where is active-route domain normalization/disconnect ownership defined?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md#viewmodel-modules)
- **Where is strict `cluster + kind -> surface + renderer` routing defined?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
- **How does the surface-aware router build shell markup and session payloads?** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
```

**After (1 grouped entry):**

```markdown
- **Cluster routing, mapper flow, kind catalog, surface router, viewmodel ownership** → [architecture/cluster-widget-system.md](architecture/cluster-widget-system.md)
```

Apply the same pattern to `theme-tokens.md` (9 → 2), `full-circle-dial-style-guide.md` (8 → 2), `gauge-style-guide.md` (6 → 2), `documentation-maintenance.md` (5 → 1), `plugin-lifecycle.md` (4 → 1), `css-theming.md` (4 → 1), `coding-standards.md` (4 → 1), `linear-gauge-style-guide.md` (4 → 1).

Keep single-entry destinations unchanged.

Also collapse the **Feature-Specific Lookups** section: merge entries that point to the same file with the same anchor or adjacent anchors.

Target: ≤ 130 lines total (from 165).

Preservation rules:

- Keep at least one entry per destination file so nothing becomes unreachable.
- Keep entries that route to distinct anchors within the same file only when the anchors represent genuinely different topic areas (e.g., "proportions" vs "pointer variants" in the same style guide are distinct enough to keep if they are the only two entries for that file after collapsing duplicates).
- The Feature-Specific Lookups section may remain as a separate section with collapsed entries.

#### 3C. Compress `AGENTS.md`

**Remove §3 File Size Limits entirely.** Canonical owner is `coding-standards.md` §File Size Limits. The mandatory preflight already reads `coding-standards.md`.

**Reduce §4 File Map** to these entries only (remove the 11 entries that duplicate TABLEOFCONTENTS.md):

```markdown
## 4. File Map

- Feature and API lookups: [documentation/TABLEOFCONTENTS.md](documentation/TABLEOFCONTENTS.md)
- Non-negotiable project rules: [documentation/core-principles.md](documentation/core-principles.md)
- Root structural orientation map: [ARCHITECTURE.md](ARCHITECTURE.md)
- HTML renderer lifecycle patterns: [documentation/architecture/html-renderer-lifecycle.md](documentation/architecture/html-renderer-lifecycle.md)
- Step-by-step implementation workflows: [documentation/guides/](documentation/guides/)
- Multi-session active execution plans: [exec-plans/active/](exec-plans/active/)
```

**Reduce §7 Smell Prevention & Fail-Closed Rules.** Replace the current 17-line section with:

```markdown
## 7. Smell Prevention & Fail-Closed Rules

- Mandatory on every task: follow `documentation/conventions/coding-standards.md` and `documentation/conventions/smell-prevention.md` as binding rules.
- Required completion gate: `npm run check:all` (`check:core` + `test:coverage:check` + `perf:check`).
- Full smell catalog, enforcement matrix, and suppression syntax: [documentation/conventions/smell-prevention.md](documentation/conventions/smell-prevention.md).
- Fail-fast / keep-it-simple is mandatory. Details: [documentation/conventions/coding-standards.md](documentation/conventions/coding-standards.md#fail-fast--keep-it-simple).
```

Keep §0, §1, §2, §5, §6 unchanged.

Target: ≤ 140 lines (from 176).

#### 3D. Compress `documentation/core-principles.md`

Remove all "Rationale:" lines.

Replace fully restated rules with one-line references to their canonical owner. Retain the rule number and one-sentence rule statement, but replace the rationale with a `→ canonical-owner.md` reference when the rule is documented in detail elsewhere.

Example transformation:

**Before:**

```markdown
5. Rule: Keep JavaScript files at or below 400 lines; split before crossing the limit.
Rationale: Focused files improve agent accuracy and reduce regression risk.
```

**After:**

```markdown
5. Rule: Keep JavaScript files at or below 400 lines; split before crossing the limit. → [coding-standards.md](conventions/coding-standards.md#file-size-limits)
```

Rules that have a canonical owner elsewhere (rules 1, 2, 3, 5, 7, 8, 9, 14, 15, 16, 17, 18, 19) get the `→ owner-link` suffix and lose the rationale line. Rules that are self-contained (rules 4, 6, 10, 11, 12, 13) keep their rule statement, lose the rationale line, and gain no `→` link since they are their own canonical source.

Target: ≤ 35 lines (from 54).

#### 3E. Verify net token reduction

After all compressions, calculate line counts for the four mandatory preflight files:

| File                | Before  | Target          |
| ------------------- | ------- | --------------- |
| AGENTS.md           | 176     | ≤ 140           |
| TABLEOFCONTENTS.md  | 165     | ≤ 130           |
| coding-standards.md | 187     | 187 (unchanged) |
| smell-prevention.md | 251     | ≤ 95            |
| **Total**           | **779** | **≤ 552**       |

Net reduction: ≥ 227 lines from mandatory preflight. At ~5 tokens per line average for structured markdown, this is ≥ 1,135 tokens saved per session.

**Exit conditions:**

- `npm run docs:check` passes
- AGENTS.md ≤ 140 lines
- TABLEOFCONTENTS.md ≤ 130 lines
- smell-prevention.md ≤ 95 lines
- core-principles.md ≤ 35 lines
- smell-fix-playbooks.md exists and is reachable
- No broken internal links in any modified file

---

### Phase 4 — Structural Improvements (Future Plan Quality)

**Intent:** codify the structural patterns used in the routePoints execution plan (PLAN6.md) so future execution plans achieve consistent first-attempt success.

**Dependencies:** Phases 1–3 must be complete.

#### 4A. Create `documentation/guides/exec-plan-authoring.md`

Target: ≤ 80 lines.

Required sections and content:

**Overview:** Defines the structural template for multi-session execution plans that achieve high first-attempt implementation success.

**Key Details:**

- Execution plans live under `exec-plans/active/` while in progress and move to `exec-plans/completed/` when done.
- Plans are named `PLAN{N}.md` with sequential numbering.
- Plans are the source of truth for complex implementation tasks that span multiple files or sessions.

**Required Plan Sections:**

| Section              | Purpose                                                   | Contract                                                                                             |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Status               | Scope and binding authority                               | State what the plan covers and which parts are prescriptive vs. flexible                             |
| Goal                 | Expected outcomes                                         | Bullet list of all observable results after completion                                               |
| Verified Baseline    | Numbered facts checked against the repo                   | Eliminates assumption errors; each fact must be verified before the plan is finalized                |
| Hard Constraints     | Explicit "do not" rules                                   | Scope boundaries, files that must not change, architectural limits                                   |
| Implementation Order | Phased deliverables with dependencies and exit conditions | Each phase has intent, dependencies, deliverables, and exit conditions (tests/checks that must pass) |
| Acceptance Criteria  | Grouped by area                                           | Tied to specific implementation owners where applicable                                              |
| Related              | Links to docs and other plans                             | Cross-reference dependency chain                                                                     |

**Verified Baseline Rules:**

- Number each fact sequentially.
- Each fact must be checked against the current repository state, not recalled from memory or documentation.
- Include: existing file paths, API shapes, current config values, shipped tuples, existing test patterns.
- Include: explicit negative facts ("no X exists in the repository today") when the plan adds something new.

**Hard Constraints Rules:**

- State what must not change (existing files, existing tests, existing APIs).
- State scope boundaries (which directories/file types are in scope).
- State architectural limits (no new responsive curves, no duplicated utilities, etc.).

**Phase Structure Rules:**

- Each phase has a one-sentence intent.
- Dependencies on prior phases are explicit.
- Deliverables are concrete: file paths, section names, registration entries.
- Exit conditions are executable: `npm run check:all` passes, specific tests pass, line counts met.

**Anti-Patterns:**

- Do not create plans without a verified baseline — assumption errors cascade into implementation failures.
- Do not mix implementation and documentation phases — complete code before writing docs about it.
- Do not defer acceptance criteria to "after implementation" — define them in the plan so the agent knows when it is done.

**Related:** PLAN6.md (canonical reference plan), coding-standards.md, documentation-format.md, documentation-maintenance.md.

#### 4B. Add TABLEOFCONTENTS.md entry for exec-plan-authoring

Add to the **Documentation Maintenance** section:

```markdown
- **How do I write an effective execution plan?** → [guides/exec-plan-authoring.md](guides/exec-plan-authoring.md)
```

#### 4C. Update `documentation/guides/documentation-maintenance.md` Related section

Add a link to `exec-plan-authoring.md` if a Related section exists.

**Exit conditions:**

- `npm run docs:check` passes
- `exec-plan-authoring.md` ≤ 80 lines
- New doc is reachable from AGENTS.md via link walk

---

### Phase 5 — Cross-Reference Alignment and Final Validation

**Intent:** ensure all new and modified docs have correct cross-references and the full validation gate passes.

**Dependencies:** Phases 1–4 must be complete.

#### 5A. Update Related sections and add pointer notes in modified docs

Ensure all modified files have correct Related sections that include links to new docs where relevant:

- `host-commit-controller.md` → add `html-renderer-lifecycle.md`
- `surface-session-controller.md` → add `html-renderer-lifecycle.md`
- `runtime-lifecycle.md` → add `html-renderer-lifecycle.md`
- `plugin-lifecycle.md` → add `html-renderer-lifecycle.md`
- `interactive-widgets.md` → add `html-renderer-lifecycle.md`
- `html-widget-visual-style-guide.md` → add `html-renderer-lifecycle.md`, `vertical-container-contract.md`
- `active-route.md` → add `html-renderer-lifecycle.md`
- `map-zoom.md` → add `html-renderer-lifecycle.md`, `vertical-container-contract.md`
- `responsive-scale-profile.md` → add `vertical-container-contract.md`
- `smell-prevention.md` → add `smell-fix-playbooks.md`
- `smell-fix-playbooks.md` → add `smell-prevention.md`

Add brief pointer notes in the docs that are common implementation waypoints so readers do not retain the old partial mental model:

- `plugin-lifecycle.md` → add a compact note that HTML renderers may require a corrective rerender after first mount when committed DOM ancestry is needed; link to `html-renderer-lifecycle.md`.
- `interactive-widgets.md` → add a compact note that dispatch-capable HTML widgets must still defer committed-DOM-dependent interaction wiring until post-mount lifecycle phases; link to `html-renderer-lifecycle.md`.
- `active-route.md` → add a compact implementation note that its HTML renderer uses `initFunction().triggerResize()` plus committed host facts for corrective rerender behavior; link to `html-renderer-lifecycle.md`.
- `map-zoom.md` → add a compact implementation note that its HTML renderer follows the same corrective-rerender pattern and ships CSS-only `.widgetContainer.vertical` presentation overrides; link to `html-renderer-lifecycle.md` and `vertical-container-contract.md`.

Rules for these added notes:

- Keep each note to 1–3 lines.
- Do not duplicate the full lifecycle contract in multiple files.
- The detailed source of truth remains `html-renderer-lifecycle.md` and `vertical-container-contract.md`.

#### 5B. Verify AGENTS.md shared-instructions block

The `<!-- BEGIN SHARED_INSTRUCTIONS -->` / `<!-- END SHARED_INSTRUCTIONS -->` block in AGENTS.md is mirrored to CLAUDE.md by `tools/sync-ai-instructions.mjs`. After compressing AGENTS.md, verify the sync tool can still process the markers. Run:

```bash
node tools/sync-ai-instructions.mjs --check
```

If CLAUDE.md exists and uses the same shared block, update it to match the compressed AGENTS.md content.

#### 5C. Final validation gate

Run:

```bash
npm run docs:check
```

Verify:

- Zero format failures
- Zero broken links
- Zero unreachable docs

**Exit conditions:**

- `npm run docs:check` passes with zero findings
- All Related sections in modified docs include links to relevant new docs
- AGENTS.md sync check passes (if applicable)

---

## Acceptance Criteria

### New architecture docs

- `documentation/architecture/html-renderer-lifecycle.md` exists, ≤ 120 lines, documents: two-phase render pattern, `__dyniHostCommitState` shape and consumption rules, post-commit DOM effects pattern, resize-signature stability rules.
- `documentation/architecture/vertical-container-contract.md` exists, ≤ 80 lines, documents: `.widgetContainer.vertical` detection, width-only anchor strategy via `computeProfile(W, W, spec)`, natural height computation, wrapper-owned height injection, vertical-mode resize-signature rules, CSS pattern.
- `documentation/architecture/host-commit-controller.md` contains the renderer-side `__dyniHostCommitState` consumption section, ≤ 25 lines added.
- An agent reading the three architecture docs plus `add-new-html-kind.md` can correctly implement the lifecycle for a new HTML kind that uses corrective rerenders, committed DOM ancestry, and vertical-container support — without reading source code or execution plans.

### Guide expansion

- `documentation/guides/add-new-html-kind.md` contains the "Lifecycle Patterns for Complex HTML Kinds" section, total file ≤ 280 lines.
- The section covers: corrective rerender usage, renderer file split, box-driven text fitting workflow, page-aware handler registration, grouped mapper output.
- Checklist includes the five new items.
- Prerequisites include the two new architecture docs.

### Token waste reduction

- AGENTS.md ≤ 140 lines (from 176). §3 removed, §4 reduced, §7 reduced.
- `smell-prevention.md` ≤ 95 lines (from 251). Fix playbooks moved out.
- `smell-fix-playbooks.md` exists and contains the playbook content.
- `smell-prevention.md` includes a cross-reference from `mapper-output-complexity` to grouped-output guidance in `add-new-html-kind.md`.
- TABLEOFCONTENTS.md ≤ 130 lines (from 165). Multi-entry groups collapsed.
- `core-principles.md` ≤ 35 lines (from 54). Rationale lines removed, canonical-owner references added.
- Net mandatory-preflight line reduction ≥ 227 lines (≥ ~1,135 tokens per session).

### Structural improvements

- `documentation/guides/exec-plan-authoring.md` exists, ≤ 80 lines, documents the required plan sections, verified baseline rules, hard constraints rules, phase structure rules, and anti-patterns.
- TABLEOFCONTENTS.md links to `exec-plan-authoring.md`.

### Validation

- `npm run docs:check` passes with zero format failures, zero broken links, zero unreachable docs.
- All new docs follow the mandatory format (title, status, overview, related).
- All cross-references between modified and new docs resolve.
- `plugin-lifecycle.md`, `interactive-widgets.md`, `active-route.md`, and `map-zoom.md` contain brief pointer notes to the new lifecycle docs in addition to Related links.

### No scope violations

- No `.js`, `.css`, `.json`, or config files were modified.
- No files under `tests/`, `tools/`, `runtime/`, `cluster/`, `shared/`, `widgets/`, `config/`, or `perf/` were modified.

---

#### Related

- [PLAN6.md](PLAN6.md) — routePoints implementation plan and source of truth for undocumented lifecycle and vertical-container patterns
- [PLAN1.md](../completed/PLAN1.md) — original `renderHtml` architecture plan
- [core-principles.md](../../documentation/core-principles.md) — architectural principles
- [coding-standards.md](../../documentation/conventions/coding-standards.md) — coding patterns and naming
- [documentation-format.md](../../documentation/conventions/documentation-format.md) — doc format rules
- [smell-prevention.md](../../documentation/conventions/smell-prevention.md) — smell catalog and enforcement
- smell-fix-playbooks.md — cleanup-only remediation playbooks split from mandatory preflight
- [add-new-html-kind.md](../../documentation/guides/add-new-html-kind.md) — HTML kind authoring guide
- [exec-plan-authoring.md](../../documentation/guides/exec-plan-authoring.md) — execution plan structure for multi-session work
- html-renderer-lifecycle.md — renderer-side two-phase lifecycle, corrective rerender, and committed host facts
- vertical-container-contract.md — `.widgetContainer.vertical` timing, width-only anchor strategy, and intrinsic-height rules
- [html-widget-visual-style-guide.md](../../documentation/shared/html-widget-visual-style-guide.md) — visual contract template
- [plugin-lifecycle.md](../../documentation/avnav-api/plugin-lifecycle.md) — renderer lifecycle entrypoints and resize behavior
- [interactive-widgets.md](../../documentation/avnav-api/interactive-widgets.md) — host interaction and capability model
- [host-commit-controller.md](../../documentation/architecture/host-commit-controller.md) — deferred commit API and renderer consumption handoff
- [surface-session-controller.md](../../documentation/architecture/surface-session-controller.md) — surface lifecycle API
- [active-route.md](../../documentation/widgets/active-route.md) — canonical HTML-kind reference
- [map-zoom.md](../../documentation/widgets/map-zoom.md) — second shipped HTML-kind reference with corrective rerender usage
