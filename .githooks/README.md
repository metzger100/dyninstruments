# Local Git Hooks

Git does not activate tracked hooks automatically. The normal development setup activates this hook for each clone:

```bash
npm run setup
npm run hooks:doctor
```

Use `npm run hooks:install` to repair or reinstall only the hook. `pre-push` runs `npm run check:all` exactly once and
blocks the push when the gate fails. Run `npm run hooks:doctor` to verify setup or receive the exact repair command
after Git configuration drifts.
