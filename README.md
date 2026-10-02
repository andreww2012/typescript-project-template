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
- `--utils`: utility library to install, `@andreww2012/unutils` (default) or `none`

Outside of an interactive terminal (for example in CI), pass `--utils`, because the CLI can't ask for it there.
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

Every file in `template/` is copied as is, except these:

- `package.json`: name, description and author come from the options, and `@andreww2012/unutils` is removed if not wanted
- `README.md`: gets the project name and description on top

Files ignored by git are skipped.
Symlinks (like `.claude/skills`) are created again with `ln -s`, because npm packages can't contain them.
The lockfile isn't part of the template, so dependencies are resolved on the first install.

The CLI code is in [`src/`](./src): [`src/template.ts`](./src/template.ts) describes the options and how the files are changed.

## Development

`nr build` saves the files from `template/` into `dist/files.json` and compiles the CLI.
It runs automatically before publishing.

To try the template from source:

```sh
nr dev --directory ../my-test-project
```
