# @andreww2012/commitlint-config [![npm](https://img.shields.io/npm/v/@andreww2012/commitlint-config)](https://npmx.dev/@andreww2012/commitlint-config)

[@andreww2012](https://github.com/andreww2012)'s config for [commitlint](https://commitlint.js.org), based on [`@commitlint/config-conventional`](https://npmx.dev/@commitlint/config-conventional), with configurable lengths and commit types, and spell checking.

## Usage

```sh
pnpm i -D @andreww2012/commitlint-config @commitlint/cli
```

Replace `pnpm i` with the installation command of your package manager.

Create `commitlint.config.ts`:

```ts
import {commitlintConfig} from '@andreww2012/commitlint-config';

export default commitlintConfig({
  lengths: {
    header: {max: 100},
    body: {maxLine: false},
  },
  types: {
    wip: true,
    style: false,
  },
  spelling: {
    check: {body: 'warn'},
    ignoreWords: ['monorepo'],
  },
});
```

## Defaults

The config has the rules of `@commitlint/config-conventional`, so it doesn't need to be installed or extended.
Its parser preset ([`conventional-changelog-conventionalcommits`](https://npmx.dev/conventional-changelog-conventionalcommits)) is used too, but not its `prompt` settings.

All rules fail with an error, and none only warn.
These rules are different from `@commitlint/config-conventional`:

- `header-max-length` is `120` instead of `100`.
- `body-max-line-length` is disabled.
- `subject-case` only forbids `pascal-case` and `upper-case`, so subjects may start with a proper name.
- `subject-full-stop` is disabled, as subjects may end with an abbreviation.

There's also a rule of its own, `scope-no-whitespace`: scopes can't have spaces, so `feat(foo,bar)` is fine, but `feat(foo, bar)` isn't.

If `cspell` is in `dependencies` or `devDependencies` of `package.json`, commit messages are also spell checked with [CSpell](https://cspell.org), see the `spelling` option.

## Options

All [commitlint options](https://commitlint.js.org/reference/configuration.html) are passed to commitlint and replace the defaults, except these:

- `rules` are merged with the default ones.
- `plugins`: plugin objects are merged into one, together with the plugin that has the rules of this config, because commitlint only keeps the last plugin object.

The extra options are:

- `lengths`: lengths in characters of the commit message parts: `header`, `type`, `scope`, `subject`, `body` and `footer`.
  Each part can have `min` and `max`, and `body` and `footer` can also have `maxLine`, the max length of each line.
  They set the [length rules](https://commitlint.js.org/reference/rules.html) (`body: {maxLine: 100}` sets `body-max-line-length`) and are merged with the default ones by part, and then by field: `header: {min: 10}` keeps `max: 120`.
  `false` disables a rule.
  Length rules in `rules` take priority over `lengths`.
- `types`: commit types to add (`true`) or remove (`false`), like `{wip: true, style: false}`.
  The default ones are the same as in `@commitlint/config-conventional`: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style` and `test`.
  `type-enum` in `rules` takes priority over `types`.
- `spelling`: spell checking with [CSpell](https://cspell.org), which uses the CSpell config of the project, like `cspell.config.ts`.
  `true` enables it with the default options and `false` disables it.
  By default, it's enabled if `cspell` is in `dependencies` or `devDependencies` of `package.json`.
  It needs `cspell-lib` v10, an optional peer dependency.
  pnpm and npm make the one installed with `cspell` available, so there's usually nothing else to install.
  Otherwise (for example, with Yarn PnP), install `cspell-lib` too: if spelling is enabled without it, the config throws an error.
  Each commit message part has its own rule, like `subject-spelling`.
  The options are:
  - `check`: parts to check, `true` for errors, `'warn'` for warnings and `false` to skip a part.
    It's merged with the default one, which checks all parts except `header`: it has `type`, `scope` and `subject` in it, so their mistakes would be reported twice.
  - `ignoreWords`: words to allow in commit messages, in addition to the CSpell config.
- `cwd`: directory with `package.json`, `process.cwd()` by default.
  CSpell looks for its config in `process.cwd()` anyway.
