# Local Git Hooks

This repository ships tracked hooks in `.githooks/`.

## One-Time Setup

```bash
npm run hooks:install
```

This configures:

- `git config core.hooksPath .githooks`
- executable flag on `.githooks/pre-push`

## Verify Hook Setup

```bash
npm run hooks:doctor
```

## Active Hook

- `pre-push` -> runs `npm run check:all` (fail-closed)

Push is blocked when any full-gate check fails.
