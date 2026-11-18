# @andreww2012/cspell-config [![npm](https://img.shields.io/npm/v/@andreww2012/cspell-config)](https://npmx.dev/@andreww2012/cspell-config)

[@andreww2012](https://github.com/andreww2012)'s config for [CSpell](https://npmx.dev/cspell), which skips the files that git ignores and has dictionaries for JavaScript and TypeScript projects.

## Usage

```sh
pnpm i -D @andreww2012/cspell-config cspell
```

Replace `pnpm i` with the installation command of your package manager.

Create `cspell.config.ts`:

<!-- cspell:ignore deburr shiki stringifier unocss -->

```ts
import {cspellConfig} from '@andreww2012/cspell-config';

export default cspellConfig({
  words: {
    packages: ['shiki', 'unocss'],
    terms: ['deburr', 'stringifier'],
  },
  ignorePaths: ['fixtures/**'],
});
```

## Defaults

- The files that git ignores are skipped, see the [`gitignore`](#gitignore) option.
- `enableGlobDot: true`, so that files and directories that start with a dot are checked too.
- `ignorePaths`: `**/.gitignore`, `**/.git/**`, `**/.vscode/extensions.json`, `**/pnpm-lock.yaml` and `patches/*.patch`.
- `ignoreRegExpList`: GitHub advisory ids, like `GHSA-xxxx-xxxx-xxxx`, and code point escapes, like `\u{FEFF}`.
- `dictionaries`: `npm`, `node`, `typescript` and `fullstack`.

## Options

All [CSpell options](https://cspell.org/docs/Configuration) are passed to CSpell and replace the defaults, except these:

- `dictionaries`, `ignorePaths` and `ignoreRegExpList`: an array is added to the default values, and a function gets the default values and returns the ones to use instead.
  For example, `dictionaries: () => []` removes the default dictionaries, and `ignorePaths: (paths) => paths.filter((path) => path !== '**/.gitignore')` removes one default path.
  The default values of `ignorePaths` include the files that git ignores.
- `words` can also be an object of word groups, like in the example above.
  The keys are only names of the groups.

The options below are added by this config.

### `cwd`

Directory to read the gitignore rules for, `process.cwd()` by default.
The default is fine when CSpell is started inside the project.
If it may be started elsewhere, for example by an editor extension, the files that git ignores are checked, and a big directory (like the home directory) may be read, which is slow.
To avoid that, pass `import.meta.dirname`, the directory of the config file: CSpell calls config functions without arguments, so the config can't find it itself.

### `gitignore`

Whether to skip the files that git ignores, `true` by default.
The rules are read with [gitignore-reader-x](https://npmx.dev/gitignore-reader-x), the same way git reads them: from nested `.gitignore` files, `.git/info/exclude` and so on.
An object turns it on with the options of gitignore-reader-x, except `cwd`, like `{sources: {globalIgnoreFile: true}}`.
Each ignored path has `cwd` as its root, so the paths are right even if the config file is in another directory, or `globRoot` is set.
Don't turn on CSpell's own `useGitignore` too: it can ignore files that git doesn't.
