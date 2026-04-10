# Interactive Widgets

**Status:** ✅ Reference | Host interaction context and dyninstruments policy integration

## Overview

This page documents interaction ownership from the dyninstruments runtime perspective.

Runtime resolves interaction policy and action callbacks per update and injects them into renderer payloads.

Policy model:

- interaction.mode: dispatch or passive
- pageId and containerOrientation as separate context facts
- normalized callbacks under surfacePolicy.actions

## dyninstruments HTML Interaction Model

- dispatch mode: committed renderer attaches direct DOM listeners and suppresses blank-space propagation
- passive mode: committed renderer does not attach action listeners
- renderers dispatch only through normalized callbacks
- host probing/React coupling stays inside TemporaryHostActionBridge

## Related

- ../architecture/runtime-lifecycle.md
- ../architecture/cluster-widget-system.md
- ../architecture/html-renderer-lifecycle.md
