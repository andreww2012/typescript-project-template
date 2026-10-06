## Setup checklist

This project was created from [@andreww2012](https://github.com/andreww2012)'s [generic TypeScript project template](https://github.com/andreww2012/typescript-project-template).
Review these things and you're good to go:

### `package.json`

- [ ] Review [the license](./LICENSE.md)
- [ ] Review the installed dependencies, `engines` and `devEngines` fields
- [ ] Review the scripts section
<!-- @if lib -->
- [ ] Add `keywords`
<!-- @endif -->

### pnpm settings

- [ ] Review [the pnpm workspace config file](./pnpm-workspace.yaml) (even if you don't use workspace/monorepo features, this file is the only way of configuring pnpm)

<!-- @if prettier -->
### Prettier

- [ ] Review if you're satisfied with [the Prettier ignores](./.prettierignore)
- [ ] Review the commented out lines [in the Prettier config file](./prettier.config.ts)

<!-- @endif -->
<!-- @if oxfmt -->
### oxfmt

- [ ] Review [the oxfmt config file](./oxfmt.config.ts), including the ignored files

<!-- @endif -->
### TypeScript

- [ ] Review the [TypeScript config file](./tsconfig.json)

### ESLint

- [ ] Review the commented out lines [in the ESLint config file](./eslint.config.ts)

<!-- @if cspell -->
### CSpell

- [ ] Review [the CSpell config file](./cspell.config.ts)

<!-- @endif -->
<!-- @if knip -->
### knip

- [ ] Review [the knip config file](./knip.config.ts)

<!-- @endif -->
<!-- @if vitest -->
### Vitest

- [ ] Review [the Vitest config file](./vitest.config.ts)

<!-- @endif -->
<!-- @if lib -->
### tsdown

- [ ] Review [the tsdown config file](./tsdown.config.ts) and replace [the example code](./src/index.ts)

<!-- @endif -->
<!-- @if ci -->
### CI

- [ ] Review [the CI workflow](./.github/workflows/ci.yml)
<!-- @if changesets -->
- [ ] Allow GitHub Actions to create pull requests in the repository settings (Actions → General), so that changesets can open release pull requests
- [ ] Set up [trusted publishing](https://docs.npmjs.com/trusted-publishers) on npm, so that CI can publish the package
<!-- @endif -->
<!-- @if lychee -->
- [ ] Review [the lychee config file](./lychee.toml)
<!-- @endif -->

<!-- @endif -->
<!-- @if dependabot -->
### Dependabot

- [ ] Review [the Dependabot config file](./.github/dependabot.yml)

<!-- @endif -->
<!-- @if renovate -->
### Renovate

- [ ] Install [the Renovate GitHub app](https://github.com/apps/renovate) for the repository
- [ ] Review [the Renovate config file](./renovate.json)

<!-- @endif -->
<!-- @if ncu -->
### npm-check-updates

- [ ] Review [the `ncu` config file](./.ncurc.js), see [its options](https://github.com/andreww2012/typescript-project-template/tree/main/packages/npm-check-updates-config#options)

<!-- @endif -->
<!-- @if changesets -->
### Changesets

- [ ] Review [the changesets config file](./.changeset/config.json)

<!-- @endif -->
### Git

- [ ] Review [the `.gitignore` file](./.gitignore)
<!-- @if commitlint -->
- [ ] Review [the `commitlint` config file](./commitlint.config.ts)
<!-- @endif -->
<!-- @if lefthook -->
- [ ] Review [the `lefthook` config file](./lefthook.yml)
<!-- @endif -->

### AI

- [ ] Review [the `AGENTS.md` file](./AGENTS.md)

<!-- @if contributors -->
### all-contributors

- [ ] Add yourself with `nr contrib:add <your GitHub login> code`

<!-- @endif -->
### ⚠️ Final TODO item

- [ ] Remove this checklist :-)
<!-- @if contributors -->

## Contributors

<!-- eslint-disable markdown-preferences/padding-line-between-blocks, markdown/require-alt-text -->
<!-- cspell:disable -->

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

<!-- eslint-enable markdown-preferences/padding-line-between-blocks, markdown/require-alt-text -->

<!-- cspell:enable -->
<!-- @endif -->
