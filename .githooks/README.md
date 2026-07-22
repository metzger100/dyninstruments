# Local Git Hooks

The tracked pre-push hook is clone-local. Enable it once for every clone:

```bash
npm run hooks:install
npm run hooks:doctor
```

`pre-push` runs `npm run check:all` exactly once and blocks the push when the gate fails. Run `npm run hooks:doctor` to
verify setup or receive the exact repair command after Git configuration drifts.
