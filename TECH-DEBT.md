# Technical Debt

**Status:** ✅ Active | Current known implementation and maintenance risks

## Overview

This file tracks known debt moved out of AGENTS/CLAUDE so those files remain compact routing maps.

## Key Details

- Some legacy files are still close to or above the 300-line target; avoid expanding them and isolate new logic where possible.
- Documentation can drift after refactors if registry and runtime touchpoints are not updated together; run `node tools/check-docs.mjs` for doc integrity checks.

## Future TODOs

- Converge formatter usage on the runtime boundary: migrate remaining direct widget calls to `avnav.api.formatter` over to `Helpers.applyFormatter()`.

## Related

- [documentation/guides/documentation-maintenance.md](documentation/guides/documentation-maintenance.md)
- [documentation/conventions/coding-standards.md](documentation/conventions/coding-standards.md)
