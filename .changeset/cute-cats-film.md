---
"@andreww2012/typescript-project-template": patch
---

Git hooks of new projects only install dependencies when the lockfile, `pnpm-workspace.yaml` or patches change, and do it after a rebase instead of installing the dependencies of its base first
