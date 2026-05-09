# Guide: Performance Gate

**Status:** ✅ Implemented | Fail-closed CI perf comparison against versioned core baseline

## Overview

Use this guide for perf harness execution and strict gate evaluation against committed AvNav core baseline metrics.

## Key Details

- Harness mode: simulated Chromium headless lab (`node + jsdom`) with deterministic seed.
- Default run config:
  - `cpu_slowdown_factor: 6`
  - `warmup_iterations: 5`
  - `measured_iterations: 200`
  - `deterministic_seed: 1337`
- Scenario set (exact key match required against baseline):
  - `speed_radial`
  - `wind_radial`
  - `xte_text`
  - `active_route_html`
  - `map_zoom_html`
  - `center_display_text`
  - `gpspage_all_widgets`
- Report startup section:
  - `startup.component_ids`
  - `startup.component_count`
- Lifecycle span instrumentation owners:
  - `ClusterWidget.translateFunction`
  - `ClusterWidget.renderHtml`
  - `HostCommitController.scheduleCommit->onCommit` (`waitStage`: `raf-1`, `raf-2`, `raf-3`, `raf-4`, `mutation-observer`, `observer-timeout`, `timeout`)
  - `SurfaceSessionController.reconcileSession`
  - `HtmlSurfaceController.attach`
  - `HtmlSurfaceController.update`
  - `CanvasDomSurfaceAdapter.schedulePaint->paintNow`
  - renderer entrypoints: `Renderer.renderHtml`, `Renderer.renderCanvas`
- Cold activation metrics emitted per scenario:
  - `cold_activation.compute_ms`
  - `cold_activation.wait_ms`
  - `cold_activation.total_ms`
  - `cold_activation.shadow_css_preload.url_count`
  - `cold_activation.shadow_css_preload.time_ms`
- Warm same-route update metrics emitted per scenario:
  - `host_commit_wait_ms`
  - `surface_reconcile_wait_ms`
  - `canvas_paint_queue_wait_ms`
  - `wait_ratio = wait_ms / (compute_ms + wait_ms)`
- Cold activation samples are awaited before collection, and HTML routes preload shadow CSS through the harness's deterministic local-file fetch stub.
- Top-level warm-update aliases remain available for gate compatibility:
  - `compute_ms`
  - `wait_ms`
  - `total_ms`
  - `wait_ratio`
  - `wait_breakdown_ms`
  - `long_tasks`
  - `hotspots`
- Hotspot summary per scenario includes top-15 by `self_ms` and `total_ms` with module/file attribution.

## API/Interfaces

Commands:

```bash
npm run perf:run
npm run perf:check
```

Artifacts:

- Run report JSON: `artifacts/perf/perf-report.json`
- Run report markdown: `artifacts/perf/perf-report.md`
- Gate markdown: `artifacts/perf/perf-check.md`
- Baseline source of truth: `perf/baselines/core-lab-v1.json`

Baseline contract keys:

```json
{
  "baseline_schema_version": 1,
  "baseline_id": "core-lab-v1",
  "environment": { "cpu_slowdown_factor": 6, "warmup_iterations": 5, "measured_iterations": 200 },
  "startup": { "component_ids": ["ClusterWidget"], "component_count": 1 },
  "scenario_order": ["speed_radial", "wind_radial", "xte_text", "active_route_html", "map_zoom_html", "center_display_text", "gpspage_all_widgets"],
  "scenarios": {
    "speed_radial": {
      "cold_activation": {
        "compute_ms": { "p50": 0, "p95": 0, "p99": 0 },
        "wait_ms": { "p95": 0 },
        "total_ms": { "p95": 0 },
        "shadow_css_preload": {
          "sample_count": 0,
          "url_count": { "p95": 0 },
          "time_ms": { "p95": 0 }
        }
      },
      "warm_update": {
        "compute_ms": { "p50": 0, "p95": 0, "p99": 0 },
        "wait_ms": { "p95": 0 },
        "total_ms": { "p95": 0 }
      },
      "compute_ms": { "p50": 0, "p95": 0, "p99": 0 },
      "wait_ms": { "p95": 0 },
      "total_ms": { "p95": 0 },
      "long_tasks": { "count_50ms": 0, "max_ms": 0 },
      "hotspots": { "top_by_self": [], "top_by_total": [] }
    }
  },
  "hotspot_allowlist": { "scenario_id": ["function_name|file"] }
}
```

Gate rules (`tools/perf/thresholds.mjs`):

- Per scenario:
  - `compute_p50 <= baseline * 2.0`
  - `compute_p95 <= baseline * 2.4`
  - `compute_p99 <= baseline * 2.8`
  - `wait_p95 <= baseline * 1.8`
- Aggregate (`gpspage_all_widgets`):
  - `total_p95 <= baseline * 2.2`
  - `long_task_count_50ms <= baseline + 2`
  - `max_long_task_ms <= 120`
- Hotspots:
  - `hotspots.source` must equal `cpu-profile` (fail-closed if profiling attribution is missing)
  - hottest function self share `<= 45%` unless allowlisted
  - top-5 cumulative self share `<= 80%`
- Scenario key set must match baseline exactly (count + names).

## Related

- [documentation-maintenance.md](documentation-maintenance.md)
- [../architecture/host-commit-controller.md](../architecture/host-commit-controller.md)
- [../architecture/surface-session-controller.md](../architecture/surface-session-controller.md)
- [../architecture/canvas-dom-surface-adapter.md](../architecture/canvas-dom-surface-adapter.md)
