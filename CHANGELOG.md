# @andreww2012/typescript-project-template

## 0.2.0

### Minor Changes

- [`5282cbd`](https://github.com/andreww2012/typescript-project-template/commit/5282cbdf873d3e8caf7f760fd966c20610614013) - `.ncurc.js` of new projects now uses [`@andreww2012/npm-check-updates-config`](https://npmx.dev/@andreww2012/npm-check-updates-config) instead of having all of the config inside

- [`1aed177`](https://github.com/andreww2012/typescript-project-template/commit/1aed177a9a5ae2391361e4ef0fa863c2c3b3d61d) - Added support for [`publint`](https://publint.dev) tool for `lib` projects, chosen by default

- [`fa7761c`](https://github.com/andreww2012/typescript-project-template/commit/fa7761ca5cbd039c39ddee4b3c8f9611b8d7073b) - `AGENTS.md` and the AI guidelines now come from [`@andreww2012/ai-guidelines`](https://npmx.dev/@andreww2012/ai-guidelines): `.agents/guidelines.md` replaces `.agents/style-guide.md`. The new `--guidelines` option sets how `AGENTS.md` links them: `local` (default) copies them into the project, `remote` links the file on GitHub

- [`3e0a088`](https://github.com/andreww2012/typescript-project-template/commit/3e0a088ae2cf3ebe1f16dc91ce058cc582cde83a) - The CLI no longer supports Node.js 22, new projects still can. The Node.js versions for new projects now come from `engines.node` of `template/package.json` instead of `package.json` of the template repository

### Patch Changes

- [`72c2fe7`](https://github.com/andreww2012/typescript-project-template/commit/72c2fe76c385932838dc41f89ad69f49f1bd0d4f) - `commitlint` now fails instead of warning when there's no blank line before the commit body or footer

- [`6976673`](https://github.com/andreww2012/typescript-project-template/commit/6976673054bdd8047d525afb8f04dab2e1699b1e) - `.gitignore` of new projects is updated to [github/gitignore@`0e5d690`](https://github.com/github/gitignore/tree/0e5d690153ca3da8a4a1aef2d053406f408f531c)

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
