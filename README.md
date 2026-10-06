# @andreww2012/typescript-project-template

This is [@andreww2012](https://github.com/andreww2012)'s personal generic TypeScript project template, powered by [Bingo](https://create.bingo).

## Usage

Create a new project in the `my-project` directory:

```sh
pnpm dlx @andreww2012/typescript-project-template --directory my-project
```

The CLI asks for everything it can't infer.
Template options:

- `--repository`: repository name, also used as the package name (defaults to the directory name)
- `--owner`: GitHub user or organization (inferred from the GitHub CLI if you're logged in)
- `--author`: `package.json` author (defaults to `--owner`)
- `--description`: short description for `package.json` and `README.md`
- `--kind`: `app` (default) or `lib`, a published library: it's built with tsdown, its types are checked with [attw](https://github.com/arethetypeswrong/arethetypeswrong.github.io) before publishing, `package.json` isn't private and has `homepage`, `bugs`, `repository`, `exports`, `types` and `files`, and ESLint uses `mode: 'lib'`
- `--changesets`: only for `lib`, `none` (default), `github` (with `@changesets/changelog-github`) or `default` (with the default changelog format)
- `--contributors`: only for `lib`, `no` (default) or `yes` to set up [all-contributors](https://allcontributors.org)
- `--node`: the lowest Node.js major version to support, out of those in `engines.node` of `template/package.json` (the lowest one by default); `@types/node` and `target`/`lib` in `tsconfig.json` match it
- `--pnpm`: `12` (default) or `11`
- `--formatter`: `oxfmt` (default) or `prettier`
- `--tools`: comma-separated tools to set up: `knip`, `cspell`, `commitlint`, `lefthook`, `publint` (these are the default) and `vitest`; `publint` is only for `lib`: [publint](https://publint.dev) checks the package before publishing, like attw
- `--languages`: only with `cspell`, comma-separated extra CSpell languages, none by default: `en-GB`, `nl`, `fr`, `de`, `it`, `pl`, `pt`, `ru`, `es`, `tr`, `uk`
- `--updater`: dependency updater, `ncu` (default, run by hand), `dependabot`, `renovate` or `none`
- `--ci`: `yes` (default) to set up GitHub Actions like in this repository (checks for every chosen tool, tests on every supported Node.js version, and the changesets release), or `no`
- `--lychee`: only with `--ci yes`, `no` (default) or `yes` to check links with [lychee](https://lychee.cli.rs) in CI
- `--guidelines`: how `AGENTS.md` links [the AI guidelines](https://github.com/andreww2012/ai-guidelines), `local` (default) to copy them into `.agents/guidelines.md` or `remote` to link the file on GitHub
- `--utils`: utility library to install, `@andreww2012/unutils` (default) or `none`

Outside of an interactive terminal (for example in CI), pass all options that have a default, because the CLI can't ask for them there.
Add `--remote` to also create the repository on GitHub.
See [the Bingo CLI docs](https://create.bingo/cli) for all other flags.

After that, install the dependencies and go through the setup checklist in the new `README.md`.

### With "Use this template" button on GitHub

Create a repository from this template on GitHub, clone it and run the same command inside it (without `--directory`).
Bingo sees that the repository was created from this template, removes the template files and creates the project in their place.

### Existing projects

Running the command inside an existing git repository updates it to the latest template version (Bingo's "transition" mode).
It overwrites files with the template versions, *including* `package.json` and `README.md`, so review the changes with `git diff` before committing.

## How it works

The files of new projects live in [`template/`](./template).
They are completely independent from the files of this repository, which only builds and publishes the CLI:
the tools here (ESLint, Prettier, CSpell, knip and so on) ignore `template/` and use their own configs.

Files in `template/` are copied as is, except the parts that depend on the options.
Such parts are wrapped in comment lines, which are removed from the result:

```ts
// @if oxfmt
import oxfmtConfig from './oxfmt.config.js';
// @endif
```

`@if !feature` keeps the lines when the feature is *not* used, and `#` and `<!-- -->` comments work too.
A feature is an option value (like `lib`, `oxfmt` or `knip`), `pnpm11`/`pnpm12`, `changesets`, `changelog-github`, `local-guidelines` or a CSpell language code.
Which files, `package.json` scripts and dependencies need which features is listed in [`src/template.ts`].
`template/package.json` lists all dependencies that might be needed, so that `ncu` keeps all of them up to date.
That includes `@types/node` for every supported Node.js major version, with aliases like `"@types/node24": "npm:@types/node@24.19.1"`.
The `oxfmt` version is in the `format` catalog of `template/pnpm-workspace.yaml`, because the ESLint plugin that formats Markdown code blocks must use the same version.

These files are also changed:

- `package.json`: name, description and author come from the options, and `engines.node` only keeps the versions from `--node` on
- `.github/actions/prepare/action.yml` and `.github/workflows/ci.yml`: Node.js versions match the supported ones
- `tsconfig.json`: `target` and `lib` match the lowest supported Node.js version, like in [`@tsconfig/bases`](https://github.com/tsconfig/bases)
- `pnpm-workspace.yaml`: the `allowBuilds` entry of lefthook gets its version from `template/package.json`
- `README.md`: gets the project name and description on top
- `LICENSE.md`: gets the current year and the author
- `cspell.config.ts`: gets the extra languages
- `.changeset/config.json`: gets the changelog format

`AGENTS.md` and `.agents/guidelines.md` aren't in `template/`.
They come from [`@andreww2012/ai-guidelines`](https://github.com/andreww2012/ai-guidelines), so updating this dependency updates them too.

Files ignored by git are skipped.
Symlinks (like `.claude/skills`) are created again with `ln -s`, because npm packages can't contain them.
The lockfile isn't part of the template, so dependencies are resolved on the first install.

The CLI code is in [`src/`](./src):

- [`src/options.ts`](./src/options.ts) describes the options
- [`src/prompts.ts`](./src/prompts.ts) asks the questions Bingo can't ask on its own (conditional and multi-select ones), before Bingo starts
- [`src/template.ts`] describes how the files are changed

## Development

`nr build` saves the files from `template/` into `dist/files.json` and compiles the CLI.
It runs automatically before publishing.

The pnpm 11 version isn't stored in any `package.json`, so update it in [`src/template.ts`] by hand.

To try the template from source:

```sh
nr dev --directory ../my-test-project
```

[`src/template.ts`]: ./src/template.ts
