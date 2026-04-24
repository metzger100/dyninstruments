# PLAN17 — Stable release tooling, canonical in-repo artifacts, registry-owned runtime assets, and user-focused docs

## Status

Approved after repository review and issue resolution.

PLAN17 is **blocked until PLAN15 and PLAN16 are merged**.

This plan lands **after PLAN15 and PLAN16** and must be implemented only on a repository state that already contains their runtime changes.

PLAN17 also bootstraps the first stable release, but **bootstrap is manual**:

- the first stable version is **`1.0.0`**
- bootstrap `1.0.0` is created manually as the **last phase of PLAN17**
- `release:prepare` is **not** used before the first tag exists
- after `v1.0.0` exists locally, future release sessions use the normal documented release process

Repo-grounded corrections folded into this final plan:

- `plugin.js` remains the authoritative live-code source for bootstrap script order; release tooling derives that order through a narrowly scoped extractor rather than through a second shared manifest
- `runtime/component-loader.js` already defines the authoritative runtime dependency expansion rules for `config.components`; PLAN17 reuses that graph model for release packaging
- `config.components` entries currently carry `js`, `css`, and optionally `shadowCss`; PLAN17 adds a **mandatory keyed `assets` object** to every component entry
- all runtime assets become **registry-owned**
- runtime CSS must no longer own repo-local runtime assets through `url(...)`; current bundled fonts in `plugin.css` must therefore be migrated in **Phase 1**
- `tools/components-registry-loader.mjs` remains the authority for loading `config.components`
- a small sibling tooling helper evaluates the runtime bootstrap config chain and returns:
  - `components`
  - `widgetDefinitions`
  - `runtimeRequiredComponents`
- tooling extracts the ordered bootstrap script list directly from `plugin.js` once, and all tooling helpers reuse that extracted order rather than maintaining a second hardcoded script chain
- top-level widgets receive component-bound helpers by default through runtime registration, while shared child components rebind explicitly when they need their own asset scope
- widget/component asset access stays on `Helpers`, while runtime-only module calls use `loader.getResolvedAssets(componentId)`
- `FontAssets` is a runtime-layer registry component declared through a dedicated `runtime` registry group, and its font-face descriptors live inside `runtime/FontAssets.js` rather than in the generic component schema
- the runtime dependency closure reused by release packaging is produced by one shared pure helper consumed by both runtime init and tooling
- the current `package.json` version is `0.0.0-test`; PLAN17 updates version metadata to `1.0.0` for the first stable release
- the repo currently has **no git tags** and **no release scripts**; PLAN17 adds those
- the current root `README.md` still mixes user and developer content; PLAN17 makes it fully user focused
- `runtime/component-closure.js` loads immediately before `runtime/component-loader.js`, so the loader can reuse the shared closure helper without late-binding ambiguity
- the bootstrap extractor targets the single `const internalScripts = [...]` declaration in the outer bootstrap IIFE body of `plugin.js`
- the bootstrap config loader derives its config-relevant execution subset from extracted bootstrap order rather than from a second manual script chain
- `loadComponent(id)` returns a normalized loaded-component record while `Helpers.getModule(id)` preserves the raw module lookup contract
- `runtime/FontAssets.js` is a registry component module exported through `DyniComponents`, even though the file lives under `runtime/`
- `shadowCss` access is resolved through `loader.getResolvedShadowCss(componentId)` and a narrow helper-facing boundary, not direct `ns.config.components` inspection
- helper rebinding explicitly covers top-level widgets, cluster child components, mapper children, direct renderers, wrapper renderers, and delegated renderers
- `hint_basis` is top-level in `SUMMARY_JSON`; `semver_hints` contains booleans only
- `release:create` creates lightweight local tags, and the GitHub workflow resolves the tagged commit defensively before validation
- the GitHub Releases workflow declares `contents: write` and publishes committed artifacts through GitHub API tooling without installing project dependencies

---

## Goal

Implement a stable release workflow that:

1. creates a **plugin-loader-compliant runtime-only zip** rooted at `dyninstruments/`
2. stores the **canonical release artifacts inside the repository** under a versioned `releases/` layout
3. gives Codex enough structured context to decide the next **SemVer** version
4. makes the release flow fail closed by running **`npm run check:all`** before release creation succeeds
5. rewrites `README.md` to be **fully user focused**
6. moves release mechanics into dedicated documentation
7. publishes to **GitHub Releases** from the already committed canonical artifacts after the local release flow has succeeded

---

## Final release authority model

### Version baseline and truth

- the authoritative previous release baseline is the **highest SemVer tag reachable from `HEAD`** matching `vX.Y.Z`
- diff scope is that tag to `HEAD`
- `package.json` and `package-lock.json` mirror the chosen release version but are **not** the release authority

### Canonical release artifacts

The canonical release contents live in the repository at:

- `releases/{semver}/dyninstruments-{semver}.zip`
- `releases/{semver}/dyninstruments-{semver}.md`

Example:

- `releases/1.0.0/dyninstruments-1.0.0.zip`
- `releases/1.0.0/dyninstruments-1.0.0.md`

### User download channel

- **GitHub Releases** is the canonical public user download channel
- the in-repo `releases/{semver}/` directory is also documented as a source of the canonical artifacts
- GitHub Releases is an addition on top of the committed repository artifacts, not the sole source of truth

---

## SemVer policy

### Stable baseline

The project exits pre-release with PLAN17. Remove the “pre-release / compatibility may change” wording from user-facing docs.

### Version shape

Use standard SemVer:

- `MAJOR.MINOR.PATCH`

### Who decides the next version

- the **Codex release session** decides whether the next version is MAJOR, MINOR, or PATCH
- tools do **not** choose the version
- tools provide the evidence and validation needed for that decision

### Valid increment rule

When at least one reachable release tag exists, `release:create` must validate that the chosen version is exactly one valid semver step above the **highest reachable SemVer tag from `HEAD`**:

- patch: `X.Y.(Z+1)`
- minor: `X.(Y+1).0`
- major: `(X+1).0.0`

### Manual bootstrap rule

When **no** reachable SemVer tag matching `vX.Y.Z` exists:

- `release:prepare` must fail hard with a manual bootstrap message
- the first release is created manually as **`1.0.0`**
- `release:create` must accept **only** `--version 1.0.0`
- any other version fails hard
- after lightweight local tag `v1.0.0` exists, the normal increment rule applies

---

## Declarative live-code authority sources

### Bootstrap script authority

The authoritative internal bootstrap script order remains in `plugin.js`.

Rules:

- `plugin.js` remains the bootstrap entrypoint and the sole live-code authority for bootstrap script order
- changes to `plugin.js` under PLAN17 are allowed only when they establish cleaner runtime module loading needed by the plugin itself
- PLAN17 must **not** introduce a shared runtime manifest whose only purpose is to feed release tooling
- release tooling may extract the ordered bootstrap script list from `plugin.js` only through a narrowly scoped, syntactically stable extractor rule
- `plugin.js` must keep exactly one authoritative bootstrap array declaration
- that declaration is the single `const internalScripts = [...]` declaration in the outer bootstrap IIFE body of `plugin.js`
- the plan's phrase "top-level bootstrap array" means top-level within the outer bootstrap IIFE, not JavaScript program/module top-level
- that array must contain only static string-literal relative paths
- no spreads, concatenation, helper-built arrays, computed expressions, loops, or conditionals are allowed inside that declaration
- tooling must fail hard if `plugin.js` no longer matches that exact extractor pattern
- tooling must fail hard if there is not exactly one `const internalScripts = [...]`, if the declaration is outside the outer bootstrap IIFE body, or if any entry is non-literal, absolute, protocol-based, empty, duplicated, or contains traversal
- tooling must **not** evaluate arbitrary JavaScript semantics
- tooling must **not** maintain a second mirrored manual list

### Declarative runtime-required components

The always-loaded runtime-required component list must also have one live declarative source.

Add:

- `config/shared/runtime-required-components.js`

It defines the canonical list, for example:

- `ns.config.shared.runtimeRequiredComponents = ["ThemeModel", "ThemeResolver", "FontAssets"]`

Rules:

- `runtime/init.js` uses this list in addition to the widget-derived runtime closure
- release packaging uses the same list in addition to the widget-derived runtime closure
- no second mirrored manual list is allowed elsewhere
- checks validate:
  - no duplicates
  - every referenced component id exists in `config.components`

---

## Release commands

### Release preparation

```bash
npm run release:prepare
```

Purpose:

- token-efficient release evidence gathering for the Codex release session
  
- no human summary output
  
- no raw runtime or engineering diffs
  
- no version selection
  
- no artifact creation
  
- runs `npm run check:all`
  
- emits exactly one machine-readable line at the end:
  
  - `SUMMARY_JSON=<json>`

Output handling rule:

- `release:prepare` must execute `npm run check:all` programmatically and must **not** stream the full ordinary check output through as release evidence
  
- on success, `SUMMARY_JSON` includes structured `check_all` status metadata only
  
- on failure, `release:prepare` fails hard and may print only a short bounded failure summary, such as the failing subcommand and the final relevant lines
  
- it must **not** dump the full test, coverage, or perf logs
  

### Release creation

npm run release:create -- --version X.Y.Z

Purpose:

- validate expected dirty state
  
- run `npm run check:all` and fail closed before any mutation
  
- validate release note and version rules
  
- update `package.json` and `package-lock.json`
  
- create the canonical zip
  
- create the local release commit
  
- create the local lightweight `vX.Y.Z` tag
  

There is **no** `release:rollback`.

Manual recovery is documented instead.

### Single-writer version rule

During PLAN17 implementation, normal development changes to `package.json` and `package-lock.json` are allowed when they are required to add release scripts, dependencies, or other non-version release infrastructure.

Within an actual release session, `release:create` is the **only** command that may update the release version fields in `package.json` and `package-lock.json`.

That rule applies:

- to the bootstrap `1.0.0` release
  
- to all later tagged releases
  

---

## Canonical release-session order

The release session always starts in a clean repository.

### Required starting state

Before the session starts:

- no modified tracked files
  
- no non-ignored untracked files
  
- ignored generated artifacts may remain
  
- no partial release artifacts
  

For PLAN17 release tooling, 
repository cleanliness is defined in git terms: tracked modifications 
and non-ignored untracked files are forbidden, but ignored generated 
outputs from checks may remain.

If the repository is dirty under that rule, the release flow fails hard.

### Normal release flow after `v1.0.0`

1. start with a clean repository
  
2. start the release Codex session
  
3. Codex reads `AGENTS.md`
  
4. Codex completes the mandatory AGENTS preflight
  
5. Codex reads the release guide linked from `documentation/TABLEOFCONTENTS.md`
  
6. Codex runs `npm run release:prepare`
  
7. if `npm run check:all` passed, Codex decides the next version from `SUMMARY_JSON`
  
8. Codex writes only the canonical release note:
  
  - `releases/{semver}/dyninstruments-{semver}.md`
9. Codex runs:
  
  - `npm run release:create -- --version X.Y.Z`
10. `release:create` validates state, updates version files, creates the zip, creates the release commit, and creates the lightweight local tag
  
11. Codex writes a summary and ends the session
  
12. the human reviews the generated local release commit and tag
  
13. if accepted, the human pushes the commit and tag to GitHub
  
14. the tag push triggers the GitHub Releases workflow
  

### Manual bootstrap flow for `1.0.0`

PLAN17 implementation happens in normal committed phases. Creating `1.0.0` is the **last phase**.

1. implement PLAN17 tooling, docs, and runtime changes in normal development commits
  
2. commit those PLAN17 implementation phases
  
3. start a fresh clean release session from that committed state
  
4. do **not** run `release:prepare`
  
5. run:
  
  - `npm run check:all`
  
  This manual check remains required for the bootstrap flow even though `release:create` also reruns `npm run check:all` before mutation.
  
6. manually write:
  
  - `releases/1.0.0/dyninstruments-1.0.0.md`
7. run:
  
  - `npm run release:create -- --version 1.0.0`
8. `release:create` updates version files, creates the zip, creates the release commit, and creates the lightweight local tag `v1.0.0`
  

### Only allowed repository changes during release creation

Before `release:create`, the only allowed dirty state is:

- the AI-created canonical release note at `releases/{semver}/dyninstruments-{semver}.md`

That release note must be present as an **unstaged** working-tree file.

The directory `releases/{semver}/` may already exist, but before `release:create` it may contain **only** that canonical release note and no zip.

This means the release note is the only allowed local deviation from a clean repo before `release:create`; the note is not an example of a broader dirty-state allowance.

After `release:create`, the mandatory generated state is:

- the release note
  
- updated `package.json`
  
- updated `package-lock.json`
  
- the canonical release zip
  

No other tracked modifications or non-ignored untracked files are allowed. Ignored generated artifacts may remain.

---

## `release:prepare` contract

`release:prepare` must be as token-efficient as possible.

It must:

- verify the repository is clean under the PLAN17 git-based clean-start rule before doing release evidence gathering
  
- fail hard if no reachable SemVer tag exists and instruct the human/Codex to use the manual bootstrap `1.0.0` flow
  
- run `npm run check:all`
  
- revalidate repository cleanliness after `npm run check:all`, allowing only ignored generated artifacts
  
- include the check result in its output
  
- return the structured change information Codex needs to choose the next version
  
- fail hard if `npm run check:all` fails
  

### Releasability rule

- releasability depends **only** on whether `npm run check:all` succeeds
  
- `release:prepare` does **not** implement separate semantic release gating such as “no releasable changes detected”
  
- `release:prepare` is an evidence-gathering command, not the version-decision command
  

### Output contract

`release:prepare` emits **exactly one** machine-readable line at the end:

SUMMARY_JSON=<json>

It emits **no short human summary**.

### Top-level `SUMMARY_JSON` payload

It must include:

- `schema_version`
  
- `baseline_tag`
  
- `baseline_range`
  
- `check_all`
  
- `commit_count`
  
- `commits`
  
- `resolved_plan_refs`
  
- `semver_hints`
  
- `hint_basis`
  
- `groups`
  

### Commit list

- include the full structured commit list since the baseline tag
  
- each entry contains:
  
  - `id`
    
  - `subject`
    
- commit diffs are **not** included
  

### `resolved_plan_refs`

When commit subjects or bodies contain `PLANxx` references:

- search both:
  
  - `exec-plans/active/PLANxx.md`
    
  - `exec-plans/completed/PLANxx.md`
    
- do not prefer one directory over the other
  
- surface all matches that exist
  
- include matched plan ids and paths only, not full plan bodies
  

### Path-group classification

`release:prepare` must classify changed files using deterministic path rules:

- `runtime`
  
  - `plugin.js`
    
  - `plugin.css`
    
  - `assets/**`
    
  - `runtime/**`
    
  - `config/**`
    
  - `cluster/**`
    
  - `widgets/**`
    
  - `shared/**`
    
- `user_docs`
  
  - `README.md`
- `internal_docs`
  
  - `documentation/**`
    
  - `AGENTS.md`
    
  - `CLAUDE.md`
    
  - `CONTRIBUTING.md`
    
  - `ROADMAP.md`
    
  - `ARCHITECTURE.md`
    
  - `exec-plans/**`
    
- `engineering_meta`
  
  - `tools/**`
    
  - `tests/**`
    
  - `.github/**`
    
  - `.githooks/**`
    
  - `.agents/**`
    
  - `.codex/**`
    
  - `package.json`
    
  - `package-lock.json`
    
  - `skills-lock.json`
    
  - `perf/**`
    
  - `coverage/**`
    
  - `.gitignore`
    
  - `vitest.config.js`
    
- `release_artifacts`
  
  - `releases/**`

If any changed tracked path matches no declared group, `release:prepare` must fail hard instead of silently omitting that path from grouped evidence. For renamed files, `release:prepare` must classify both the old path and the new path; cross-group renames count as touching both groups, and either side being unclassified is a hard failure.

### Per-group evidence contract

For `runtime`:

- `changed`
  
- `file_count`
  
- `files` as `{path, change_type}`
  
- compact stats such as added, modified, deleted, and renamed counts
  
- touching commit ids
  
- **no diffs**
  

For `engineering_meta`:

- same structure as `runtime`
  
- **no diffs**
  

For `release_artifacts`:

- same structure as `runtime`
  
- **no diffs**
  

For `user_docs`:

- same structure as above
  
- include **raw unified diffs**
  

For `internal_docs`:

- same structure as above
  
- include **raw unified diffs**
  

### Raw doc diff limits

Raw diffs are allowed only for `user_docs` and `internal_docs`.

They must be bounded:

- at most **200 diff lines per file**
  
- at most **800 total doc diff lines**
  
- include truncation metadata per file and overall
  

### `semver_hints`

`semver_hints` are deterministic **path-based heuristics**, not semantic verdicts.

Required fields:

- `runtime_visible_behavior_changed`
  
- `user_visible_docs_changed`
  
- `packaging_or_release_mechanics_changed`
  
- `internal_only_change`
  

Derivation:

- `runtime_visible_behavior_changed`
  
  - `true` if the `runtime` group has any changed file
- `user_visible_docs_changed`
  
  - `true` if the `user_docs` group has any changed file
- `packaging_or_release_mechanics_changed`
  
  - `true` if any changed file is in this release or process subset:
    
    - `tools/release-*.mjs`
      
    - `package.json`
      
    - `package-lock.json`
      
    - `.github/workflows/**`
      
    - `documentation/guides/create-release.md`
      
    - `documentation/TABLEOFCONTENTS.md`
      
    - `CONTRIBUTING.md`
      
    - `releases/**`
      
- `internal_only_change`
  
  - `true` iff:
    
    - `runtime_visible_behavior_changed === false`
      
    - `user_visible_docs_changed === false`
      
    - `packaging_or_release_mechanics_changed === false`
      
    - and there is at least one changed file in `internal_docs` or non-release `engineering_meta`
      

`hint_basis` is a **top-level** `SUMMARY_JSON` object, not a nested member of `semver_hints`.

Rules:

- `semver_hints` contains booleans only
- `hint_basis` contains one entry per hint
- every `hint_basis` entry documents the deterministic path or group rule used to derive the corresponding hint
- release tooling and documentation must treat this as the stable machine-readable output shape

### Diff policy

`release:prepare` must **not** emit raw code diffs for runtime, engineering, or release files.

If commit messages, docs, and 
referenced plans are not enough, Codex may inspect specific commit diffs
 later using the commit ids from the prepare output.

---

## Runtime packaging contract

The shipped zip must contain **only files required to run the plugin on the host**, plus mandatory redistribution notices for bundled runtime assets.

### Required top-level structure

The zip must extract to:

- `dyninstruments/plugin.js`

Everything else must live under `dyninstruments/`.

### Required runtime inclusion sources

PLAN17 must derive the release file set from live code, not from a stale manual list.

Include:

1. `plugin.js`
  
2. `plugin.css`
  
3. every bootstrap script path that `plugin.js` loads through its authoritative ordered bootstrap list, as extracted by the release-tooling bootstrap extractor
  
4. the component closure actually needed at runtime from `config.widgetDefinitions`
  
5. always-loaded runtime-required components from shared config
  
6. any local `js`, `css`, `shadowCss`, and registry-owned `assets` reachable through that runtime component closure
  
7. mandatory redistribution notices for packaged bundled runtime assets, such as `assets/fonts/LICENSE.txt` when any bundled font asset is packaged
  
8. no repo-local runtime asset may be discovered by CSS ownership rules after Phase 1 migration
  

### Important runtime correction

Do **not** package all of `config.components` blindly.

Package the runtime-reachable closure the repository actually initializes.

### Packaging authorities

PLAN17 must reuse existing live-code authorities:

- `plugin.js` remains authoritative for ordered bootstrap script loading, and release tooling extracts that ordered list through a narrowly scoped extractor rather than through a second manifest
  
- all tooling that needs bootstrap order reuses that one extracted ordered list from `plugin.js`; `tools/components-registry-loader.mjs` must not keep a second manual script chain
  
- `tools/components-registry-loader.mjs` remains the authority for loading `config.components`
  
- a small sibling helper evaluates the extracted, config-relevant bootstrap subset in extracted order and returns:
  
  - `components`
    
  - `widgetDefinitions`
    
  - `runtimeRequiredComponents`
    
- the config-relevant subset is derived from the extracted `plugin.js` order and is limited to:
  
  - `runtime/namespace.js`
    
  - `config/components/registry-*.js`
    
  - `config/components.js`
    
  - `config/shared/*.js`
    
  - `config/clusters/*.js`
    
  - `config/widget-definitions.js`
    
- the config helper excludes non-config runtime, widget, shared, and cluster implementation modules
  
- the config helper fails hard if any required output is missing: `config.components`, `config.widgetDefinitions`, or `config.shared.runtimeRequiredComponents`
  
- one shared pure helper computes the ordered runtime component closure from `widgetDefinitions` plus `runtimeRequiredComponents`, and both runtime init and release packaging consume that same helper
  
- `runtime/component-closure.js` must load immediately before `runtime/component-loader.js` in `plugin.js`, so the loader can reuse the shared closure helper
  
- `config/shared/runtime-required-components.js` remains authoritative for always-loaded runtime-required components
  

### Packaging safety rules

Fail closed when:

- a required runtime file is missing
  
- the graph resolves outside the repository root
  
- a component references an unsupported external file shape
  
- the target zip path already exists
  
- `releases/{semver}/` exists with unexpected contents before release creation
  
- the repository state is not the expected clean or allowed-dirty state
  

Also:

- sort file paths before writing the zip for deterministic output order
  
- sort zip entries in stable order; byte-for-byte reproducibility across reruns is not required
  
- do not silently broaden the packaged file set
  

### Explicit non-runtime exclusions

The release zip must exclude repo or dev material including:

- `tests/`
  
- `documentation/`
  
- `exec-plans/`
  
- `tools/`
  
- `coverage/`
  
- `artifacts/`
  
- `perf/`
  
- `node_modules/`
  
- `.git*`
  
- `.codex/`
  
- `.agents/`
  
- `.githooks/`
  
- root developer docs such as `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `ROADMAP.md`, `ARCHITECTURE.md`
  

Mandatory redistribution notices for packaged bundled runtime assets are a narrow exception to the runtime-only rule. They are package-compliance files, not runtime assets and not registry-owned assets.

---

## Registry-owned runtime assets

### Runtime registry group

`config.components` assembly gains a fifth registry group:

- `runtime`

That group is declared in:

- `config/components/registry-runtime.js`

Rules:

- runtime registry components are first-class entries in `config.components`, not special-case side channels
  
- `config/components.js` merges groups in this order:
  
  - `sharedFoundation`
  - `sharedEngines`
  - `widgets`
  - `cluster`
  - `runtime`
- `FontAssets` lives in this group
  
- runtime-layer dependency checks remain enforced; runtime components must not become a backdoor for widget or cluster dependencies
  

### New component schema rule

Every component definition in `config.components` must include a mandatory keyed `assets` object.

Examples:

assets: {}

assets: {  
 regular: BASE + "assets/fonts/Roboto-Regular.woff2",  
 bold: BASE + "assets/fonts/Roboto-Bold.woff2"  
}

Rules:

- `assets` is mandatory on **every** component entry
  
- it is a **plain keyed object**, not an array, `Map`, class instance, or other container
  
- values must be repo-local URLs derived from the registry `BASE + "relative/path"` pattern
  
- tooling validates registry asset values by evaluating registries with a sentinel base and accepting only strings that start with that sentinel plus a normalized repo-relative suffix
  
- runtime validation accepts resolved asset URLs only when they are anchored under `ns.baseUrl`
  
- direct literal protocol URLs such as `http:`, `https:`, `//`, `data:`, and `blob:` are forbidden in registry assets
  
- absolute filesystem paths, traversal, malformed values, and anything not anchored to the plugin base are forbidden
  
- empty object is valid
  
- dependency checks must validate `assets` shape
  

### Runtime ownership rule

All runtime assets must be **registry-owned**.

That means:

- runtime assets must be declared in component `assets`
  
- ad-hoc repo-local asset ownership through CSS `url(...)` is forbidden
  
- ad-hoc repo-local asset loading from arbitrary JS paths is forbidden
  
- runtime asset access must go through the registry, loader, and runtime helper boundary
  

Static checks must enforce the JavaScript side of this ownership rule. Shipped runtime JavaScript under `plugin.js`, `runtime/**`, `shared/**`, `widgets/**`, `cluster/**`, and `config/**` must fail if it contains string-literal repo asset paths such as `"assets/..."`, `'assets/...'`, template-literal `assets/...`, or `BASE + "assets/..."`. Asset path ownership is allowed only in component registry fragments under `config/components/**`; tests, docs, and tools may mention asset paths. Non-registry shipped config files such as `config/shared/**`, `config/clusters/**`, and `config/widget-definitions.js` must not become hidden asset-ownership paths.

### Asset exposure rule

The loader and runtime do **not** eagerly fetch or preload arbitrary binary assets.

Instead:

- the loader resolves and validates asset URLs
  
- the runtime exposes resolved asset URLs to components
  
- components fetch or consume those asset URLs lazily when needed
  

This supports fonts, audio, and future non-code assets cleanly.

### Loaded component record contract

`loadComponent(id)` returns a normalized loaded-component record:

```js
{ id, def: componentDef, module: validatedModule }
```

Rules:

- `id` is the registry component id requested from the loader
- `def` is the validated component registry entry
- `module` is the raw loaded export validated against `apiShape`
- `runtime/init.js` indexes loaded components by registry id, not by `module.id`
- `Helpers.getModule(id)` continues to return the raw module/export object for component callers
- `apiShape: "factory"` requires `module.create(...)`
- `apiShape: "module"` requires an object module and does not require `module.id`
- `runtime/component-loader.js` may keep `uniqueComponents(...)` as a thin wrapper around the shared runtime-closure helper

### Component access to assets

PLAN17 adds a runtime helper boundary for component asset access based on the registry-owned manifest.

Asset access must run through `Helpers`, not through direct registry or global access.

Component asset access is component-scoped by default.

`runtime.createHelpers(...)` must be wired to the loader-owned resolved-asset API. The loader is created first, and helper construction receives the resolver explicitly, for example:

```js
const loader = runtime.createComponentLoader(components);
const Helpers = runtime.createHelpers(createGetComponent(components), {
  getResolvedAssets: loader.getResolvedAssets,
  getResolvedShadowCss: loader.getResolvedShadowCss
});
```

`runtime.createHelpers(...)` must expose:

- base shared helper functions
  
- `Helpers.forComponent(componentId)`
  
- `Helpers.getAssetUrl(assetKey)` from a bound helper view
  
- optionally `Helpers.getAssetUrls()` from a bound helper view
  

Rules:

- top-level widget registration binds helpers with `Helpers.forComponent(widgetDef.widget)` before the widget `create(...)` call
  
- `runtime/widget-registrar.js` receives already-bound helpers or `runtime/init.js` binds before calling the registrar; the registrar must not guess asset scope
  
- `Helpers.getModule(id)` remains a pure module lookup and does **not** implicitly switch asset scope
  
- shared child components that need their own declared assets must be invoked with `Helpers.forComponent("ChildComponentId")`
  
- `ClusterWidget` binds helpers for `ClusterMapperToolkit`, `ClusterRendererRouter`, and `ClusterMapperRegistry`
  
- `ClusterMapperRegistry` binds helpers with `Helpers.forComponent(mapperId)` before creating each mapper child
  
- `ClusterRendererRouter` binds helpers with `Helpers.forComponent(rendererId)` before creating direct renderer specs
  
- `RendererPropsWidget` itself is created with `Helpers.forComponent("RendererPropsWidget")`
  
- `RendererPropsWidget` creates delegated target renderers with `Helpers.forComponent(targetRendererId)` and must not inherit the target renderer's asset scope for its own wrapper logic
  
- helper resolution delegates to the loader-owned resolved-asset API
  
- helper methods return only previously validated and resolved URLs
  
- unbound `Helpers.getAssetUrl(...)` must fail clearly instead of guessing a component scope
  
- components must **not** directly inspect `ns.config.components` for runtime asset paths
  
- components must **not** construct `BASE + ...` asset paths themselves
  
- components must **not** introduce ad-hoc repo path construction for runtime assets
  
- any cross-component asset lookup must be a separate explicit runtime-only API rather than the default component contract
  
- runtime-only module calls that need resolved assets outside the helper flow use `loader.getResolvedAssets(componentId)`
  
- release packaging uses the same registry and resolver source, but not the component helper call path itself
  

### Resolved runtime file access beyond assets

`shadowCss` remains a distinct runtime file type, not a component asset. Runtime code must not read `ns.config.components` directly to discover `shadowCss` paths.

Add:

- `loader.getResolvedShadowCss(componentId)`

Expose a narrow helper-facing boundary:

- `Helpers.getShadowCssUrls(componentId)`

Rules:

- `ClusterRendererRouter` receives shadow CSS URLs through `Helpers.getShadowCssUrls(rendererId)`, not by inspecting `ns.config.components`
  
- `runtime/init.js` preloads shadow CSS through loader-resolved URLs, not direct registry scanning
  
- `Helpers.getAssetUrl(...)` remains scoped only to component `assets` and must not be overloaded with CSS lookup
  
- release packaging uses the same resolved runtime-file rules for reachable `shadowCss` files
  

### CSS asset rule

Repo-local asset ownership through runtime CSS is forbidden after Phase 1 migration.

For CSS processing:

- `data:` URLs are allowed for ordinary CSS `url(...)` values
  
- external or protocol URLs (`http:`, `https:`, `//`, etc.) in shipped runtime CSS fail hard
  
- repo-local `url(...)` values in shipped runtime CSS fail hard
  
- all `@import` rules in shipped runtime CSS fail hard, including string imports and `@import url(...)`
  
- lint and tests must reject non-`data:` repo-local `url(...)` and all `@import` rules in all shipped runtime CSS, including `plugin.css`, component `css`, and reachable `shadowCss`
  

### Phase 1 migration requirement

Because `plugin.css` currently owns bundled fonts via `url(...)`, PLAN17 Phase 1 must migrate those fonts to the registry-owned asset model.

That phase must:

- introduce the mandatory `assets` field on every component definition
  
- introduce a registry-owned always-loaded font component
  
- move bundled font file ownership out of `plugin.css`
  
- inject `@font-face` rules from runtime-owned code at startup
  
- add lint and tests that forbid future repo-local runtime asset ownership through CSS `url(...)`
  

This asset-system migration is **Phase 1** of PLAN17.

### Explicit font-installation contract

The font-installation path must use an explicit runtime call rather than an implicit component side effect.

That means:

- the font component is part of `runtimeRequiredComponents`
  
- the font component lives in the `runtime` registry group and uses `apiShape: "module"`
  
- `runtime/FontAssets.js` is loaded through the component loader and therefore exports through `DyniComponents`, not as a bare `DyniPlugin.runtime` side effect
  
- its component global key is `DyniFontAssets`
  
- `runtime/init.js` loads it through the normal runtime-required component path
  
- the runtime then calls `loader.getResolvedAssets("FontAssets")`
  
- the runtime passes that validated resolved asset map into a clearly named module API, such as `installFonts(assetMap)`
  
- runtime init calls the API from the normalized loaded-component record, for example `byId.FontAssets.module.installFonts(loader.getResolvedAssets("FontAssets"))`
  
- font-face descriptors such as family, weight, and style live inside `runtime/FontAssets.js`, not in the generic `assets` schema
  
- that API injects the `@font-face` rules and is idempotent
  

Font descriptor consistency is part of the `FontAssets` contract:

- `runtime/FontAssets.js` owns a fixed internal descriptor list with asset keys, family, weight, and style
  
- `installFonts(assetMap)` must fail clearly if any descriptor asset key is missing from `assetMap`
  
- the initial `FontAssets` registry entry must not declare extra font assets that are unused by descriptors
  
- a dedicated test must load the real `FontAssets` registry entry and assert that all font descriptors resolve to declared assets and all declared initial font assets are consumed by descriptors
  
- the plan must **not** rely on a bare “load this component for side effects” contract
  

---

## `release:create` contract

`release:create` receives the already-decided version.

It must:

1. verify the repository is in the exact expected state
  
2. capture the starting `HEAD` SHA before any mutation and print it as the manual recovery base
  
3. verify that the local target tag `vX.Y.Z` does **not** already exist
  
4. run `npm run check:all` immediately before any mutation and fail hard if it does not pass
  
5. revalidate the repository state after `npm run check:all`, before any mutation
  
6. validate the version bump rule or manual-bootstrap rule
  
7. validate pre-mutation version metadata has not drifted
  
8. validate release note path and naming
  
9. validate release note format and required content
  
10. update `package.json` and `package-lock.json`
  
11. create the canonical zip
  
12. revalidate the exact generated file set before staging
  
13. stage only the exact expected release files
  
14. create a git commit with the exact message:
  
  - `Created new Release with version X.Y.Z`
15. verify the worktree is clean under the ignored-artifact rule
  
16. create the local lightweight tag:
  
  - `git tag vX.Y.Z`
17. print a success message suitable for Codex and the human reviewer
  

### Repository-state validation

Before `release:create` mutates anything, it must fail hard unless the repository contains only:

- no modified tracked files
  
- no staged changes
  
- no non-ignored untracked files except the single expected release note file for the chosen version
  
- the single expected release note file is present as an **unstaged** working-tree file
  
- ignored generated artifacts may remain
  

Additionally:

- `release:create` creates the tag as a lightweight local tag with `git tag vX.Y.Z`
  
- the local target tag `vX.Y.Z` must **not** already exist
  
- `releases/{semver}/` may already exist only because the canonical release note already exists there
  
- `releases/{semver}/dyninstruments-{semver}.zip` must **not** already exist
  
- no other files may already exist in `releases/{semver}/`
  

If there are any other tracked 
changes, staged changes, non-ignored untracked files, or a pre-existing local target tag, fail hard and 
print what is wrong and how to fix it.

After `npm run check:all` completes, `release:create` must re-run the same repository-state validation before it mutates version files or creates the zip. If checks created a non-ignored untracked file, modified a tracked file, staged anything, or changed the release folder beyond the single expected release note, fail hard and print the starting `HEAD` SHA for manual recovery.

### Version metadata drift validation

Before `release:create` mutates version files, it must verify committed version metadata is still at the expected baseline:

- when at least one reachable SemVer tag exists, `package.json` and `package-lock.json` must currently mirror the highest reachable baseline tag version before being updated to the chosen target version
- during no-tag bootstrap, `package.json` and `package-lock.json` must currently be `0.0.0-test` before `release:create -- --version 1.0.0`
- if either file is missing the expected version field or carries a different version, fail hard instead of silently normalizing it
- the failure message must explain that the release session must start from committed metadata matching the release baseline

### Exact release commit staging

After updating version files and writing the zip, but before staging, `release:create` must verify that the only tracked changes or non-ignored untracked files are exactly:

- `package.json`
- `package-lock.json`
- `releases/{semver}/dyninstruments-{semver}.md`
- `releases/{semver}/dyninstruments-{semver}.zip`

`release:create` must stage only those exact paths. It must not use broad staging commands such as `git add -A` or `git add .`.

After creating the release commit and before creating the tag, `release:create` must verify the worktree is clean under the same ignored-artifact rule. If any unexpected file appears at any point, fail hard and print the starting `HEAD` SHA for manual recovery.

### Failure handling

There is **no** transactional rollback and no `release:rollback` command.

`release:create` must capture the starting `HEAD` SHA before any mutation, print it at startup as the recovery base, and print it again on any failure path.

If anything goes wrong during or after `release:create`, manual recovery is the supported path:

- reset the repo to the last pre-release commit with:
  
  - `git reset --hard <pre-release-commit>`
- if a local tag was already created, delete it with:
  
  - `git tag -d vX.Y.Z`
- if untracked release artifacts for that version were created locally, remove them explicitly, for example:
  
  - `git clean -fd releases/{semver}`

This manual recovery path is documented in the release guide and `CONTRIBUTING.md`.

If the only leftover state is a pre-existing local target tag, deleting that tag is the required recovery step before retrying `release:create`.

### Release-note validation

The canonical release note path is:

- `releases/{semver}/dyninstruments-{semver}.md`

Required top-level structure:

```md
# dyninstruments vX.Y.Z — YYYY-MM-DD

## Summary for users

## What you gain in this release

## Added

## Improved

## Fixed

## Important changes or migration notes

## For developers and integrators
```

All sections are mandatory and must be non-empty.

If a section has nothing substantive, it must contain explicit filler text such as:

- `None.`
  
- `No migration steps required.`
  
- `No developer or integrator-specific changes in this release.`
  

Empty headings or placeholder stubs are invalid.

The zip path is:

- `releases/{semver}/dyninstruments-{semver}.zip`

The note and zip must always be in the same versioned folder.

Release notes under `releases/**` are canonical release artifacts, not documentation-tree pages. They are validated by release-note validation only and must not be required to pass `check-doc-reachability` or general documentation navigation checks. Root docs and the README may link to the `releases/` folder conceptually, but historical release notes do not need individual table-of-contents entries.

### Zip implementation

`release:create` may add and use a small Node zip-writing dependency.

Do **not** depend on the host system `zip` binary.

The implementation must stay cross-platform.

---

## GitHub Releases workflow

GitHub publishing is secondary to the local release flow.

### Trigger

- trigger on pushed tags matching `v*.*.*`
- validate the pushed tag name again inside the workflow with an exact SemVer tag regex: `^v[0-9]+\.[0-9]+\.[0-9]+$`

### Permissions

The workflow must declare:

```yaml
permissions:
  contents: write
```

### Workflow behavior

The GitHub workflow must:

1. check out the tagged source explicitly with `actions/checkout@v4`, `ref: ${{ github.ref_name }}`, and `fetch-depth: 0`
  
2. verify `GITHUB_REF_TYPE` is `tag`
  
3. validate `GITHUB_REF_NAME` with `^v[0-9]+\.[0-9]+\.[0-9]+$`
  
4. derive `X.Y.Z` from the pushed tag `vX.Y.Z`
  
5. resolve the tagged commit with `git rev-list -n 1 "$GITHUB_REF_NAME"`
  
6. verify the resolved tagged commit equals `GITHUB_SHA`
  
7. verify the tagged tree contains:
  
  - `releases/{semver}/dyninstruments-{semver}.zip`
    
  - `releases/{semver}/dyninstruments-{semver}.md`
    
8. verify the release note heading version matches `X.Y.Z`
  
9. verify the resolved tagged commit is the release commit with the exact message:
  
  - `Created new Release with version X.Y.Z`
10. verify that no GitHub Release already exists for `vX.Y.Z`; if one already exists, fail hard and require manual resolution
  
11. publish the committed zip
  
12. use the committed Markdown release note as the GitHub Release body
  

The workflow publishes through `actions/github-script` or direct GitHub REST API calls using the committed Markdown file as the release body and the committed zip as the release asset.

The GitHub workflow must **not**:

- install project dependencies
  
- run `npm install`
  
- install dependencies solely to rebuild the release zip
  
- rebuild the zip
  
- compare a CI-built zip against the committed zip
  

This keeps:

- the repository artifact as canonical release content
  
- the GitHub Release as a thin publishing adapter over the committed artifacts
  
- GitHub CI as small as possible
  

---

## Documentation changes required by PLAN17

### README rewrite

`README.md` becomes **strictly user-facing**.

Keep or improve user-facing sections such as:

- what dyninstruments is
  
- installation from the release zip
  
- how to verify the plugin folder layout after unzip
  
- quickstart for adding widgets in AvNav
  
- current cluster overview
  
- customization basics
  
- troubleshooting basics
  
- where to find release notes and downloads
  

Update:

- remove pre-release warnings
  
- state the stable compatibility baseline as a dyninstruments SemVer promise from `v1.0.0` onward, not as an unsupported AvNav version-floor claim
  
- say that dyninstruments `v1.0.0` is the first stable compatibility baseline and that future releases follow SemVer for widget names, documented editor options, release artifact layout, and runtime plugin behavior
  
- state the actual host requirement verified by the runtime: an AvNav server environment that provides `avnav.api` and `AVNAV_BASE_URL`; pure Android app plugin loading remains unsupported
  
- mention GitHub Releases as the canonical public download source
  
- mention the repository `releases/` folder as the canonical in-repo artifact location
  

Remove or relocate developer-focused material such as:

- architecture walkthroughs beyond a short link
  
- quality-gate command details
  
- lint suppression syntax
  
- performance-gate internals
  
- contributor workflow and AI-process instructions
  
- release-building instructions
  

### Dedicated release guide

Add:

- `documentation/guides/create-release.md`

This becomes the canonical AI or human release procedure document linked from `documentation/TABLEOFCONTENTS.md`.

It must describe:

- clean-start requirement
  
- AGENTS-first routing
  
- mandatory preflight
  
- how to run `npm run release:prepare`
  
- that `release:prepare` emits only `SUMMARY_JSON=...`
  
- how Codex decides the version from the output
  
- when to inspect referenced plan docs
  
- when commit messages are insufficient
  
- how to run `npm run release:create -- --version X.Y.Z`
  
- manual bootstrap for `1.0.0`, including the required manual `npm run check:all` step before `release:create`
  
- manual failure recovery using `git reset --hard`, local tag deletion, and explicit removal of untracked release artifacts if needed
  
- human review and push step
  
- tag-driven GitHub publish flow
  

### AI doc routing and sync

- `AGENTS.md` is canonical for the shared AI instruction block
  
- `CLAUDE.md` is synced from `AGENTS.md`
  
- PLAN17 must explicitly use:
  
  - `npm run ai:sync:agents`
    
  - `npm run ai:check`
    

### CONTRIBUTING

Update `CONTRIBUTING.md` to document:

- the stable release workflow at a high level
  
- manual recovery after failed `release:create`, including cleanup of untracked release artifacts
  
- human review responsibility before push
  

### Table of contents

Update `documentation/TABLEOFCONTENTS.md` to link the release guide.

---

## Implementation

PLAN17 should be implemented in **six normal development phases**, followed by a separate clean manual bootstrap release step for `1.0.0`.

Each development phase must be committed normally before the bootstrap release session begins. The bootstrap release step must start from a clean committed repository and must not be mixed with ordinary code, test, or documentation edits.

### Phase 1 — registry-owned runtime assets and font migration

Create:

- `config/components/registry-runtime.js`
- `config/shared/runtime-required-components.js`
- `runtime/FontAssets.js`

Modify:

- `plugin.js`
- `plugin.css`
- `config/components.js`
- all `config/components/registry-*.js` fragments
- `runtime/init.js`
- component-schema and dependency-check fixtures as needed

Work:

- add the runtime registry group and merge it after `cluster`
- add `config/components/registry-runtime.js` and `config/shared/runtime-required-components.js` to the authoritative `plugin.js` `internalScripts` array
- keep the `internalScripts` declaration extractor-compatible: one `const internalScripts = [...]` in the outer bootstrap IIFE body, with only static string-literal relative paths
- define `ns.config.shared.runtimeRequiredComponents = ["ThemeModel", "ThemeResolver", "FontAssets"]`
- add mandatory keyed `assets: {}` to every component definition
- register `FontAssets` in the runtime registry group with `apiShape: "module"`, `globalKey: "DyniFontAssets"`, and the bundled font file URLs in `assets`
- make `runtime/FontAssets.js` export through `DyniComponents.DyniFontAssets`
- keep font descriptors inside `runtime/FontAssets.js`
- expose an idempotent `installFonts(assetMap)` API
- make `installFonts(assetMap)` fail clearly if its descriptors and registry assets drift apart
- remove bundled `@font-face` ownership from `plugin.css`
- move the bundled Roboto and Roboto Mono font file references into `FontAssets.assets`
- call the font installer explicitly from runtime init after resolving `FontAssets` through the loader
- add the CSS ownership checks that reject repo-local `url(...)`, external/protocol URLs, and all `@import` rules in shipped runtime CSS

Validation for this phase:

- every component definition contains mandatory keyed `assets`
- invalid `assets` shapes fail checks
- `FontAssets` exists in the runtime registry group
- all `FontAssets` descriptors resolve to declared assets, and all initial declared font assets are consumed by descriptors
- `plugin.css` no longer owns bundled fonts through repo-local `url(...)`
- runtime CSS with repo-local `url(...)`, external/protocol URLs, or `@import` fails
- `data:` URLs remain allowed for ordinary CSS `url(...)`
- font installation is explicit and idempotent
- runtime registry component files satisfy the component export contract through `check-umd`, `check-naming`, or a dedicated equivalent test

---

### Phase 2 — loader records, resolved-file boundaries, and helper scoping

Modify:

- `runtime/component-loader.js`
- `runtime/helpers.js`
- `runtime/init.js`
- `runtime/widget-registrar.js` if needed to preserve the registrar contract
- `widgets/ClusterWidget.js`
- `cluster/ClusterRendererRouter.js`
- `cluster/mappers/ClusterMapperRegistry.js`
- `widgets/RendererPropsWidget.js`
- `tools/check-dependencies.mjs`
- shipped-source lint/check helpers
- runtime, helper, cluster, mapper, renderer, and widget tests

Work:

- validate component `js`, `css`, `shadowCss`, and `assets` through the same base-anchored local-file resolver
- validate registry asset values in tooling by evaluating registries with a sentinel base
- validate resolved runtime asset URLs only when anchored under `ns.baseUrl`
- reject direct literal protocols, absolute filesystem paths, traversal, malformed values, and anything not anchored to the plugin base
- make `loadComponent(id)` return `{ id, def, module }`
- keep `Helpers.getModule(id)` returning the raw module/export object
- validate `apiShape: "factory"` modules by requiring `create(...)`
- validate `apiShape: "module"` modules as object exports that do not need their own `id`
- index loaded components in `runtime/init.js` by registry id, not by `module.id`
- add `loader.getResolvedAssets(componentId)`
- add `loader.getResolvedShadowCss(componentId)`
- make `FontAssets` installation use the normalized record, for example `byId.FontAssets.module.installFonts(loader.getResolvedAssets("FontAssets"))`
- create the component loader before creating `Helpers`
- pass loader-owned `getResolvedAssets` and `getResolvedShadowCss` resolvers explicitly into `runtime.createHelpers(...)`
- implement `Helpers.forComponent(componentId)` as a bound helper view
- expose bound `Helpers.getAssetUrl(assetKey)` and optionally bound `Helpers.getAssetUrls()`
- make unbound asset lookup fail clearly
- expose `Helpers.getShadowCssUrls(componentId)` for validated `shadowCss` access
- bind top-level widget helpers with `Helpers.forComponent(widgetDef.widget)` before widget creation
- keep `runtime/widget-registrar.js` from guessing asset scope
- rebind helpers for `ClusterWidget` child helpers, mapper children, direct renderer specs, `RendererPropsWidget`, and delegated renderers
- update `ClusterRendererRouter` and `runtime/init.js` to resolve `shadowCss` through the loader/helper boundary instead of direct `ns.config.components` inspection
- add shipped-JS asset-path checks for `plugin.js`, `runtime/**`, `shared/**`, `widgets/**`, `cluster/**`, and `config/**`
- allow hardcoded asset paths only in component registry fragments under `config/components/**`, tests, docs, and tools

Validation for this phase:

- valid base-anchored registry asset URLs pass
- invalid registry asset URLs fail
- `loader.getResolvedAssets(componentId)` returns only validated resolved URLs
- `loader.getResolvedShadowCss(componentId)` returns only validated resolved `shadowCss` URLs
- shipped runtime JavaScript with hardcoded repo asset paths fails outside allowed registry/test/tool/doc locations
- top-level widget registration binds helpers before widget creation
- `Helpers.getModule(id)` does not implicitly switch asset scope
- unbound helper asset lookup fails clearly
- child renderers, mapper children, wrapper widgets, and delegated renderers receive the correct component-scoped helpers
- `ClusterRendererRouter` and `runtime/init.js` do not inspect `ns.config.components` directly for `shadowCss`

---

### Phase 3 — bootstrap extraction, shared runtime closure, and runtime packaging

Create:

- `tools/bootstrap-script-order.mjs`
- `tools/bootstrap-config-loader.mjs`
- `runtime/component-closure.js`
- `tools/release-packager.mjs`

Modify:

- `plugin.js`
- `runtime/component-loader.js`
- `runtime/init.js`
- `tools/components-registry-loader.mjs`
- `package.json`
- `package-lock.json`
- bootstrap, config-loader, closure, and packager tests

Work:

- implement the constrained extractor for exactly one `const internalScripts = [...]` declaration in the outer bootstrap IIFE body
- fail hard on missing, duplicated, outside-IIFE, non-literal, absolute, protocol-based, empty, duplicated, traversal, computed, spread, or helper-built bootstrap entries
- make every tooling path that needs bootstrap order reuse the extracted ordered list
- remove the manual `REGISTRY_SCRIPT_CHAIN` pattern from `tools/components-registry-loader.mjs`
- add `runtime/component-closure.js` immediately before `runtime/component-loader.js` in the authoritative bootstrap array
- keep `runtime/component-closure.js` pure and usable from tooling through VM evaluation or a compatible UMD-style export pattern
- implement `tools/bootstrap-config-loader.mjs` by evaluating only the extracted config-relevant subset in extracted order
- fail hard if `config.components`, `config.widgetDefinitions`, or `config.shared.runtimeRequiredComponents` is missing
- move the runtime dependency-closure walk into the shared pure helper
- make runtime init and release packaging consume the same ordered closure from `widgetDefinitions` plus `runtimeRequiredComponents`
- derive the runtime-only release file set from live authorities only
- include `plugin.js`, `plugin.css`, extracted bootstrap scripts, reachable component `js`, `css`, `shadowCss`, and reachable registry-owned `assets`
- include mandatory redistribution notices such as `assets/fonts/LICENSE.txt` whenever bundled fonts are packaged
- write the plugin-loader-compliant zip rooted at `dyninstruments/`
- sort file paths and zip entries deterministically
- fail hard on missing runtime files, unsupported file shapes, out-of-root resolution, unexpected release-directory contents, or an already existing target zip path
- exclude tests, docs, tools, coverage, artifacts, perf, node modules, Git metadata, AI/process folders, and root developer docs
- do not depend on the host `zip` binary

Validation for this phase:

- bootstrap order is extracted from `plugin.js` through the constrained extractor
- all tooling that needs bootstrap order reuses that extracted list
- the config subset is derived from extracted order and has no second manual script chain
- runtime init and release packaging consume the same shared runtime-closure helper
- the shared runtime-required component list is consumed by runtime init and release packaging
- the exported zip root is `dyninstruments/`
- package inclusion follows live runtime reachability, not all of `config.components`
- bundled font assets cause `assets/fonts/LICENSE.txt` to be included
- dev files are excluded
- missing runtime files fail closed

---

### Phase 4 — release evidence and release creation tooling

Create:

- `tools/release-prepare.mjs`
- `tools/release-create.mjs`

Modify:

- `package.json`
- `package-lock.json`
- release-tooling tests under `tests/tools/` or equivalent

Work:

- add `npm run release:prepare` and `npm run release:create`
- make `release:prepare` enforce the clean git-based starting state
- make `release:prepare` fail hard when no reachable SemVer tag exists and instruct the manual bootstrap `1.0.0` flow
- make `release:prepare` run `npm run check:all` without streaming full ordinary check output as release evidence
- make `release:prepare` revalidate clean state after `check:all`, allowing only ignored generated artifacts
- make `release:prepare` emit exactly one final `SUMMARY_JSON=...` line
- keep `semver_hints` as booleans only and put `hint_basis` at the top level of `SUMMARY_JSON`
- classify changed files into the declared path groups and fail hard on any unclassified changed tracked path
- classify both old and new paths for renamed files
- include raw bounded diffs only for `user_docs` and `internal_docs`
- resolve `PLANxx` references against both `exec-plans/active/` and `exec-plans/completed/`
- make `release:create` validate the exact allowed pre-release dirty state
- capture and print the starting `HEAD` SHA before any mutation and on all failure paths
- make `release:create` verify the local target tag does not already exist
- make `release:create` run `npm run check:all`, then revalidate the allowed state before mutation
- validate bootstrap/no-bootstrap version rules, release metadata drift, release note path, release note structure, canonical zip path, and release directory contents
- update version fields only inside `release:create`
- create the canonical zip
- revalidate the exact generated file set before staging
- stage only `package.json`, `package-lock.json`, the canonical release note, and the canonical zip
- create the release commit with exact message `Created new Release with version X.Y.Z`
- verify the worktree is clean before creating the tag
- create the local tag as a lightweight tag with `git tag vX.Y.Z`
- document and test manual recovery instead of adding rollback automation

Validation for this phase:

- latest reachable highest SemVer tag detection works
  
- no-tag `release:prepare` hard-fails with a manual-bootstrap message
  
- manual-bootstrap `release:create -- --version 1.0.0` is allowed and any other no-tag version is rejected
  
- valid SemVer increments are enforced after a baseline tag exists
  
- version metadata drift is rejected before mutation
  
- dirty-state validation rejects staged changes, tracked modifications, and non-ignored untracked files except the expected release note
  
- ignored generated artifacts are allowed
  
- post-`check:all` git-state revalidation works in both release commands
  
- release note format validation
  
- `releases/**` Markdown files are validated as release artifacts rather than documentation-tree pages works
  
- `release:create` reruns `npm run check:all` before mutation
  
- exact-path staging and post-commit clean-worktree validation work
  
- exact-path staging before the release commit
  
- post-release-commit clean-worktree validation before tag creation
  
- release commit and lightweight local tag creation are tested
  
- the starting `HEAD` SHA is printed for manual recovery
  

---

### Phase 5 — user docs, contributor docs, AI sync, and GitHub publish flow

Create:

- `documentation/guides/create-release.md`
- a tag-driven GitHub Releases workflow under `.github/workflows/`

Modify:

- `README.md`
- `documentation/TABLEOFCONTENTS.md`
- `CONTRIBUTING.md`
- `AGENTS.md`
- `CLAUDE.md`
- doc reachability fixtures that need updates

Work:

- rewrite `README.md` to be fully user focused
- remove pre-release messaging
- document the stable compatibility baseline as dyninstruments `v1.0.0` and future SemVer behavior
- document the actual host requirement: AvNav server environment with `avnav.api` and `AVNAV_BASE_URL`; pure Android app plugin loading remains unsupported
- document GitHub Releases as the canonical public download source and `releases/` as the canonical in-repo artifact location
- keep `releases/**` Markdown files out of documentation-tree reachability requirements
- move release mechanics into `documentation/guides/create-release.md`
- document clean start, AGENTS-first routing, preflight, prepare/create commands, manual bootstrap, manual recovery, human review before push, and tag-driven GitHub publishing
- update `CONTRIBUTING.md` with the stable release workflow and manual recovery summary
- link the release guide from `documentation/TABLEOFCONTENTS.md`
- keep `AGENTS.md` canonical, sync `CLAUDE.md`, and validate with `npm run ai:sync:agents` and `npm run ai:check`
- create the GitHub workflow as a thin publisher over committed artifacts
- use explicit full tag checkout with `actions/checkout@v4`, `ref: ${{ github.ref_name }}`, and `fetch-depth: 0`
- validate `GITHUB_REF_TYPE`, exact SemVer tag shape, resolved tagged commit, artifact paths, release note heading version, exact release commit message, and duplicate-release absence
- publish through `actions/github-script` or direct GitHub REST API calls using the committed Markdown release note body and committed zip asset
- do not install project dependencies, run `npm install`, rebuild the zip, or compare against a CI-built zip

Validation for this phase:

- README is user-facing and no longer carries release-building or AI-process instructions
- release guide is linked from the table of contents
- `CONTRIBUTING.md` summarizes stable release flow and manual recovery
- `AGENTS.md` remains canonical and `CLAUDE.md` is synced
- GitHub workflow validates tag, resolved commit, artifacts, note version, exact release commit message, and duplicate-release absence
- GitHub workflow publishes only committed artifacts

---

### Phase 6 — final validation hardening

Modify and add tests for at least:

- runtime asset-schema validation, resolved asset validation, and CSS ownership guards
- shipped-JS asset-path ownership guards, including non-registry shipped config files
- helper binding, explicit child rebinding, and `loader.getResolvedAssets(componentId)`
- validated `shadowCss` resolution through the loader/runtime boundary
- extracted bootstrap-order reuse across tooling
- shared runtime-closure helper reuse between runtime init and release packaging
- package inclusion of mandatory font license notice when bundled fonts are shipped
- `release:prepare` grouping, rename classification, no-tag failure, post-check git-state validation, and unclassified-path hard failure
- `release:create` dirty-state validation, version-metadata drift validation, exact-path staging, post-check git-state validation, note validation, `check:all` rerun, release commit creation, and lightweight local tag creation
- GitHub publish validation for artifact paths, exact release note version, exact commit message, resolved tagged commit, exact SemVer tag shape, and duplicate-release rejection

Before committing Phase 6:

- run `npm run ai:sync:agents`
- run `npm run ai:check`
- run `npm run check:all`

Commit Phase 6 normally. The repository must be clean after this commit before the bootstrap release step begins.

## Bootstrap stable release step

PLAN17 ends with a dedicated manual bootstrap step for **`1.0.0`**.

This step begins only after Phases 1–6 have been implemented, validated, and committed. It must start from a clean committed repository. It must not include ordinary development edits.

The bootstrap step must:

- do **not** run `release:prepare`
  
- run:
  
  - `npm run check:all`
- create only:
  
  - `releases/1.0.0/dyninstruments-1.0.0.md`
- run:
  
  - `npm run release:create -- --version 1.0.0`

`release:create` then:

- updates `package.json` and `package-lock.json` to `1.0.0`
  
- creates `releases/1.0.0/dyninstruments-1.0.0.zip`
  
- creates the release commit
  
- creates the lightweight local tag `v1.0.0`
  

After that, future release sessions are baseline-driven from tags and docs.

---

## Validation and test strategy

PLAN17 is not complete until these pass:

- `npm run check:all`
  
- new tests for `release:prepare`
  
- new tests for `release:create`
  
- doc reachability updates for the new release guide, while keeping `releases/**` Markdown out of documentation-tree reachability requirements
  
- `npm run ai:sync:agents`
  
- `npm run ai:check`
  

### Export, release, and asset-system tests

Add tests that verify at least:

- the exported zip root is `dyninstruments/`
  
- `plugin.js` and required runtime files are included
  
- tests, docs, tools, and dev files are excluded
  
- bundled font assets cause `assets/fonts/LICENSE.txt` to be included as a mandatory redistribution notice
  
- the runtime graph is derived from live runtime reachability
  
- missing runtime files fail closed
  
- latest reachable highest SemVer tag detection
  
- no-tag `release:prepare` hard failure with manual-bootstrap message
  
- manual-bootstrap `release:create -- --version 1.0.0` allowance and rejection of any other no-tag version
  
- prepare output grouping for `runtime`, `user_docs`, `internal_docs`, `engineering_meta`, and `release_artifacts`
  
- unclassified changed tracked paths hard-fail `release:prepare`
  
- renamed files classify both old and new paths, with cross-group renames touching both groups
  
- `PLANxx` resolution against both active and completed plan directories
  
- release note format validation
  
- valid SemVer increment validation
  
- pre-mutation version metadata drift validation
  
- git-based dirty-state rejection with ignored generated artifacts allowed
  
- post-`check:all` git-state revalidation in both release commands
  
- release commit and lightweight local tag creation
  
- `release:create` reruns `npm run check:all` before mutation
  
- `release:create` prints the starting `HEAD` SHA for manual recovery
  
- GitHub publish validation for exact SemVer tag shape, full tag checkout, resolved tagged commit, artifact paths, release note version, exact release-commit message, and hard failure when a GitHub Release already exists
  
- the bootstrap script order is extracted from `plugin.js` by release tooling through the constrained extractor contract
  
- all tooling that needs bootstrap order reuses that extracted list rather than maintaining a second manual script chain
  
- the shared runtime-required component list is consumed by both runtime init and release packaging
  
- the shared pure runtime-closure helper is consumed by both runtime init and release packaging
  
- the `runtime` registry group exists and `FontAssets` is declared there
  
- every component definition contains mandatory keyed `assets`
  
- invalid `assets` shapes fail checks
  
- direct literal external or protocol asset URLs fail checks, while valid base-anchored registry asset URLs pass
  
- shipped runtime JavaScript with hardcoded repo asset paths fails checks outside component registry fragments, including non-registry shipped config files
  
- `loader.getResolvedAssets(componentId)` returns only validated resolved assets
  
- top-level widget registration binds `Helpers.forComponent(widgetDef.widget)` before widget creation
  
- `Helpers.getModule(id)` does not implicitly switch asset scope
  
- cluster/router/delegated child components rebind helpers before instantiating asset-owning children
  
- `shadowCss` is resolved through the validated loader/runtime boundary rather than direct `ns.config.components` inspection
  
- runtime packaging includes reachable registry-owned assets
  
- runtime CSS with repo-local `url(...)` ownership is rejected after Phase 1 migration
  
- all `@import` rules in shipped runtime CSS are rejected
  
- `data:` URLs remain allowed
  
- the runtime exposes resolved asset URLs through component-scoped `Helpers`
  
- components can consume those asset URLs lazily without hardcoding their own component ids
  
- unbound helper asset lookup fails clearly
  
- font installation runs through the explicit runtime font-installation call rather than through implicit side effects
  
- `FontAssets` descriptor keys and registry asset keys stay consistent
  

---

## Completion criteria

PLAN17 is complete when all of the following are true:

- a release Codex session can gather structured release evidence with `npm run release:prepare`
  
- `release:prepare` enforces a clean git-based start, fails hard when no baseline tag exists, runs `npm run check:all`, revalidates git state after checks,
   suppresses unbounded check log output, fails hard on any changed tracked path that matches no declared group, and returns the structured 
  change information Codex needs for the version decision as a single `SUMMARY_JSON=...` line
  
- Codex can choose the next version from that output without the tool deciding for it
  
- Codex can write only the canonical release note in `releases/{semver}/`
  
- `npm run release:create -- --version X.Y.Z` validates state, reruns `npm run check:all`, revalidates state before mutation, validates version metadata drift, prints the starting `HEAD` SHA for manual recovery, updates version files, creates the canonical zip, stages only the exact expected files, creates the release commit, verifies the worktree is clean, and creates the lightweight local tag
  
- the canonical release artifacts live in `releases/{semver}/`
  
- `README.md` is fully user focused
  
- `documentation/guides/create-release.md` exists and is linked from `documentation/TABLEOFCONTENTS.md`
  
- `AGENTS.md` remains the canonical shared AI instruction source
  
- `plugin.js` remains the single source of truth for internal bootstrap script order, and release tooling derives that order only through the constrained extractor contract
  
- the shared runtime-required component list is the single source of truth for always-loaded runtime-required components
  
- all runtime assets are registry-owned through mandatory keyed `assets`
  
- components access registry-owned assets through component-scoped runtime helpers rather than ad-hoc path construction
  
- child component creation paths explicitly rebind helpers when instantiating asset-owning children
  
- `shadowCss` access runs through a validated loader/runtime boundary instead of direct registry inspection by components
  
- repo-local runtime asset ownership through CSS `url(...)`, shipped CSS `@import`, and shipped JavaScript hardcoded asset paths has been removed and forbidden by checks, including in non-registry shipped config files
  
- mandatory redistribution notices for bundled runtime assets are included in the canonical zip when required
  
- `FontAssets` descriptor keys and registry asset keys are validated against each other
  
- `releases/**` Markdown files are treated as release artifacts rather than documentation-tree pages
  
- the first stable bootstrap release `v1.0.0` exists locally as a lightweight tag as part of PLAN17 completion
  
- GitHub Releases publishes only the committed canonical artifacts from `releases/{semver}/` when the exact SemVer tag, resolved tagged commit, release note, and release commit are exactly consistent