---
"@andreww2012/typescript-project-template": minor
---

New questions:

- App or published library (built with tsdown and checked with attw)
- For libraries: changesets (with the GitHub or the default changelog format) and all-contributors
- The lowest supported Node.js version, which also sets `@types/node` and `target`/`lib` in `tsconfig.json`
- pnpm 12 or 11
- oxfmt or Prettier
- Tools to set up: knip, CSpell, commitlint, lefthook and Vitest
- Extra CSpell languages
- Dependency updater: ncu, Dependabot, Renovate or none
- CI with GitHub Actions, optionally with lychee

Other changes:

- Add `LICENSE.md`
- Fix `types` in `tsconfig.json`, so that the code can use Node.js APIs
- Enable the misc ESLint configs and stop linting `.agents/style-guide.md`
- Remove the empty `.npmrc`
- Add `.gitattributes` to keep LF line endings on every OS
- Reinstall dependencies after checkouts and merges that change the lockfile (lefthook)
- Add VS Code settings for ESLint, TypeScript 7 and commit message length
