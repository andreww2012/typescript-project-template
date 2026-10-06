# @andreww2012/npm-check-updates-config

[@andreww2012](https://github.com/andreww2012)'s config for [npm-check-updates](https://github.com/raineorshine/npm-check-updates) (ncu), with per-package targets, blocked versions and named groups.

## Usage

```sh
pnpm add -D @andreww2012/npm-check-updates-config npm-check-updates
```

Create `.ncurc.js` (or `.ncurc.mjs` if `package.json` has no `"type": "module"`):

```js
import {ncuConfig} from '@andreww2012/npm-check-updates-config';

export default ncuConfig({
  targets: {
    typescript: 'minor',
  },
  blockedVersions: {
    // 2.3.0 breaks the build
    'some-package': '2.3.0',
  },
  groups: {
    '@vue': {packages: ['vue'], name: 'Vue'},
  },
});
```

## Defaults

- `cache: true` with `cacheExpiration: 30` (minutes).
  The cache is in `node_modules/.cache/npm-check-updates/cache.json`.
- `format: ['group']` and `interactive: true`.
- `workspaces: true` if `pnpm-workspace.yaml` or `workspaces` in `package.json` lists packages, so that ncu updates them and pnpm catalogs too.
  If the root is listed too (as `.` or `./`), also `root: false`, so that it isn't checked twice.
  ncu doesn't allow `workspaces` with `--workspace`, `--deep` or `--doctor`, so add `--no-workspaces` to use them.
- `targets`: `@types/node` is only updated to new minor and patch versions, because its major version should match the lowest supported Node.js version.
- `groups`:
  - `Package manager` with `bun`, `npm`, `pnpm` and `yarn`, which goes first.
  - `ESLint` with `@eslint/*`, `eslint` and `eslint-config-un`.
  - `cspell` with `@cspell/*` and `cspell`.
  - `vitest` with `@vitest/*` and `vitest`.
- Packages that aren't in `groups` are split into `1. 📦 Direct dependencies` and `2. 🧑‍💻 Dev dependencies`, as listed in `package.json`.

## Options

All [ncu options](https://github.com/raineorshine/npm-check-updates#options) are passed to ncu and replace the defaults.
To never update a package, use ncu's [`reject`](https://github.com/raineorshine/npm-check-updates#reject).
The extra options are:

- `cwd`: directory with `package.json`, `pnpm-workspace.yaml` and `node_modules`, `process.cwd()` by default.
  Pass `import.meta.dirname` to use the directory of the config file.
- `targets`: [targets](https://github.com/raineorshine/npm-check-updates#target) by package name, merged with the default ones.
  Other packages use `target`, `latest` by default.
  `minor` and `patch` work even when the target is set on the command line (like `ncu -t latest`): updates that change the major version (or the minor version for `patch`) are skipped.
  `false` removes a default target.
- `blockedVersions`: semver ranges by package name to never update to, like a known broken release.
- `groups`: groups shown with `format: ['group']`.
  They are merged with the default ones by key, and then by field: `{'@eslint': {packages: ['eslint']}}` keeps the `ESLint` name.
  `false` removes a default group.
  A group key that starts with `@` is a scope, and all packages of the scope are in the group.
  Any other key also matches the package with this name.
  Each group can have:
  - `packages`: other packages in the group.
  - `name`: shown name, the key without `@` by default.
  - `icon`: `📁` by default.
  - `priority`: `3` by default.
    Groups are sorted by this number, shown before their names.
    Direct dependencies are `1` and dev dependencies are `2`.
    `null` hides the number, and such groups go last.

These ncu options work together with the extra options instead of replacing them:

- `target` is used for packages that aren't in `targets`.
- `filterResults` runs after the checks of `targets` and `blockedVersions`.
- `groupFunction` groups the packages that aren't in `groups`, instead of splitting them into direct and dev dependencies.

For aliases like `"@types/node24": "npm:@types/node@24.0.0"`, `targets` and `blockedVersions` use the real package name (`@types/node`).
