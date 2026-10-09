---
"@andreww2012/typescript-project-template": minor
---

New `--ts-extensions` option: by default, new projects use `.ts` extensions in imports, which ESLint enforces, and their `tsconfig.json` has `allowImportingTsExtensions` and `noEmit`. Use `--ts-extensions no` to keep `.js` extensions
