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

- `pre-push` -> runs `npm run check:strict` (fail-closed)

Push is blocked when any strict check fails.
