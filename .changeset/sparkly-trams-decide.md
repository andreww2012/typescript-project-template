---
"@andreww2012/typescript-project-template": minor
---

Added the `--workspace` option to make new projects pnpm workspaces with the root as their only package, which ncu needs to update catalogs. It's on by default with `--catalogs yes` and changes the git tags of changesets releases from `v1.0.0` to `name@1.0.0`
