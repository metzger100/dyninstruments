# Task: Release-Time Bootstrap Bundle Concatenation

## Goal

Add a release-time concatenation step that combines all 65 bootstrap manifest scripts into a single `bootstrap-bundle.js` file. `plugin.js` loads this single file when it exists (release builds), eliminating 64 extra HTTP round-trips. When it does not exist (dev mode), `plugin.js` falls back to the current manifest-based sequential loading. No runtime architecture, layering, or ownership boundaries change.

## Context

`plugin.js` currently loads `config/bootstrap-manifest.js`, which lists 65 script paths. It then loads those 65 scripts sequentially (each waits for the previous via a promise chain). This works correctly but creates a long HTTP waterfall that is expensive on high-latency or low-power clients like e-book readers.

The bundle is generated only at release-time into the staging directory — it never exists in the source tree. Development and testing continue to use individual files. The individual scripts still ship in the release zip alongside the bundle for debuggability.

## Mandatory Preflight

Before writing any code, read these files in order:

1. `documentation/TABLEOFCONTENTS.md`
2. `documentation/conventions/coding-standards.md`
3. `documentation/conventions/smell-prevention.md`

These define the project's coding conventions, header requirements, and quality gates. Follow them exactly.

## Verified Baseline (check each against current files before implementing)

1. `plugin.js` (94 lines) is the plugin entry point. It is an IIFE that resolves `avnav.api`, computes `BASE` from `AVNAV_BASE_URL`, sets up `window.DyniPlugin`, loads `config/bootstrap-manifest.js` via `loadScriptOnce`, then sequentially loads every path in `ns.config.bootstrapManifest`, then calls `window.DyniPlugin.runtime.runInit()`.

2. `config/bootstrap-manifest.js` sets `config.bootstrapManifest` to an array of 65 relative script paths. The last entry is `"runtime/init.js"`. This file is loaded at runtime by `plugin.js` and at tooling-time by `tools/components-registry-loader.mjs`.

3. `tools/release-zip-builder.mjs` (148 lines) exports `buildReleaseManifest(rootDir)` and `validateManifest(rootDir, files)`. It also exports `isRuntimePath(filePath)`. It imports `loadBootstrapManifest` and `loadComponentsRegistry` from `./components-registry-loader.mjs`.

4. `tools/components-registry-loader.mjs` (64 lines) exports `loadBootstrapManifest(rootDir)` which uses `vm.runInNewContext` to execute `runtime/namespace.js` and `config/bootstrap-manifest.js` in a sandbox and returns the manifest array. It also exports `SENTINEL_BASE`.

5. `tools/release-create.mjs` (238 lines) exports `createRelease(options)`. Its internal `createReleaseZip({ rootDir, manifestFiles, outputZipAbs, runCommand })` stages files into a temp directory under `stageRoot = stageParent + "/dyninstruments"`, then zips them. It imports `buildReleaseManifest` and `validateManifest` from `./release-zip-builder.mjs`.

6. `tests/tools/release-zip-builder.test.js` tests `buildReleaseManifest` and `validateManifest` against the real repository and a temp directory.

7. `tests/tools/release-create.test.js` tests `createRelease` with a mock `manifestBuilder`, `manifestValidator`, and `runCommand` in a temp git repo.

8. `tests/plugin/plugin-bootstrap.test.js` tests `plugin.js` using `createScriptContext` + `runIifeScript` helpers and a `createDomHarness` that simulates script loading. It verifies the exact script-loading order and `runInit` invocation.

9. The project convention is: no ES module import/export in plugin runtime files (IIFE or UMD wrappers only). Tooling files under `tools/` use ES modules.

10. `check-file-size.mjs` scans `SCAN_ROOTS = ["plugin.js", "runtime", "cluster", "config", "shared", "widgets"]`. It does not scan `tools/` or generated files. The bundle will exist only in the release staging directory, not in the source tree.

11. `runtime/init.js` defines `runtime.runInit` but does not self-invoke. It is always the last entry in the bootstrap manifest.

12. Every source JS file that is a runtime component or runtime IIFE must have a header comment block: `Module`, `Documentation`, `Depends`.

## Hard Constraints

- **No new files in the source tree.** `bootstrap-bundle.js` is generated only during `createReleaseZip` into the staging directory. It must never be committed to the repository.
- **Dev mode must keep working unchanged.** When `bootstrap-bundle.js` does not exist (404 on load), `plugin.js` must fall back to the current manifest-based sequential loading with identical behavior.
- **No change to the bootstrap manifest format or content.** `config/bootstrap-manifest.js` remains exactly as-is.
- **No change to any runtime file except `plugin.js`.**
- **No change to `tools/components-registry-loader.mjs`.**
- **The bundle must concatenate scripts in manifest order.** Execution order matters because later scripts depend on earlier ones.
- **The release zip must still include all individual bootstrap scripts.** The bundle is an optimization, not a replacement.
- **Follow all conventions from coding-standards.md and smell-prevention.md.**

## Implementation

### 1. `tools/release-zip-builder.mjs` — add `buildBootstrapBundleContent`

Add a new exported function:

```
buildBootstrapBundleContent(rootDir) → string
```

Behavior:

- Call `loadBootstrapManifest(rootDir)` to get the ordered array of 65 paths.
- For each path, read the file content from `path.join(rootDir, relPath)` as UTF-8.
- Concatenate all file contents in manifest order, separated by a single newline between each.
- Prepend a short comment header: `// bootstrap-bundle.js — generated at release time, do not edit\n`
- Return the concatenated string.
- If the manifest is empty or missing, throw an Error.
- If any listed file cannot be read, throw an Error that includes the path.

Do not add a CLI entry point. This is a library function called by `release-create.mjs`.

### 2. `tools/release-create.mjs` — generate bundle during staging

**Import:** Add `buildBootstrapBundleContent` to the existing top-level import from `./release-zip-builder.mjs`.

**Injectable option:** In `createRelease`, add a `bundleBuilder` option following the existing `manifestBuilder`/`manifestValidator` pattern:

```
const bundleBuilder = options.bundleBuilder || buildBootstrapBundleContent;
```

Thread `bundleBuilder` into the `createReleaseZip` call (add it to the options object passed to that function).

**Staging step:** In `createReleaseZip`, after the loop that copies `manifestFiles` into the staging directory, add a step that:

1. Calls `bundleBuilder(rootDir)` to get the bundle string.
2. Writes it to `path.join(stageRoot, "bootstrap-bundle.js")`.

This happens inside the existing `try` block, before the `zip` command runs, so the bundle is included in the zip.

### 3. `plugin.js` — try bundle first, fall back to manifest

Replace the current `loadBootstrapManifest()` call chain at the bottom of the IIFE with logic that:

1. Tries to load `bootstrap-bundle.js` (relative to `BASE`) via the existing `loadScriptOnce` helper.
2. **On success:** the bundle has already executed all 65 manifest-listed scripts in order, so all runtime services are registered. Skip the manifest walk and go directly to `window.DyniPlugin.runtime.runInit()`. (Note: `config/bootstrap-manifest.js` is not one of the manifest-listed scripts, so `ns.config.bootstrapManifest` will not be set in the bundle path — that is fine because nothing in the bundle path reads it.)
3. **On error (bundle does not exist):** fall back to the current behavior — load `config/bootstrap-manifest.js`, then walk the manifest sequentially, then call `runInit()`.

**Critical promise structure:** Use the two-argument `.then(onFulfilled, onRejected)` form so the rejection handler only catches the *bundle load* failure. Do NOT use `.then(…).catch(…)` — that would also catch errors from `runInit()` in the success path, silently swallowing real failures and falling back to manifest loading (which would re-execute scripts the bundle already ran). Correct shape:

```
loadScriptOnce(bundleId, bundleSrc)
  .then(
    function () { return window.DyniPlugin.runtime.runInit(); },
    function () {
      return loadBootstrapManifest()
        .then(function () { return window.DyniPlugin.runtime.runInit(); });
    }
  )
  // dyni-lint-disable-next-line catch-fallback-without-suppression -- Top-level bootstrap should log startup failures without turning them into unhandled browser promise rejections.
  .catch(function (e) { console.error("dyninstruments bootstrap failed:", e); });
```

The lint suppression comment is carried over from the existing code. The `catch-fallback-without-suppression` pattern checker matches `.catch(function (e) {` syntax and `plugin.js` is in scope.

The bundle-attempt script ID should be `"dyni-internal-bootstrap-bundle-js"`.

Keep the existing `loadBootstrapManifest` function as-is and call it only in the fallback path. The catch on the bundle load must not log an error — a missing bundle is expected in dev mode.

### 4. Tests

#### `tests/tools/release-zip-builder.test.js` — add tests for `buildBootstrapBundleContent`

Add a new `describe("buildBootstrapBundleContent", ...)` block with these tests:

- **"concatenates manifest scripts in order with header comment"**: Create a temp directory. Write `runtime/namespace.js` that initializes the `DyniPlugin` namespace (matching the real file's `ns.config = ns.config || {}` pattern). Write `config/bootstrap-manifest.js` that sets `config.bootstrapManifest` to a 2-entry array pointing at two dummy script files. Write those two dummy files with known content. Call `buildBootstrapBundleContent(tempRoot)`. Assert the result starts with the `// bootstrap-bundle.js` header comment. Assert both file contents appear in order, separated by a newline.
  
  Note: `loadBootstrapManifest(rootDir)` requires `runtime/namespace.js` and `config/bootstrap-manifest.js` to exist and be executable in a `vm.runInNewContext` sandbox. The sandbox is initialized with `DyniPlugin: { baseUrl: "__CHECK_BASE__/", config: {} }`. So you need to create a valid `runtime/namespace.js` and `config/bootstrap-manifest.js` that work in that sandbox. Look at how `components-registry-loader.mjs` calls them.

- **"throws when a manifest-listed file is missing"**: Create a temp directory with a valid manifest pointing at a non-existent script. Assert `buildBootstrapBundleContent` throws with the missing path in the message.

#### `tests/tools/release-create.test.js` — verify bundle appears in staged zip

In the existing test that intercepts the `zip` command and captures `zippedEntries`:

1. Add a `bundleBuilder` mock to the `createRelease` options: `bundleBuilder() { return "// mock bundle content\n"; }`.
2. Update the existing `expect(zippedEntries).toEqual([...])` assertion to include `"bootstrap-bundle.js"` in its sorted position (first in the array, alphabetically before `"assets/fonts/…"`).

This mirrors the existing `manifestBuilder` mock pattern and avoids coupling the test to `loadBootstrapManifest`'s sandbox internals.

#### `tests/plugin/plugin-bootstrap.test.js` — update existing tests and add bundle-path tests

**Existing tests break** because `plugin.js` now attempts the bundle first. Three existing tests assume the manifest path runs immediately. Update them:

- **"loads bootstrap-manifest first, then listed scripts in order, then calls runtime.runInit"**: Add `"dyni-internal-bootstrap-bundle-js"` to `failScriptIds` to simulate dev mode. Prepend `BASE + "bootstrap-bundle.js"` to the expected `loadedScriptSrc` array (the failed bundle attempt still appears in `appendedScripts`).

- **"captures wrapper-local AvNav API for runtime bootstrap scripts"**: Add `"dyni-internal-bootstrap-bundle-js"` to `failScriptIds`. No other assertion changes needed — this test checks `avnavApi` and `runInit`, not script order.

- **"logs a clear error when bootstrap manifest cannot be loaded"**: Add `"dyni-internal-bootstrap-bundle-js"` to the existing `failScriptIds` (alongside `"dyni-internal-config-bootstrap-manifest-js"`). Update the `appendedScripts` length assertion from 1 to 2 (bundle attempt + manifest attempt).

**Add these new tests:**

- **"loads bootstrap-bundle.js first and skips manifest walk when bundle succeeds"**: Set up a `createDomHarness` where all script loads succeed. Provide a context where `DyniPlugin.runtime.runInit` is a mock. Run `plugin.js`. Assert that the first script loaded (after any setup) has src ending in `bootstrap-bundle.js`. Assert that `config/bootstrap-manifest.js` was NOT loaded (it should not appear in `dom.appendedScripts`). Assert `runInit` was called once.

- **"falls back to manifest loading when bootstrap-bundle.js fails"**: Set up a `createDomHarness` where the bundle script ID (`dyni-internal-bootstrap-bundle-js`) triggers `onerror`. Provide a working manifest in the context. Run `plugin.js`. Assert that after the bundle failure, `config/bootstrap-manifest.js` is loaded, followed by all manifest scripts in order, and `runInit` is called once.

Look at the existing tests in `plugin-bootstrap.test.js` for the exact patterns — they use `createScriptContext`, `runIifeScript`, `createDomHarness`, and `flushPromises`. The `createDomHarness` accepts a `failScriptIds` option to simulate load failures. Match the existing test style exactly.

### 5. Documentation

#### `documentation/architecture/runtime-lifecycle.md`

In the **Startup Sequence** section, update step 1 to describe the two-path loading:

> 1. plugin.js attempts to load bootstrap-bundle.js (a single concatenated file generated at release time). If it succeeds, all bootstrap scripts have executed; plugin.js skips the manifest walk. If it fails (dev mode), plugin.js loads config/bootstrap-manifest.js, then loads the manifest-listed scripts in order, reaching runtime/theme-runtime.js before runtime/init.js.

The rest of the startup sequence (steps 2–8) stays unchanged.

#### `documentation/architecture/asset-system.md`

In the **Overview** section, add a sentence:

> Release builds also include `bootstrap-bundle.js`, a concatenation of all bootstrap manifest scripts, which `plugin.js` loads as a single request when available.

## Completion Gate

After implementation, run:

```bash
npm run check:all
```

This runs `check:core` (coding standards, smells, docs, file sizes, headers, dependencies, UMD, naming), `test:coverage:check` (all tests + coverage thresholds), and `perf:check`. All must pass.
