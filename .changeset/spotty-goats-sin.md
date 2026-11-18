---
"@andreww2012/typescript-project-template": minor
---

`cspell.config.ts` of new projects now uses [`@andreww2012/cspell-config`](https://npmx.dev/@andreww2012/cspell-config). It skips exactly the files that git ignores instead of using CSpell's `useGitignore` (via [`gitignore-reader-x`](https://npmx.dev/gitignore-reader-x)), and doesn't report GitHub advisory ids like `GHSA-xxxx-xxxx-xxxx`
