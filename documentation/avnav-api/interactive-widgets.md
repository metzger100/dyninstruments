# Interactive Widgets

**Status:** Current.

## Overview

This page documents interaction ownership from the dyninstruments runtime perspective.

Runtime resolves interaction policy and action callbacks per update and injects them into renderer payloads.

Policy model:

- interaction.mode: dispatch or passive
- pageId and containerOrientation as separate context facts
- normalized callbacks under surfacePolicy.actions

## Key Details

- `interaction.mode` is either `dispatch` or `passive`; runtime resolves this policy per update, not once at
  registration.
- `pageId` and `containerOrientation` are surfaced as separate context facts alongside the interaction mode, not bundled
  into it.
- Normalized action callbacks are exposed under `surfacePolicy.actions`; renderers must dispatch only through these
  callbacks, never by re-deriving their own action logic.
- In `dispatch` mode, the committed renderer attaches direct DOM listeners and suppresses blank-space event propagation.
- In `passive` mode, the committed renderer attaches no action listeners at all.
- Host probing and React coupling are isolated inside `TemporaryHostActionBridge`; other code must not reach into host
  APIs or React directly for interaction handling.

## dyninstruments HTML Interaction Model

- dispatch mode: committed renderer attaches direct DOM listeners and suppresses blank-space propagation
- passive mode: committed renderer does not attach action listeners
- renderers dispatch only through normalized callbacks
- host probing/React coupling stays inside TemporaryHostActionBridge

## Related

- ../architecture/runtime-lifecycle.md
- ../architecture/cluster-widget-system.md
- ../architecture/html-renderer-lifecycle.md
