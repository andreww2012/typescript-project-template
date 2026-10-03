# @andreww2012/typescript-project-template

## 0.1.0

### Minor Changes

- [`815b150`](https://github.com/andreww2012/typescript-project-template/commit/815b150ce37dd6bc056a918569f77a52324d5704) - New questions:
  
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

- [`12252d8`](https://github.com/andreww2012/typescript-project-template/commit/12252d874cfd9eb597b05006a7be8c5535aaa09a) - Drop the `CLAUDE.md` symlink, since Claude Code reads `AGENTS.md` now

### Patch Changes

- [`e7a3459`](https://github.com/andreww2012/typescript-project-template/commit/e7a3459fbaac953385148ff41d6774f3e7471e1c) - Update `.agents/style-guide.md` to the latest version (CSpell now skips it through its config instead of an inline comment) and update the generated configs and workflows to follow it

## 0.0.1

### Patch Changes

- [`e82cf81`](https://github.com/andreww2012/typescript-project-template/commit/e82cf8138f1cc7178f7bd4c98dd08e36bff5637d) - First release: a [Bingo](https://create.bingo) template CLI that creates new projects from the generic TypeScript project template. Try it with `pnpm dlx @andreww2012/typescript-project-template`
