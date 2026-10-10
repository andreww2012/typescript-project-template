---
"@andreww2012/typescript-project-template": patch
---

The `u:pm` script of new projects now updates pnpm with `pnpm self-update`, as `ncu` can't update `devEngines`. With pnpm 12, new projects also record `autoDedupe` in the lockfile, so installs don't resolve it again
