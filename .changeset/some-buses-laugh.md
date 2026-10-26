---
"@andreww2012/typescript-project-template": minor
---

`commitlint.config.ts` of new projects now uses [`@andreww2012/commitlint-config`](https://npmx.dev/@andreww2012/commitlint-config) instead of extending `@commitlint/config-conventional`. Its rules are the same, except that scopes can't have spaces now (like `feat(foo, bar)`), and that commit messages are spell checked if CSpell is used
