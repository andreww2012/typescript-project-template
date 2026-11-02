# @andreww2012/commitlint-config [![npm](https://img.shields.io/npm/v/@andreww2012/commitlint-config)](https://npmx.dev/@andreww2012/commitlint-config)

[@andreww2012](https://github.com/andreww2012)'s config for [commitlint](https://commitlint.js.org), based on [`@commitlint/config-conventional`](https://npmx.dev/@commitlint/config-conventional), with configurable lengths and commit types, spell checking, and a way to forbid co-authors, like AI tools.

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
  coAuthors: {deny: ['ai'], allow: ['copilot']},
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

There are also rules of its own:

- `scope-no-whitespace`: scopes can't have spaces, so `feat(foo,bar)` is fine, but `feat(foo, bar)` isn't.
- `co-authored-by`, disabled by default: forbids co-authors in `Co-authored-by` trailers, see the `coAuthors` option.

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
- `coAuthors`: co-authors to forbid in `Co-authored-by` trailers.
  `false` forbids all of them, and `true`, the default, allows all of them.
  An object chooses which ones to forbid:
  - `deny`: co-authors to forbid, all of them by default.
  - `allow`: co-authors to allow even if they match `deny`.

  Both are lists of regular expressions, which are matched against trailer values like `Name <email>`, and presets, which match the emails that AI tools use.
  `'ai'` matches all of them, and [the other presets](#co-author-presets) match one tool each.
  For example:
  - `{deny: ['ai']}` forbids AI tools.
  - `{deny: ['ai', /@example\.com>$/u], allow: ['copilot']}` forbids AI tools except GitHub Copilot, and people with `@example.com` emails.
  - `{allow: [/@example\.com>$/u]}` only allows people with `@example.com` emails.

  It sets the `co-authored-by` rule, which takes the same object as its value, like `[2, 'never', {deny: ['ai']}]`.
  This rule in `rules` takes priority over `coAuthors`.
- `cwd`: directory with `package.json`, `process.cwd()` by default.
  CSpell looks for its config in `process.cwd()` anyway.

## Co-author presets

The presets for the `coAuthors` option match these AI tools by their emails.
For some of them, these are emails of their GitHub accounts, which get into `Co-authored-by` trailers when their suggestions are applied in pull requests.

| Preset       | Tool                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `aider`      | [Aider](https://aider.chat)                                                                                    |
| `amp`        | [Amp](https://ampcode.com)                                                                                     |
| `augment`    | [Augment Code](https://www.augmentcode.com)                                                                    |
| `bito`       | [Bito](https://bito.ai)                                                                                        |
| `claude`     | [Claude Code](https://claude.com/product/claude-code) and its GitHub app                                       |
| `cline`      | [Cline](https://cline.bot)                                                                                     |
| `codex`      | [OpenAI Codex](https://openai.com/codex) and its code review bot                                               |
| `coderabbit` | [CodeRabbit](https://www.coderabbit.ai)                                                                        |
| `continue`   | [Continue](https://continue.dev)                                                                               |
| `copilot`    | [GitHub Copilot](https://github.com/features/copilot), including Copilot Autofix                               |
| `crush`      | [Crush](https://github.com/charmbracelet/crush)                                                                |
| `cursor`     | [Cursor](https://cursor.com) and its code review bot                                                           |
| `devin`      | [Devin](https://devin.ai) and [Devin Desktop](https://devin.ai/desktop) (formerly Windsurf)                    |
| `ellipsis`   | [Ellipsis](https://www.ellipsis.dev)                                                                           |
| `factory`    | [Factory Droid](https://factory.com)                                                                           |
| `gemini`     | [Antigravity](https://antigravity.google) and [Gemini Code Assist](https://github.com/apps/gemini-code-assist) |
| `goose`      | [Goose](https://goose-docs.ai)                                                                                 |
| `greptile`   | [Greptile](https://www.greptile.com)                                                                           |
| `jules`      | [Jules](https://jules.google)                                                                                  |
| `junie`      | [Junie](https://junie.jetbrains.com)                                                                           |
| `kilo`       | [Kilo](https://kilo.ai) (formerly Kilo Code)                                                                   |
| `kiro`       | [Kiro](https://kiro.dev)                                                                                       |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                |
| `openhands`  | [OpenHands](https://openhands.dev)                                                                             |
| `qodo`       | [Qodo](https://www.qodo.ai)                                                                                    |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                               |
| `roomote`    | [Roomote](https://roomote.dev)                                                                                 |
| `trae`       | [Trae](https://www.trae.ai)                                                                                    |
| `warp`       | [Warp](https://www.warp.dev) and its Oz agent                                                                  |
