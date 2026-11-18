# @andreww2012/typescript-project-template

## 0.6.0

### Minor Changes

- [`6aa0496`](https://github.com/andreww2012/typescript-project-template/commit/6aa04963c2cbec0373d26a17ba6f973959912706) - Added the `--release-age-fallback` option (off by default) to set pnpm's [`minimumReleaseAgeStrict: false`](https://pnpm.io/settings/dependency-resolution#minimumreleaseagestrict) in new projects

- [`a6b8cd4`](https://github.com/andreww2012/typescript-project-template/commit/a6b8cd421e6872f47bbe0085f7540c9a215facc4) - Added support for repeating the `--tools` and `--languages` flags, like `--tools knip --tools cspell`. Comma-separated lists still work

- [`526f14e`](https://github.com/andreww2012/typescript-project-template/commit/526f14e866ac4ec446aa624682bc0ee767f3dfc4) - Added the `--actions-lock` option (on by default with `--ci yes`) to lock GitHub Actions dependencies of new projects with [`gh actions-lock`](https://github.com/github/gh-actions-lock) instead of pinning commit SHAs in workflows

- [`becf08f`](https://github.com/andreww2012/typescript-project-template/commit/becf08f05822ab8280a50cc28dadc1ccfd84a359) - Added the `--catalogs` option (off by default) to keep dependency versions of new projects in pnpm catalogs, with ESLint requiring `catalog:` in `package.json`

- [`d48e7bb`](https://github.com/andreww2012/typescript-project-template/commit/d48e7bbf6304bb84e74ec825c76815d359b7bc9a) - Added the `--workspace` option (on by default with `--catalogs yes`) to make new projects pnpm workspaces, which changes the git tags of changesets releases from `v1.0.0` to `name@1.0.0`

- [`5d7131f`](https://github.com/andreww2012/typescript-project-template/commit/5d7131f2c0b9610518a05725d9560c703ca1c604) - `cspell.config.ts` of new projects now uses [`@andreww2012/cspell-config`](https://npmx.dev/@andreww2012/cspell-config). It skips exactly the files that git ignores instead of using CSpell's `useGitignore` (via [`gitignore-reader-x`](https://npmx.dev/gitignore-reader-x)), and doesn't report GitHub advisory ids like `GHSA-xxxx-xxxx-xxxx`

### Patch Changes

- [`a6c51e0`](https://github.com/andreww2012/typescript-project-template/commit/a6c51e062eb818a7be3da4b86d1505e5d05125f0) - Updated `.gitignore` of new projects to [github/gitignore@`8ba69a4`](https://github.com/github/gitignore/tree/8ba69a4220df77b696fe97b60fb70eb668fb00e1)

- [`e66bdc1`](https://github.com/andreww2012/typescript-project-template/commit/e66bdc1b5571e87abbdcc5a3a5b351aebd56bb56) - Enabled tsdown's `unbundle` mode in new `lib` projects, so the build output mirrors the source files

- [`a3b5c46`](https://github.com/andreww2012/typescript-project-template/commit/a3b5c4664917cb31e4514969488a5def49fb0314) - Made CI job names of new projects shorter and clearer, like `Types` instead of `Typecheck (tsgo)`

- [`8da66e9`](https://github.com/andreww2012/typescript-project-template/commit/8da66e96f50ace1e7a5e3e065ff17e7edb289afe) - Moved the `attw` and `publint` checks of new `lib` projects from the `check:package` script into the `tsdown` config

- [`b21b832`](https://github.com/andreww2012/typescript-project-template/commit/b21b83251270d31476d825f94d81705b080d78f8) - Fixed the `commit-msg` hook of new projects failing in a git worktree when the main repository's path has spaces

- [`beae84a`](https://github.com/andreww2012/typescript-project-template/commit/beae84acc8abba80587472675aaec2555c55b691) - Enabled pnpm's [`trustPolicyExcludePrune`](https://pnpm.io/settings/dependency-resolution#trustpolicyexcludeprune) and, in workspaces, [`disallowWorkspaceCycles`](https://pnpm.io/workspaces#disallowworkspacecycles) in new projects

- [`86f7c88`](https://github.com/andreww2012/typescript-project-template/commit/86f7c8858108777a7c9df9625a4ae1366fd056fd) - Made `pnpm-lock.yaml` changes hidden in `git diff` output via the `.gitattributes` rule

- [`927ab39`](https://github.com/andreww2012/typescript-project-template/commit/927ab396ca865cad8fa3acafc69e0ec28ff4f9fd) - Updated the AI guidelines of new projects to [`@andreww2012/ai-guidelines`](https://npmx.dev/@andreww2012/ai-guidelines) v0.2.11

## 0.5.0

### Minor Changes

- [`983bb40`](https://github.com/andreww2012/typescript-project-template/commit/983bb401316feef21936a4baabc771f5e3af8a4e) - Made `commitlint` in new projects forbid AI tools as co-authors in `Co-authored-by` trailers by default

### Patch Changes

- [`b739b94`](https://github.com/andreww2012/typescript-project-template/commit/b739b94fd44d703874415a9c67c9ddd8b9e00a8a) - Git hooks of new projects only install dependencies when the lockfile, `pnpm-workspace.yaml` or patches change, and do it after a rebase instead of installing the dependencies of its base first

## 0.4.0

### Minor Changes

- [`996c580`](https://github.com/andreww2012/typescript-project-template/commit/996c580a0c34a19a06bc79a6b141fc355f663d7c) - New `--save-exact` option to keep `saveExact: true` in `pnpm-workspace.yaml` and make ESLint require exact dependency versions

- [`efd5656`](https://github.com/andreww2012/typescript-project-template/commit/efd56568b152310ba9539061d540f0f79c9b1194) - New projects get [`utilery`](https://npmx.dev/utilery) instead of `@andreww2012/unutils`, so `--utils` now accepts `utilery` (default) or `none`

- [`3102c79`](https://github.com/andreww2012/typescript-project-template/commit/3102c799fe013966cd42b82393e476291e32a523) - `commitlint.config.ts` of new projects now uses [`@andreww2012/commitlint-config`](https://npmx.dev/@andreww2012/commitlint-config) instead of extending `@commitlint/config-conventional`. Its rules are the same, except that scopes can't have spaces now (like `feat(foo, bar)`), and that commit messages are spell checked if CSpell is used

### Patch Changes

- [`0183e80`](https://github.com/andreww2012/typescript-project-template/commit/0183e809c522c26431b30d7e233748712cacaf29) - Git hooks of new projects run scripts and install dependencies with `pnpm` instead of `@antfu/ni` commands, which only worked if `@antfu/ni` was installed globally

- [`5e7c5fa`](https://github.com/andreww2012/typescript-project-template/commit/5e7c5fa43d45912dde938febd23a95bc6e864c88) - New projects get the AI guidelines from [`@andreww2012/ai-guidelines`](https://npmx.dev/@andreww2012/ai-guidelines) v0.2.6

## 0.3.0

### Minor Changes

- [`41139da`](https://github.com/andreww2012/typescript-project-template/commit/41139da4c829c52a1e7f95136b7745a80b4f5cff) - New `--ts-extensions` option: by default, new projects use `.ts` extensions in imports, which ESLint enforces, and their `tsconfig.json` has `allowImportingTsExtensions` and `noEmit`. Use `--ts-extensions no` to keep `.js` extensions

### Patch Changes

- [`c92027f`](https://github.com/andreww2012/typescript-project-template/commit/c92027f2a64e367ff0638920c999a22c19add7aa) - New projects get the AI guidelines from [`@andreww2012/ai-guidelines`](https://npmx.dev/@andreww2012/ai-guidelines) v0.2.5

- [`c92027f`](https://github.com/andreww2012/typescript-project-template/commit/c92027f2a64e367ff0638920c999a22c19add7aa) - New projects use `eslint-config-un` 1.0.0-rc.5 and pass its checks: `commitlint.config.ts` uses the `RuleConfigSeverity` enum, and the ESLint config drops the options that are now defaults. Markdown code blocks are only formatted with the chosen formatter, and `eslint-plugin-format` is no longer installed

- [`561c0ff`](https://github.com/andreww2012/typescript-project-template/commit/561c0ff154acba45787645e54d1aea047dbc28d2) - The `u:pm` script of new projects now updates pnpm with `pnpm self-update`, as `ncu` can't update `devEngines`. With pnpm 12, new projects also record `autoDedupe` in the lockfile, so installs don't resolve it again

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
